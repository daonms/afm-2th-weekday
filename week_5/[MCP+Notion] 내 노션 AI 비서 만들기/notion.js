const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// DB IDs
const DB = {
  BOOK:    "2d2e19e9-1a1b-81e0-a6d4-e51ac6a0a45e",
  TRAVEL:  "2d2e19e9-1a1b-81d1-a1ce-c85399c6f588",
  TASK:    "e01e19e9-1a1b-82b9-bf6c-0163a269591b",
  PROJECT: "b01e19e9-1a1b-8309-856c-8183f4512aeb",
  SUMMARY: "38de19e9-1a1b-8372-ac29-81fd62f5c4df",
};

async function queryBooks({ status } = {}) {
  const res = await notion.databases.query({
    database_id: DB.BOOK,
    filter: status ? { property: "상태", select: { equals: status } } : undefined,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 10,
  });
  return res.results.map((p) => ({
    이름: p.properties["책이름"]?.title?.[0]?.plain_text ?? "제목없음",
    상태: p.properties["상태"]?.select?.name ?? "-",
    평가: p.properties["평가"]?.select?.name ?? "-",
    출판사: p.properties["출판사"]?.select?.name ?? "-",
    가격: p.properties["가격"]?.number ?? "-",
  }));
}

async function queryTravel({ country, category } = {}) {
  const filters = [];
  if (country)  filters.push({ property: "나라",  select: { equals: country } });
  if (category) filters.push({ property: "분류",  select: { equals: category } });
  const filter = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0] : { and: filters };

  const res = await notion.databases.query({
    database_id: DB.TRAVEL,
    filter,
    sorts: [{ property: "날짜", direction: "ascending" }],
    page_size: 20,
  });
  return res.results.map((p) => ({
    장소: p.properties["장소 (지도, 티켓, 예약권 등 서류)"]?.title?.[0]?.plain_text ?? "-",
    나라: p.properties["나라"]?.select?.name ?? "-",
    분류: p.properties["분류"]?.select?.name ?? "-",
    일차: p.properties["선택"]?.select?.name ?? "-",
    날짜: p.properties["날짜"]?.date?.start ?? "-",
    원: p.properties["원"]?.number ?? null,
    엔: p.properties["일본 엔"]?.number ?? null,
    달러: p.properties["미국달러"]?.number ?? null,
    대만달러: p.properties["대만 달러"]?.number ?? null,
  }));
}

async function queryTasks({ status } = {}) {
  const res = await notion.databases.query({
    database_id: DB.TASK,
    filter: status ? { property: "진행상황", status: { equals: status } } : undefined,
    sorts: [{ property: "태스크 기간", direction: "ascending" }],
    page_size: 15,
  });
  return res.results.map((p) => ({
    태스크: p.properties["태스크"]?.title?.[0]?.plain_text ?? "제목없음",
    진행상황: p.properties["진행상황"]?.status?.name ?? "-",
    기간시작: p.properties["태스크 기간"]?.date?.start ?? "-",
    기간종료: p.properties["태스크 기간"]?.date?.end ?? null,
    설명: p.properties["설명"]?.rich_text?.[0]?.plain_text ?? "-",
    프로젝트명: p.properties["프로젝트명"]?.select?.name ?? "-",
  }));
}

async function queryProjects({ status } = {}) {
  const res = await notion.databases.query({
    database_id: DB.PROJECT,
    filter: status ? { property: "상태", status: { equals: status } } : undefined,
    sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    page_size: 10,
  });
  return res.results.map((p) => ({
    프로젝트명: p.properties["프로젝트명"]?.title?.[0]?.plain_text ?? "제목없음",
    상태: p.properties["상태"]?.status?.name ?? "-",
    유형: p.properties["유형"]?.select?.name ?? "-",
    사업유형: p.properties["사업유형"]?.select?.name ?? "-",
    담당AI: p.properties["담당 AI"]?.multi_select?.map((x) => x.name).join(", ") ?? "-",
    날짜시작: p.properties["날짜"]?.date?.start ?? "-",
  }));
}

async function querySummary({ category, status } = {}) {
  const filters = [];
  if (category) filters.push({ property: "구분",  select: { equals: category } });
  if (status)   filters.push({ property: "상태",  status: { equals: status } });
  const filter = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0] : { and: filters };

  const res = await notion.databases.query({
    database_id: DB.SUMMARY,
    filter,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 10,
  });
  return res.results.map((p) => ({
    이름: p.properties["이름"]?.title?.[0]?.plain_text ?? "제목없음",
    구분: p.properties["구분"]?.select?.name ?? "-",
    상태: p.properties["상태"]?.status?.name ?? "-",
    프로젝트명: p.properties["프로젝트명"]?.multi_select?.map((x) => x.name).join(", ") ?? "-",
    생성일: p.properties["생성 일시"]?.created_time?.split("T")[0] ?? "-",
  }));
}

// Claude/Groq tool_use 도구 정의
const NOTION_TOOLS = [
  {
    name: "query_books",
    description: "노션 책 DB 조회. 상태(독서예정/독서중/독후감완료/구매완료 등)로 필터 가능.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "책 상태. 예: 독서예정, 독서중, 독후감완료" },
      },
    },
  },
  {
    name: "query_travel",
    description: "노션 여행 DB 조회. 나라(일본/대만 등)와 분류(식사/이동/숙소/관광/쇼핑)로 필터 가능.",
    input_schema: {
      type: "object",
      properties: {
        country:  { type: "string", description: "나라. 예: 일본, 대만, 태국" },
        category: { type: "string", description: "분류. 예: 식사, 이동, 숙소, 관광, 쇼핑" },
      },
    },
  },
  {
    name: "query_tasks",
    description: "DAONMS AI OS의 TASK DB 조회. 진행상황(예정/진행/피드백/완료)으로 필터 가능.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "진행상황. 예: 예정, 진행, 완료, 피드백" },
      },
    },
  },
  {
    name: "query_projects",
    description: "DAONMS AI OS의 PROJECT DB 조회. 상태(활성/보관)로 필터 가능.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "프로젝트 상태. 예: 활성, 보관" },
      },
    },
  },
  {
    name: "query_summary",
    description: "DAONMS AI OS의 SUMMARY DB 조회. 구분(회의/미팅/강의/통화 등)과 상태(예정/진행/완료)로 필터 가능.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", description: "구분. 예: 회의, 미팅, 강의, 통화, 컨설팅" },
        status:   { type: "string", description: "상태. 예: 예정, 진행, 완료" },
      },
    },
  },
];

async function runTool(name, input) {
  if (name === "query_books")    return await queryBooks(input);
  if (name === "query_travel")   return await queryTravel(input);
  if (name === "query_tasks")    return await queryTasks(input);
  if (name === "query_projects") return await queryProjects(input);
  if (name === "query_summary")  return await querySummary(input);
  return { error: "알 수 없는 도구" };
}

module.exports = { NOTION_TOOLS, runTool };
