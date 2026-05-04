import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = await readFile(join(__dirname, '..', 'index.html'), 'utf8');

const requiredPhrases = [
  '성향분석',
  '간단 분석',
  '심층 분석',
  '선천 성향',
  '후천 성향',
  '전략 가설',
  'Notion AI 회의 녹음',
  '동의 안내',
  '전사 붙여넣기',
  '다음 회의 전략',
  'Notion 요약을 전략으로 전환',
  'buildPersonalityReport',
  'buildNotionMeetingReport'
];

const forbiddenPhrases = [
  'MBTI 다자토론',
  '심리상담',
  'CBT',
  'MI 기법',
  '치료'
];

const missing = requiredPhrases.filter((phrase) => !html.includes(phrase));
const forbidden = forbiddenPhrases.filter((phrase) => html.includes(phrase));

if (missing.length || forbidden.length) {
  console.error(JSON.stringify({ missing, forbidden }, null, 2));
  process.exit(1);
}

console.log('class feature checks passed');
