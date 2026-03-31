# Project Claude Config

## gstack
Use `/browse` from `gstack` for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /daon-erp.

If gstack skills aren't working, run:
`cd .claude/skills/gstack && ./setup`

## DAONMS ERP 원격 서버 통제

### SSH 접속
- **서버**: daonms-i7-1 (100.123.134.44)
- **사용자**: i7dt
- **키**: `~/.ssh/id_ed25519`
- **명령어**: `ssh -i ~/.ssh/id_ed25519 i7dt@100.123.134.44 "<command>"`
- **서버 경로**: `/home/i7dt/daon-erp`

### 에이전트 선택 가이드
| 작업 | 에이전트 |
|------|----------|
| 서버 관리·Docker·일반 명령 | `daon-erp-remote` |
| DB 스키마·쿼리·DDL·마이그레이션 | `erp-db` |
| 매입/매출/PnL 분석·보고서 | `erp-analyst` |
| n8n 워크플로우·Code 노드·챗봇 | `erp-n8n` |
| 웹앱 UI·PostgREST 연동 | `erp-webapp` |

### 서비스 URL
| 서비스 | URL |
|--------|-----|
| ERP 웹앱 | erp.daonms.com |
| REST API | api.daonms.com |
| n8n 워크플로우 | n8n.daonms.com |
| KPI 대시보드 | kpi.daonms.com |
| DB 관리 | sql.daonms.com |
| AI Proxy | code.daonms.com |

### 필수 금지사항
- 운영 DB DROP/대량삭제: 사용자 확인 필수
- ERP_v6 워크플로우: CLI import 금지 (UI에서만)
- Telegram setWebhook 수동 호출 금지
- 구 Drive credential `7zat0DXsDPXJRkLH` 사용 금지
- 이카운트 로그인 재시도 3회 제한

