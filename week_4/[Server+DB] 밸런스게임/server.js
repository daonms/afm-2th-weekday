require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// IP 추출 헬퍼
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

// 질문 목록 + 투표율 집계
app.get('/api/questions', async (req, res) => {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const results = await Promise.all(
    questions.map(async (q) => {
      const { count: totalA } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', q.id)
        .eq('choice', 'A');

      const { count: totalB } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', q.id)
        .eq('choice', 'B');

      const total = (totalA || 0) + (totalB || 0);
      const percentA = total === 0 ? 50 : Math.round(((totalA || 0) / total) * 100);
      const percentB = total === 0 ? 50 : 100 - percentA;

      return {
        ...q,
        votes_a: totalA || 0,
        votes_b: totalB || 0,
        total_votes: total,
        percent_a: percentA,
        percent_b: percentB,
      };
    })
  );

  res.json(results);
});

// 질문 등록
app.post('/api/questions', async (req, res) => {
  const { title, option_a, option_b } = req.body;

  if (!title || !option_a || !option_b) {
    return res.status(400).json({ error: '제목과 A/B 선택지를 모두 입력해주세요.' });
  }

  const { data, error } = await supabase
    .from('questions')
    .insert([{ title, option_a, option_b }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// 투표
app.post('/api/votes', async (req, res) => {
  const { question_id, choice } = req.body;
  const voter_ip = getClientIp(req);

  if (!question_id || !['A', 'B'].includes(choice)) {
    return res.status(400).json({ error: '올바른 question_id와 choice(A 또는 B)가 필요합니다.' });
  }

  // 중복 투표 확인
  const { data: existing } = await supabase
    .from('votes')
    .select('id, choice')
    .eq('question_id', question_id)
    .eq('voter_ip', voter_ip)
    .maybeSingle();

  if (existing) {
    if (existing.choice === choice) {
      return res.status(409).json({ error: '이미 같은 항목에 투표했습니다.', already_voted: true, choice: existing.choice });
    }
    // 다른 선택지로 변경
    const { error } = await supabase
      .from('votes')
      .update({ choice })
      .eq('id', existing.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: '투표가 변경되었습니다.', changed: true });
  }

  const { error } = await supabase
    .from('votes')
    .insert([{ question_id, choice, voter_ip }]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: '투표 완료!' });
});

// 특정 질문 결과
app.get('/api/questions/:id/results', async (req, res) => {
  const { id } = req.params;

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  if (qErr) return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });

  const { count: totalA } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', id)
    .eq('choice', 'A');

  const { count: totalB } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', id)
    .eq('choice', 'B');

  const total = (totalA || 0) + (totalB || 0);
  const percentA = total === 0 ? 50 : Math.round(((totalA || 0) / total) * 100);

  res.json({
    ...question,
    votes_a: totalA || 0,
    votes_b: totalB || 0,
    total_votes: total,
    percent_a: percentA,
    percent_b: 100 - percentA,
  });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
