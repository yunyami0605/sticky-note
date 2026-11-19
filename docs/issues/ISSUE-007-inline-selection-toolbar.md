# ISSUE-007: 텍스트 드래그 선택 시 인라인 스타일 팝업

**상태:** open  
**우선순위:** high  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

에디터에서 텍스트를 드래그 선택해도 스타일 변경 팝업이 뜨지 않는다.  
현재는 하단 고정 툴바만 존재하여, 선택 → 스타일 적용 흐름이 불편하다.  
메인 패널과 플로팅 메모 패널 모두 해당.

## 해결 방안

### 추후 개선 (TODO)

- Tiptap `onSelectionUpdate` 이벤트로 선택 영역 감지
- 선택 범위가 1자 이상이고 collapsed가 아닐 때 팝업 표시
- 위치: `window.getSelection().getRangeAt(0).getBoundingClientRect()` 기준 상단 중앙
- 팝업 내용: Bold, Italic, Underline, Strike, 글자색, 하이라이트 (기본 6종)
- 다른 곳 클릭 또는 선택 해제 시 팝업 닫기

```
선택된 텍스트
  ↑
┌──────────────────────┐
│ B  I  U  S  A  🖊    │  ← floating toolbar
└──────────────────────┘
```

## 참고

- `src/renderer/src/components/MainPanel/index.tsx` — `InlineEditor`
- `src/renderer/src/components/NoteEditor/index.tsx`
- Tiptap `BubbleMenu` extension으로 구현 가능 (`@tiptap/extension-bubble-menu`)
