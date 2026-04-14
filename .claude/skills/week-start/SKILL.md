---
name: week-start
description: AFM 부트캠프 새 주차 시작 시 폴더·일기 템플릿·회고 파일을 자동 생성한다. 트리거 — "/week-start", "새 주차 시작", "Week N 시작해줘", "주차 준비"
---

# Week 시작 자동화 스킬

AFM 2기 평일반 새 주차를 시작할 때 기본 구조를 생성합니다.

## 실행 절차

### 1. 주차 번호 파악
```bash
# 사용자 입력 또는 최신 주차 + 1
ls -d week_*/ | tail -1 | sed 's/week_//; s/\///'
```

### 2. 폴더 구조 생성
```bash
WEEK=$1  # 예: 5
mkdir -p "week_${WEEK}/diary"
mkdir -p "week_${WEEK}/projects"
mkdir -p "week_${WEEK}/notes"
```

### 3. 주차 README 생성
`week_N/README.md`:
```markdown
# 🎯 Week N — [주차 주제]

> 기간: YYYY.MM.DD ~ YYYY.MM.DD

## 학습 목표
- [ ] [목표 1]
- [ ] [목표 2]
- [ ] [목표 3]

## 수업 일정
| 날짜 | 주제 | 결과물 예상 |
|------|------|-------------|
| | | |

## 프로젝트 목록
(작업하면서 채워집니다)

## 핵심 개념 체크리스트
- [ ] [개념 1]
- [ ] [개념 2]
```

### 4. 첫 날 일기 템플릿 생성
`week_N/diary/YYYY.MM.DD.md` — `learn.afm-diary` 에이전트 템플릿 사용

### 5. timetable.md 업데이트
새 Week 섹션을 timetable.md 하단에 추가

## 출력 형식

```
## 🚀 Week N 시작 준비 완료

📁 생성 폴더:
- week_N/diary/
- week_N/projects/
- week_N/notes/

📄 생성 파일:
- week_N/README.md — 주차 개요 + 목표
- week_N/diary/YYYY.MM.DD.md — 첫 날 일기 템플릿

📝 timetable.md 업데이트 완료

### 👉 다음 할 일
1. week_N/README.md 열어 학습 목표 채우기
2. 수업 시작 시 `learn.afm-diary` 호출해서 일기 작성
3. 프로젝트 만들 때 `learn.afm-project` 호출
```
