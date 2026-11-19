# ISSUE-012: 설정 패널 테마 색상 동그라미 미반영

**상태:** open  
**우선순위:** medium  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

설정 패널에서 테마 모드(다크/라이트)를 전환해도 테마 색상 선택 드롭다운의 색상 미리보기 동그라미가 바뀌지 않는다.

## 원인 분석

`ThemeColorPicker`에 넘기는 `colors` 배열이 `isDark ? DARK_COLORS : LIGHT_COLORS`로 렌더 시 계산되지만, `current` 값(`themeColor`)은 `'navy'` 같은 키 값이고 `bg`는 각 배열에서 다르게 정의되어 있다.  
`themeMode`가 바뀌면 `colors` 배열이 교체되어야 하는데, 드롭다운이 열린 상태에서 모드를 바꾸거나 초기 렌더 시 `isDark` 계산이 늦게 반영될 수 있다.

## 해결 방안

### 추후 개선 (TODO)

- `ThemeColorPicker` 내부에서 `isDark` prop을 직접 받아 `colors` 배열을 내부에서 선택하도록 변경
- 또는 `currentColor` 계산을 `useMemo`로 `isDark` 의존성 추가

## 참고

- `src/renderer/src/components/SettingsPanel/index.tsx` — `ThemeColorPicker`, `DARK_COLORS`, `LIGHT_COLORS`
