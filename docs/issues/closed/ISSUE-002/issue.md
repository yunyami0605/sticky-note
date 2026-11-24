# ISSUE-002: 사이드바 노트 클릭 시 팝업 미열림

**상태:** open  
**우선순위:** high  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

메인 패널 사이드바에서 노트 항목을 클릭하면 에디터에 선택만 될 뿐, 플로팅 팝업 창이 열리지 않는다.  
우클릭 → "노트 팝업" 메뉴를 통해서는 팝업이 정상적으로 열린다.

## 원인 분석

`NoteCard` 클릭 핸들러가 `setSelectedId(note.id)` 만 호출하고 `toggleNoteWindow`를 호출하지 않는다.  
단순 클릭을 "팝업 열기"로 해석할지, "에디터 선택"으로 해석할지 UX 정책 결정 필요.

## 해결 방안

### 추후 개선 (TODO)

- 단순 클릭 → 에디터 선택 (현행 유지)
- 더블클릭 또는 `Cmd+Enter` 단축키 → 팝업 열기로 구분하는 것이 UX상 적절
- `NoteCard`에 `onDoubleClick` 핸들러 추가, `toggleNoteWindow` 호출

## 참고

- `src/renderer/src/components/NoteCard/index.tsx` — `handleClick` 함수
- 단축키 `openWindow` (`Cmd+Enter`) 는 이미 구현됨 — 사이드바 더블클릭과 동일하게 동작하도록 연결
