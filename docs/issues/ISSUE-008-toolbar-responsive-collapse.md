# ISSUE-008: 툴바 반응형 — 좁은 너비에서 토글 버튼으로 전환

**상태:** open  
**우선순위:** medium  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

메인 패널 에디터 하단 툴바와 플로팅 메모 패널 툴바가 창이 좁아지면 버튼이 줄 넘김되거나 잘린다.  
좁은 너비에서는 단일 토글 버튼(≡ 또는 ✏️)으로 전환되고, 클릭 시 버튼 기준 우측 상단 팝업 패널로 표시되어야 한다.

## 해결 방안

### 추후 개선 (TODO)

- 툴바 컨테이너 너비를 `ResizeObserver`로 감지
- 임계값(예: 400px) 이하이면 토글 모드로 전환
- 토글 버튼 클릭 시 `position: absolute` 팝업으로 전체 버튼 렌더
- `Toolbar` 컴포넌트에 `collapsed` prop 추가하거나 내부 상태로 관리

## 참고

- `src/renderer/src/components/Toolbar/index.tsx`
- `src/renderer/src/components/NoteEditor/index.tsx`
- `src/renderer/src/components/MainPanel/index.tsx` — `InlineEditor`
