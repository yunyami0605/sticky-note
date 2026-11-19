# ISSUE-003: 드래그 핸들 번호 목록 그룹핑 동작

**상태:** open  
**우선순위:** low  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

에디터 블록 드래그 핸들로 순서를 변경할 때, 번호 목록(ol) 항목들이 같은 리스트 내에서 그룹으로 묶이는 케이스가 있는지 불명확하다.  
Tiptap의 `@tiptap/extension-drag-handle` 은 블록 단위로 드래그하므로, 리스트 아이템 개별 이동이 아닌 리스트 전체가 하나의 블록으로 취급될 수 있다.

## 원인 분석

Tiptap DragHandle extension은 ProseMirror 노드 단위로 동작한다.  
`bulletList` / `orderedList` 는 자식 `listItem` 들을 포함하는 단일 블록이므로, 리스트 전체가 하나의 드래그 단위로 묶인다.  
리스트 아이템 개별 드래그는 현재 미지원.

## 해결 방안

### 현재 적용

리스트 전체를 단일 블록으로 드래그 — 의도된 동작으로 간주.

### 추후 개선 (TODO)

리스트 아이템 개별 드래그가 필요하다면 커스텀 DragHandle 구현 필요 (복잡도 높음, 우선순위 낮음).

## 참고

- `src/renderer/src/extensions/DragHandle.ts`
- Tiptap DragHandle docs: 노드 레벨 단위 동작
