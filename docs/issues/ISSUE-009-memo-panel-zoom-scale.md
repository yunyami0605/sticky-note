# ISSUE-009: 메모 패널 글자 배율 50~100% + 단축키 조절

**상태:** closed  
**우선순위:** medium  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

플로팅 메모 패널의 글자 크기가 S/M/L 3단계 고정값으로만 조절 가능하다.  
50~100% 범위의 세밀한 배율 조절과 단축키(`Cmd+`, `Cmd-` 등) 지원이 필요하다.

## 원인 분석

현재 `note.fontSize` 필드가 `'sm' | 'md' | 'lg'` 타입으로 고정되어 있고, `cycleFontSize()`가 순환 토글만 한다.

## 해결 방안

### 추후 개선 (TODO)

- `note.fontSize` 타입을 `number`(50~100 정수, %)로 변경하거나 별도 `zoomLevel` 필드 추가
- DB 마이그레이션 필요 (`notes` 테이블 `font_size` 컬럼 타입 변경)
- UI: 슬라이더 또는 `-` / `+` 버튼 + 현재 % 표시
- 단축키: `Cmd+=` (확대), `Cmd+-` (축소), `Cmd+0` (100% 초기화)
- CSS: `fontSize` 대신 에디터 컨테이너에 `zoom` 또는 `transform: scale()` 적용 검토

## 참고

- `src/shared/types.ts` — `FontSize` 타입, `Note` 인터페이스
- `src/renderer/src/components/NoteEditor/index.tsx` — `cycleFontSize()`
- `src/main/services/database.ts` — `font_size` 컬럼
