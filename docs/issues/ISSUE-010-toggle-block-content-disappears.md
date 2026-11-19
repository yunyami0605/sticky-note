# ISSUE-010: 토글 블록 생성 시 기존 텍스트 사라짐

**상태:** open  
**우선순위:** high  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

슬래시 커맨드 `/토글` 또는 툴바 토글 버튼 클릭 시, 토글 블록이 생성되지 않고 현재 커서 위치의 텍스트가 사라진다.

## 원인 분석

슬래시 커맨드에서 `editor.chain().focus().deleteRange(range).setDetails().run()` 호출 시 `setDetails()` 커맨드가 올바르게 동작하지 않을 가능성.  
`@tiptap/extension-details`의 `setDetails` 커맨드가 현재 Tiptap 버전과 호환 문제가 있거나, `Details`/`DetailsContent`/`DetailsSummary` 세 extension이 모두 등록되었는지 확인 필요.

## 해결 방안

### 추후 개선 (TODO)

1. `setDetails()` → `toggleDetails()` 로 변경 시도
2. 또는 직접 ProseMirror 노드 삽입으로 우회
3. `Details`, `DetailsContent`, `DetailsSummary` extension이 에디터에 모두 등록되어 있는지 재확인
4. Tiptap 버전 업그레이드 또는 다운그레이드 검토

## 참고

- `src/renderer/src/extensions/` — Details extension 없음, `@tiptap/extension-details` 패키지 사용
- `src/renderer/src/components/SlashCommandMenu/index.tsx` — 59번째 줄
- `src/renderer/src/components/Toolbar/index.tsx` — 토글 버튼
- `src/renderer/src/components/MainPanel/index.tsx` — `InlineEditor` extension 목록
