# ISSUE-014: 콜아웃 블록 동작 안됨

**상태:** open  
**우선순위:** high  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

콜아웃(Callout) 블록이 슬래시 커맨드(`/콜아웃`) 또는 툴바 버튼으로 삽입 시 정상 동작하지 않는다.

**콜아웃 블록이란:** 블록 왼쪽에 인디고 색상 보더 + 연한 배경 + 이모지(기본 💡)가 붙는 강조 블록. "주의", "팁", "참고" 같은 내용을 돋보이게 표시할 때 사용. 노션의 콜아웃과 동일한 개념.

## 원인 분석

미파악. 아래 항목 확인 필요:
- `Callout` 커스텀 Node Extension이 에디터에 올바르게 등록되어 있는지
- `toggleCallout()` 커맨드가 Callout extension에 정의되어 있는지
- ProseMirror 스키마에서 Callout 노드가 허용되는 위치(content, group) 설정 오류 여부
- CSS `.tiptap div[data-type="callout"]` 가 실제 렌더된 DOM에 적용되는지

## 해결 방안

### 추후 개선 (TODO)

1. `src/renderer/src/extensions/Callout.ts` 에서 `toggleCallout` 커맨드 구현 확인
2. `addCommands()` 에 `toggleCallout` 정의 여부 점검
3. ISSUE-010(토글 블록 버그)과 동일한 패턴일 가능성 — 함께 디버깅

## 참고

- `src/renderer/src/extensions/Callout.ts`
- `src/renderer/src/components/SlashCommandMenu/index.tsx` — 65번째 줄 `toggleCallout()`
- `src/renderer/src/components/Toolbar/index.tsx` — 콜아웃 버튼
- `src/renderer/src/styles/globals.css` — `.tiptap div[data-type="callout"]`
