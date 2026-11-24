# 이슈 파일 작성 규칙

이 문서는 `docs/issues/` 디렉터리에 이슈를 기록하는 방식을 정의합니다.  
Claude가 이슈를 생성하거나 업데이트할 때 이 규칙을 따릅니다.

---

## 디렉터리 구조

```
docs/issues/
├── ISSUE-RULES.md          ← 이 파일 (규칙 문서)
├── .counter                ← 마지막으로 발급된 이슈 번호 (숫자만)
├── open/
│   └── ISSUE-NNN/
│       └── issue.md        ← open / in-progress / resolved / deferred 상태
└── closed/
    └── ISSUE-NNN/
        └── issue.md        ← closed 상태
```

---

## 이슈 번호 발급

`.counter` 파일에 마지막으로 발급된 번호가 저장된다.

**새 이슈 생성 절차:**
1. `.counter` 파일을 읽어 현재 값 N을 확인
2. 새 번호 = N + 1
3. `open/ISSUE-{NNN}/issue.md` 파일 생성
4. `.counter` 파일을 N+1로 업데이트

> **이슈 번호 재사용 금지** — closed 이슈 번호는 영구 보존

---

## 네이밍 컨벤션

- 폴더명: `ISSUE-{NNN}` (3자리 숫자, 001부터 순차 증가)
- 파일명: 폴더 내 항상 `issue.md` 고정
- 예: `open/ISSUE-015/issue.md`

---

## 상태와 위치

| 상태 | 위치 |
|------|------|
| `open` | `open/ISSUE-NNN/` |
| `in-progress` | `open/ISSUE-NNN/` |
| `resolved` | `open/ISSUE-NNN/` |
| `deferred` | `open/ISSUE-NNN/` |
| `closed` | `closed/ISSUE-NNN/` |

**closed로 전환 시:** `open/ISSUE-NNN/` → `closed/ISSUE-NNN/` 폴더 이동

---

## 이슈 파일 템플릿

```markdown
# ISSUE-NNN: 제목

**상태:** open | in-progress | resolved | deferred | closed  
**우선순위:** high | medium | low  
**유형:** bug | improvement | feature | question  
**생성일:** YYYY-MM-DD  
**수정일:** YYYY-MM-DD  

## 문제 설명

(현상, 발생 조건, 영향 범위를 간결하게)

## 원인 분석

(알고 있는 경우 작성, 모르면 "미파악"으로 표시)

## 해결 방안

### 현재 적용 (임시/부분 해결)

(적용된 내용, 파일, 이유)

### 추후 개선 (TODO)

(더 완전한 해결책, 조건, 우선순위)

## 테스트 결과

(수정 후 검증 내용. 미검증이면 "미검증"으로 표시)

## 참고

(관련 링크, 파일 경로, 외부 문서 등)
```

---

## 상태 값 정의

```
open → in-progress → resolved → closed
                  ↘ deferred
```

| 상태 | 의미 |
|------|------|
| `open` | 미해결, 아직 작업 시작 전 |
| `in-progress` | 현재 작업 중 |
| `resolved` | 코드 반영 완료, 실제 동작 테스트 대기 |
| `deferred` | 의도적으로 뒤로 미룸 (조건 명시 필요) |
| `closed` | 테스트까지 완료된 최종 해결 상태 |

## 유형 값 정의

| 유형 | 의미 |
|------|------|
| `bug` | 기능이 의도대로 동작하지 않음 |
| `improvement` | 기존 기능의 UX/시각적 개선 |
| `feature` | 새로운 기능 추가 |
| `question` | 동작 방식 확인 또는 정책 결정 필요 |

---

## 운영 규칙

1. **새 이슈 생성 시** — `.counter` 읽어 번호 발급 → `open/ISSUE-NNN/issue.md` 생성 → `.counter` 증가
2. **상태 변경 시** — `issue.md` 업데이트, 수정일 갱신
3. **코드 반영 완료 시** — 상태를 `resolved`로, 테스트 결과란에 "테스트 대기" 기재
4. **테스트 완료 시** — 상태를 `closed`로 변경 + `open/ISSUE-NNN/` → `closed/ISSUE-NNN/` 폴더 이동
5. **부분 해결 시** — 상태를 `deferred`로, "현재 적용"과 "추후 개선" 분리 기재
6. **이슈 번호 재사용 금지** — closed 이슈 번호는 영구 보존
