# ISSUE-008: 툴바 반응형 — 좁은 너비에서 토글 버튼으로 전환

**상태:** closed  
**우선순위:** medium  
**생성일:** 2026-11-17  
**수정일:** 2026-11-20  

## 문제 설명

플로팅 메모 패널이 작아지면 collapsed 툴바 팝업이 뷰포트 밖으로 잘려 보이는 문제.

## 원인 분석

팝업이 `createPortal`로 `document.body`에 렌더링되지만, `position: fixed; right: xxx` 계산 시 창이 좁으면 팝업 왼쪽이 뷰포트 밖으로 밀려나고, 창이 낮으면 위쪽이 잘린다.

## 해결 방안

`Toolbar/index.tsx` `handleTogglePopup`에서:
- `right: Math.max(4, window.innerWidth - rect.right)` — 최소 4px 여백 보장
- `maxHeight: Math.max(80, rect.top - 8)` — 트리거 위쪽 가용 공간 제한

팝업 스타일에:
- `maxWidth: 'calc(100vw - 12px)'` — 뷰포트 너비 초과 방지 (minWidth보다 우선)
- `maxHeight`, `overflowY: 'auto'` — 세로 클리핑 방지

## 참고

- `src/renderer/src/components/Toolbar/index.tsx`
