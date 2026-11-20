# ISSUE-013: 기본 글자 크기/색상 설정이 메모 패널에 미적용

**상태:** closed  
**우선순위:** high  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

설정 패널의 "기본 글자 크기"와 "기본 글자 색상"이 메인 패널 에디터에만 적용되고, 플로팅 메모 패널(NoteEditor)에는 적용되지 않는다.  
사용자 요구사항: **메인 패널과 플로팅 메모 패널 모두** 동일한 기본 설정을 따라야 한다.

## 원인 분석

`MainPanel`의 `InlineEditor`는 `useSettingsStore()`에서 `editorFontSize`, `editorTextColor`를 읽어 에디터 컨테이너에 적용하지만, `NoteEditor` 컴포넌트는 해당 값을 읽지 않는다.

## 해결 방안

### 추후 개선 (TODO)

`NoteEditor`에서도 `useSettingsStore()`의 `editorFontSize`, `editorTextColor`를 읽어 에디터 컨테이너 스타일에 적용.

```tsx
// src/renderer/src/components/NoteEditor/index.tsx
const { spellCheck, editorFontSize, editorTextColor, load: loadSettings } = useSettingsStore()
// ...
<div
  className={`flex-1 overflow-y-auto pl-8 pr-3 py-2 ${FONT_SIZE_CLASS[note.fontSize]}`}
  style={{ fontSize: editorFontSize, color: editorTextColor || undefined }}
>
```

적용 우선순위 정책:
- `editorFontSize` (전역 기본값)를 베이스로 적용
- 메모 패널의 `note.fontSize`(S/M/L 배율)는 전역 기본값 위에 추가 배율로 동작하거나, ISSUE-009 해결 후 통합 검토

## 참고

- `src/renderer/src/components/NoteEditor/index.tsx`
- `src/renderer/src/components/MainPanel/index.tsx` — `InlineEditor` (적용된 참조 코드)
- `src/renderer/src/store/settingsStore.ts`
