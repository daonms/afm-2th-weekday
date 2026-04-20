require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");
const cron = require("node-cron");
const { NOTION_TOOLS, runTool } = require("./notion");

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const registeredChats = new Set();

const SYSTEM_PROMPT = `당신은 노션 AI 비서입니다. 사용자의 노션 워크스페이스에 연결되어 있습니다.

연결된 데이터베이스:
- 책 DB: 독서 목록, 상태(독서예정/독서중/독후감완료 등), 평가, 가격
- 여행 DB: 여행 일정, 나라별 지출, 숙소/식사/이동/관광 내역
- TASK DB: 업무 태스크, 진행상황(예정/진행/피드백/완료), 기간
- PROJECT DB: 프로젝트 목록, 상태(활성/보관), 유형
- SUMMARY DB: 회의/미팅/강의 등 요약 기록

사용자 질문에 맞는 도구를 호출해 데이터를 조회하고, 친절하고 간결하게 답하세요.

[언어 규칙 - 반드시 준수]
- 반드시 한국어로만 답변하세요.
- 일본어, 중국어, 기타 언어 절대 사용 금지.
- 기술 용어만 영어 허용 (예: DB, API).
- 사용자는 한국인입니다.`;

const GROK_TOOLS = NOTION_TOOLS.map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));

// RSS 피드에서 AI 뉴스 수집
async function fetchAINews() {
  const sources = [
    {
      name: "ZDNet Korea",
      url: "https://www.zdnet.co.kr/rss/?m=2&m2=1",
      emoji: "💻",
    },
    {
      name: "IT조선",
      url: "https://it.chosun.com/rss/S1N14.xml",
      emoji: "📰",
    },
    {
      name: "AI타임스",
      url: "https://www.aitimes.com/rss/allArticle.xml",
      emoji: "🤖",
    },
  ];

  const results = [];

  for (const src of sources) {
    try {
      const res = await fetch(src.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      const xml = await res.text();

      // RSS item 파싱 (title + link)
      const items = [];
      const itemRegex = /<item[\s\S]*?<\/item>/gi;
      const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i;
      const linkRegex = /<link>([\s\S]*?)<\/link>|<link\s[^>]*href="([^"]+)"/i;

      let match;
      while ((match = itemRegex.exec(xml)) !== null && items.length < 3) {
        const itemXml = match[0];
        const titleMatch = itemXml.match(titleRegex);
        const linkMatch = itemXml.match(linkRegex);
        const title = (titleMatch?.[1] || titleMatch?.[2] || "").trim();
        const link = (linkMatch?.[1] || linkMatch?.[2] || "").trim();
        if (title) items.push({ title, link });
      }

      if (items.length > 0) {
        results.push({ ...src, items });
      }
    } catch (e) {
      console.error(`[뉴스 수집 오류] ${src.name}:`, e.message);
    }
  }

  return results;
}

// AI 뉴스를 Groq으로 요약
async function summarizeNews(newsData) {
  if (newsData.length === 0) return null;

  const newsText = newsData
    .map(
      (src) =>
        `[${src.name}]\n` +
        src.items.map((item, i) => `${i + 1}. ${item.title}`).join("\n")
    )
    .join("\n\n");

  const res = await grok.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "당신은 AI 뉴스 큐레이터입니다. 반드시 한국어로만 답변하세요. 일본어 사용 절대 금지.",
      },
      {
        role: "user",
        content: `다음 AI/IT 뉴스 헤드라인을 분석해서 핵심 트렌드 2-3줄로 요약하고, 가장 주목할 기사 1개를 추천해주세요.\n\n${newsText}`,
      },
    ],
  });

  return res.choices[0].message.content;
}

async function askGrok(userMessage) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  while (true) {
    const response = await grok.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools: GROK_TOOLS,
      tool_choice: "auto",
    });

    const choice = response.choices[0];
    messages.push(choice.message);

    if (choice.finish_reason === "stop") {
      return choice.message.content ?? "결과를 가져오지 못했습니다.";
    }

    if (choice.finish_reason === "tool_calls") {
      for (const tc of choice.message.tool_calls) {
        const input = JSON.parse(tc.function.arguments);
        console.log(`[도구 호출] ${tc.function.name}`, input);
        const result = await runTool(tc.function.name, input);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    } else {
      break;
    }
  }

  return "응답을 처리하는 중 오류가 발생했습니다.";
}

// 아침 브리핑 생성 (업무 + AI 뉴스)
async function generateMorningBriefing() {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const prompt = `오늘은 ${today}입니다.
아침 브리핑을 작성해주세요:
1. TASK DB에서 진행 중인 태스크와 예정된 태스크를 조회해주세요.
2. PROJECT DB에서 활성 프로젝트 목록을 조회해주세요.
결과를 아침 업무 브리핑 형식으로 깔끔하게 정리해주세요.
이모지를 적절히 사용하고, 오늘 집중할 사항을 간략히 제안해주세요.`;

  const [briefing, newsData] = await Promise.all([
    askGrok(prompt),
    fetchAINews(),
  ]);

  let newsSummary = "";
  if (newsData.length > 0) {
    const summary = await summarizeNews(newsData);
    const headlines = newsData
      .map(
        (src) =>
          `${src.emoji} *${src.name}*\n` +
          src.items.map((item) => `• ${item.title}`).join("\n")
      )
      .join("\n\n");

    newsSummary = `\n\n📡 *오늘의 AI 뉴스*\n\n${headlines}\n\n💡 *트렌드 요약*\n${summary}`;
  }

  return briefing + newsSummary;
}

// 뉴스만 즉시 조회
async function getNewsOnly() {
  const newsData = await fetchAINews();
  if (newsData.length === 0) return "뉴스를 가져오지 못했습니다.";

  const summary = await summarizeNews(newsData);
  const headlines = newsData
    .map(
      (src) =>
        `${src.emoji} ${src.name}\n` +
        src.items.map((item) => `• ${item.title}`).join("\n")
    )
    .join("\n\n");

  return `📡 오늘의 AI 뉴스\n\n${headlines}\n\n💡 트렌드 요약\n${summary}`;
}

// 매일 오전 9시 신규 AI 시스템 보고 (KST 09:00 = UTC 00:00)
async function generateAISystemReport() {
  const newsData = await fetchAINews();
  if (newsData.length === 0) return "오늘 새로운 AI 시스템 소식을 가져오지 못했습니다.";

  const allHeadlines = newsData
    .flatMap((src) => src.items.map((item) => `[${src.name}] ${item.title}`))
    .join("\n");

  const res = await grok.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "당신은 AI 시스템 전문 리포터입니다. 반드시 한국어로만 답변하세요. 일본어 사용 절대 금지.",
      },
      {
        role: "user",
        content: `다음 뉴스 헤드라인 중 신규 AI 모델, AI 시스템, AI 서비스 출시/공개 소식만 골라서 정리해주세요.\n\n${allHeadlines}\n\n형식:\n🆕 [모델/시스템명] — 핵심 특징 한 줄\n\n없으면 "오늘 신규 AI 시스템 출시 소식은 없습니다."라고 답하세요.`,
      },
    ],
  });

  return res.choices[0].message.content;
}

cron.schedule("0 0 0 * * *", async () => {
  console.log("[스케줄] 오전 9시 AI 시스템 보고 전송 시작...");
  try {
    const report = await generateAISystemReport();
    for (const chatId of registeredChats) {
      await bot.sendMessage(
        chatId,
        `🤖 오늘의 신규 AI 시스템 보고 (오전 9시)\n\n${report}`
      );
    }
    console.log(`[스케줄] AI 시스템 보고 전송 완료 (${registeredChats.size}명)`);
  } catch (err) {
    console.error("[스케줄 오류]", err.message);
  }
}, {
  timezone: "Asia/Seoul",
});

// 매일 오전 6시 (KST = UTC+9)
cron.schedule("0 0 21 * * *", async () => {
  console.log("[스케줄] 아침 브리핑 전송 시작...");
  try {
    const briefing = await generateMorningBriefing();
    for (const chatId of registeredChats) {
      await bot.sendMessage(chatId, `☀️ 굿모닝! 오늘의 업무 브리핑입니다.\n\n${briefing}`);
    }
    console.log(`[스케줄] 브리핑 전송 완료 (${registeredChats.size}명)`);
  } catch (err) {
    console.error("[스케줄 오류]", err.message);
  }
}, {
  timezone: "Asia/Seoul",
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  registeredChats.add(chatId);

  if (text === "/start") {
    return bot.sendMessage(
      chatId,
      `안녕하세요! 노션 AI 비서입니다.\n\n` +
        `📚 책: "독서예정 책 추천해줘"\n` +
        `✈️ 여행: "대만 여행 식사 목록"\n` +
        `✅ 태스크: "진행 중인 태스크 보여줘"\n` +
        `📁 프로젝트: "활성 프로젝트 목록"\n` +
        `📝 요약: "최근 회의 요약"\n` +
        `📡 뉴스: "뉴스" 또는 "AI 뉴스"\n` +
        `🤖 신규AI: "AI시스템" 또는 "신규AI"\n\n` +
        `☀️ 매일 오전 6시 업무 브리핑 + AI 뉴스\n` +
        `🤖 매일 오전 9시 신규 AI 시스템 보고\n\n` +
        `지금 브리핑을 보려면 "오늘 브리핑" 이라고 입력하세요.`
    );
  }

  // 브리핑 즉시 요청
  if (text === "오늘 브리핑" || text === "브리핑") {
    await bot.sendChatAction(chatId, "typing");
    try {
      const briefing = await generateMorningBriefing();
      return bot.sendMessage(chatId, `☀️ 오늘의 업무 브리핑입니다.\n\n${briefing}`);
    } catch (err) {
      return bot.sendMessage(chatId, `오류: ${err.message}`);
    }
  }

  // 신규 AI 시스템 즉시 조회
  if (text === "AI시스템" || text === "신규AI" || text === "/AI시스템") {
    await bot.sendChatAction(chatId, "typing");
    try {
      const report = await generateAISystemReport();
      return bot.sendMessage(chatId, `🤖 신규 AI 시스템 보고\n\n${report}`);
    } catch (err) {
      return bot.sendMessage(chatId, `오류: ${err.message}`);
    }
  }

  // AI 뉴스 즉시 조회
  if (text === "뉴스" || text === "AI 뉴스" || text === "/뉴스") {
    await bot.sendChatAction(chatId, "typing");
    try {
      const news = await getNewsOnly();
      return bot.sendMessage(chatId, news);
    } catch (err) {
      return bot.sendMessage(chatId, `오류: ${err.message}`);
    }
  }

  await bot.sendChatAction(chatId, "typing");

  try {
    const reply = await askGrok(text);
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error("[오류]", err.status ?? "", err.message);
    await bot.sendMessage(chatId, `오류: ${err.message}`);
  }
});

console.log("🤖 노션 AI 비서 (Groq/Llama) 시작됨!");
console.log("☀️ 매일 오전 6시 (KST) 자동 브리핑 + AI 뉴스 예약됨");
console.log("📡 뉴스 수집: ZDNet Korea / IT조선 / AI타임스 (RSS)");
console.log("🤖 오전 9시 (KST) 신규 AI 시스템 보고 예약됨");
console.log("텔레그램에서 @Leepro77_bot 에게 메시지를 보내보세요.");
