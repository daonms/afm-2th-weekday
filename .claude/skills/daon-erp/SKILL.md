---
name: daon-erp
version: 1.0.0
description: |
  DAONMS ERP i7 서버(daonms-i7-1) 원격 통제 스킬. SSH를 통해 Docker, PostgreSQL,
  n8n, 웹앱, AI Proxy 등 전체 ERP 시스템을 관리한다.
  사용 시점: "서버 확인", "DB 조회", "매출 분석", "n8n 확인", "웹앱 수정",
  "Docker 재시작", "ERP 상태", "서버 접속" 등 요청 시.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
---

# /daon-erp — DAONMS ERP 원격 통제

## SSH 접속 정보

| 항목 | 값 |
|------|-----|
| 서버 | daonms-i7-1 (Tailscale) |
| IP | 100.123.134.44 |
| 사용자 | i7dt |
| SSH 키 | ~/.ssh/id_ed25519 |
| 서버 경로 | /home/i7dt/daon-erp |
| OS | Ubuntu 6.8.0-106-generic (x86_64) |

## SSH 명령어 패턴

```bash
# 기본 프리픽스 (모든 원격 명령에 사용)
SSH_CMD="ssh -i ~/.ssh/id_ed25519 i7dt@100.123.134.44"

# 단일 명령 실행
$SSH_CMD "cd /home/i7dt/daon-erp && <command>"

# 원격 파일 읽기
$SSH_CMD cat /home/i7dt/daon-erp/<path>

# 원격 파일 쓰기
$SSH_CMD "cat > /home/i7dt/daon-erp/<path>" << 'REMOTE_EOF'
<content>
REMOTE_EOF

# 원격 파일 편집 (sed)
$SSH_CMD "sed -i 's/old/new/g' /home/i7dt/daon-erp/<path>"
```

## 서비스 URL

| 서비스 | URL | 포트 | 용도 |
|--------|-----|------|------|
| ERP 웹앱 | erp.daonms.com | web:80 | 매입현황 CRUD |
| REST API | api.daonms.com | postgrest:3000 | PostgREST |
| n8n 워크플로우 | n8n.daonms.com | n8n:5678 | 자동화 워크플로우 |
| KPI 대시보드 | kpi.daonms.com | metabase:3000 | Metabase |
| DB 관리 | sql.daonms.com | pgadmin:80 | pgAdmin |
| AI Proxy | code.daonms.com | ai-agent:4001 | Free AI Proxy |

## Docker 관리

```bash
# 서비스 상태 확인
$SSH_CMD "cd /home/i7dt/daon-erp && docker compose ps"

# 서비스 로그 (최근 50줄)
$SSH_CMD "cd /home/i7dt/daon-erp && docker compose logs --tail=50 <service>"

# 서비스 재시작
$SSH_CMD "cd /home/i7dt/daon-erp && docker compose up -d --force-recreate <service>"

# n8n + worker + ai-agent 재시작
$SSH_CMD "cd /home/i7dt/daon-erp && docker compose up -d --force-recreate n8n n8n-worker ai-agent"

# PostgREST 재시작 (스키마 변경 후 필수)
$SSH_CMD "cd /home/i7dt/daon-erp && docker restart n8n-postgrest-1"
```

## 에이전트 선택 가이드

요청 유형에 따라 전문 에이전트를 사용한다:

| 작업 | 에이전트 | 설명 |
|------|----------|------|
| 서버 관리/Docker/일반 | `daon-erp-remote` | 서버 명령 실행, Docker 관리, 파일 편집 |
| DB 스키마/쿼리/DDL | `erp-db` | PostgreSQL accounting/pnl 스키마 관리 |
| 매입/매출/PnL 분석 | `erp-analyst` | ERP 데이터 분석, 경영 보고서 |
| n8n 워크플로우 | `erp-n8n` | 워크플로우 설계, Code 노드 가이드 |
| 웹앱 UI 수정 | `erp-webapp` | erp.daonms.com HTML/JS 수정 |

## 사업 구조

| store_code | 브랜드 | 지점 | POS코드 |
|------------|--------|------|---------|
| kyodae | 고메정식당 | 교대본점 | GMJ001 |
| dongtan | 고메정식당 | 동탄호수공원직영점 | GOME01 |
| nijimori | 니지모리스튜디오 | - | - |
| daonms | DAONMS | 본사 | - |

## DB 접근

### PostgREST API (빠른 조회)
```bash
# 영수증 목록
curl -s "https://api.daonms.com/receipts?is_deleted=eq.false&order=receipt_date.desc&limit=20"

# 일별 손익
curl -s "https://api.daonms.com/v_profit_daily?business_date=gte.2026-03-01"

# 거래처별 매입 합계
curl -s "https://api.daonms.com/receipt_items?select=receipts(vendor_name),total.sum()"
```

### 직접 SQL (psql)
```bash
$SSH_CMD "cd /home/i7dt/daon-erp && docker compose exec -T postgres psql -U accounting_user -d accounting -c '<SQL>'"
```

### 주요 스키마
- **accounting**: receipts, receipt_items, products, supplier_aliases, master_db, audit_log, retry_queue, erp_accounts, roles
- **pnl**: store, sales_daily, sales_item_daily, purchase_daily, cogs_daily, labor_daily, sga_daily, profit_daily, v_profit_daily

## 필수 금지사항

1. 운영 DB (`receipts`, `master_db`, `supplier_aliases`) DROP/대량삭제 → **사용자 확인 필수**
2. ERP_v6 워크플로우 → **CLI import 금지, UI에서만 편집/Publish**
3. Telegram setWebhook → **수동 호출 금지** (UI Publish 시 자동)
4. 구 Drive credential `7zat0DXsDPXJRkLH` → **사용 금지** (만료)
5. 이카운트 로그인 → **재시도 3회 제한** (10회 실패 시 IP 차단)
6. `.env` 파일 → **커밋 금지**
7. 스키마/테이블 변경 후 → **PostgREST 재시작 필수** (PGRST205 방지)

## 오류 자동 복구 절차

1. 오류 원인 분석
2. 해결책 적용 후 재시도
3. 최대 3회 재시도 → 실패 시 사용자에게 보고

| 오류 유형 | 자동 대응 |
|-----------|-----------|
| Permission denied | `/home/i7dt/` 하위 경로로 변경 |
| 패키지 누락 | `npm install` 또는 `pip install --break-system-packages` |
| Docker 권한 오류 | `cd /home/i7dt/daon-erp && docker compose ...` 형태로 재시도 |

## 문서 참조 경로 (서버)

| 경로 | 내용 |
|------|------|
| workspace/docs/DAONMS_ERP_AI/ | ERP 전체 문서 |
| workspace/sql/ | DDL 파일 |
| workspace/plans/ | 로드맵/계획서 |
| gotchas.md | 장애/금지사항 원본 |
| docker-compose.yml | Docker 서비스 정의 |
