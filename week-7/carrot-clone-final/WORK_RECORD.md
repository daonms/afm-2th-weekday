# WORK_RECORD

## 작업 요약
- `week-7/carrot-clone-final`에 Supabase 기반 동네 중고거래 MVP 정리
- Auth / Profile / Neighborhood / Likes / Chats 상태와 API를 분리 정리
- 상품 목록을 내 동네 기준으로 정리
- 위치 권한 허용 시 동네 자동 채움 + 직접 수정 흐름 추가
- 상품 이미지 최대 3장 업로드 흐름 추가
- 상품 상세에 관심 토글과 문의 채팅 패널 유지
- `/chats`, `/chats/:roomId`, `/me` 라우트를 추가
- Vercel serverless API routes로 Supabase REST 의존을 줄임
- `supabase/schema.sql`과 RLS 트리거를 추가
- README를 제출용 기준으로 다시 정리

## 검증
- `npm run build` 성공

## 범위 준수 체크
- 지속 GPS / 결제 / 추천 / 알림 / 고급 실시간 / 과한 디자인 미추가
- 상품 상세 내부 채팅 패널 유지
- `week-7/MyAide` 미수정
