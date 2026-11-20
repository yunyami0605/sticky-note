# ISSUE-004: 사이드바 폴더명 색상 및 카운트 위치

**상태:** closed  
**우선순위:** medium  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

- 사이드바 폴더명 텍스트 색상이 너무 어두워 가독성이 낮다.
- 메모 카운트 뱃지가 폴더명과 떨어진 우측 끝에 위치해 연관성이 약하다.

## 원인 분석

`TreeSection` 헤더 버튼의 폴더명 색상이 `var(--app-text-muted)` 로 설정되어 있고, 카운트 뱃지가 `flex-1 truncate` 이후 우측에 배치되어 있다.

## 해결 방안

### 추후 개선 (TODO)

- 폴더명 색상: `var(--app-text-muted)` → `var(--app-text)` 로 변경
- 카운트 뱃지: 폴더명 바로 옆(`ml-1.5`)으로 이동, `ml-auto` 제거

## 참고

- `src/renderer/src/components/MainPanel/index.tsx` — `TreeSection` 컴포넌트 헤더 버튼
