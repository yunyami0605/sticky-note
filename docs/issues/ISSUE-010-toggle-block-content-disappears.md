# ISSUE-010: 토글 블록 생성 시 기존 텍스트 사라짐

**상태:** closed  
**우선순위:** high  
**생성일:** 2026-11-17  
**수정일:** 2026-11-20  

## 문제 설명

슬래시 커맨드 `/토글` 또는 툴바 토글 버튼 클릭 시 토글 블록이 불릿 형태로 표시되거나, 내용이 사라지는 문제.

## 원인 분석

`@tiptap/extension-details`의 NodeView는 `<div data-type="details">` 를 렌더링하며 기존 CSS `.tiptap details {}` 셀렉터에 매칭되지 않는다. 또한 NodeView 내부의 토글 `<button>` 은 기본적으로 비어있어(aria-label만 설정) 비시각적이고, `DetailsSummary`의 `<summary>` 엘리먼트가 `display: list-item` UA 기본값으로 렌더링되어 불릿처럼 보였다.

## 해결 방안

`globals.css`에 `[data-type="details"]` NodeView DOM을 타겟하는 CSS 추가:
- `> button`에 `position: absolute` + `::after { content: '▶' }` 로 화살표 표시
- `summary` 에 `display: flex; list-style: none; padding-left: 2.1rem` 로 불릿 제거
- `.is-open` 클래스 기반 버튼 회전 (90deg)
- ProseMirror 직접 삽입 (`replaceWith` / `insert`)으로 `setDetails()` 커맨드 의존성 제거

## 참고

- `src/renderer/src/styles/globals.css`
- `src/renderer/src/components/SlashCommandMenu/index.tsx`
- `src/renderer/src/components/Toolbar/index.tsx`
