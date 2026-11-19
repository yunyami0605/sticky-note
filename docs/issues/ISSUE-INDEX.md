# 이슈 인덱스

> 이슈 생성·상태 변경 시 이 파일도 함께 업데이트한다.  
> 최종 수정: 2026-11-17 (이슈 해결 작업)

---

| 번호 | 제목 | 진행도 | 내용 | 테스트 결과 |
|------|------|:------:|------|:-----------:|
| [ISSUE-001](ISSUE-001-2026-11-09-windows-korean-spellcheck.md) | Windows 한국어 맞춤법 검사 미지원 | deferred | Windows에서 `spellCheck` 속성이 한국어 오타를 감지하지 못함 | - |
| [ISSUE-002](ISSUE-002-2026-11-17-sidebar-note-click-no-popup.md) | 사이드바 노트 클릭 시 팝업 미열림 | closed | 클릭이 에디터 선택만 하고 팝업을 열지 않음 | 더블클릭으로 팝업 열기 구현 |
| [ISSUE-003](ISSUE-003-2026-11-17-drag-handle-list-grouping.md) | 드래그 핸들 번호 목록 그룹핑 동작 | deferred | 번호 목록 아이템 개별 드래그 불가, 리스트 전체가 하나의 블록으로 처리됨 | - |
| [ISSUE-004](ISSUE-004-2026-11-17-folder-label-color-and-count-position.md) | 사이드바 폴더명 색상·카운트 위치 | closed | 폴더명 색상이 어둡고, 카운트 뱃지가 우측 끝에 위치해 연관성이 약함 | 색상 --app-text 적용, 카운트 이름 옆으로 이동 |
| [ISSUE-005](ISSUE-005-2026-11-17-new-note-badge-indicator.md) | 새 메모 신규 뱃지 표시 | closed | 빈 메모가 "새 메모" 텍스트로만 표시되어 신규 메모 구별 어려움 | 빈 메모에 빨간 N 뱃지 표시 |
| [ISSUE-006](ISSUE-006-2026-11-17-nested-folder-visual-distinction.md) | 중첩 폴더 시각적 구별 어려움 | closed | 들여쓰기만으로는 1~2단계 중첩 폴더 구별이 불명확 | 들여쓰기 10→14px 확대 |
| [ISSUE-007](ISSUE-007-2026-11-17-inline-selection-toolbar.md) | 텍스트 선택 시 인라인 스타일 팝업 | closed | 텍스트 드래그 선택 후 스타일 변경 팝업이 뜨지 않음 | BubbleMenu로 SelectionToolbar 구현 (B/I/U/S/글자색/하이라이트/H1/H2) |
| [ISSUE-008](ISSUE-008-2026-11-17-toolbar-responsive-collapse.md) | 툴바 반응형 — 좁은 너비에서 토글 전환 | closed | 창이 좁아지면 툴바 버튼이 줄 넘김되거나 잘림 | ResizeObserver 300px 임계값, 토글 버튼+팝업 구현 |
| [ISSUE-009](ISSUE-009-2026-11-17-memo-panel-zoom-scale.md) | 메모 패널 글자 배율 50~200% + 단축키 | closed | S/M/L 3단계 고정값만 지원, 세밀한 배율 조절 및 단축키 없음 | zoom_level DB 컬럼 추가, -/+/% UI, Cmd+=/- 단축키 |
| [ISSUE-010](ISSUE-010-2026-11-17-toggle-block-content-disappears.md) | 토글 블록 생성 시 텍스트 사라짐 | closed | `/토글` 커맨드 실행 시 블록 미생성, 커서 위치 텍스트 소실 | insertContent로 직접 삽입 방식으로 변경 |
| [ISSUE-011](ISSUE-011-2026-11-17-sort-per-folder.md) | 정렬 기능 — 폴더별 독립 정렬 | closed | 전체 메모에 단일 정렬만 적용, 폴더별 독립 정렬 불가 | SidebarTree 내부 sortByMap + 각 폴더 미니 정렬 버튼 |
| [ISSUE-012](ISSUE-012-2026-11-17-theme-color-swatch-not-updating.md) | 설정 테마 색상 동그라미 미반영 | closed | 다크/라이트 모드 전환 시 색상 미리보기 동그라미가 갱신되지 않음 | 드롭다운→원형 그리드로 교체, 선택 즉시 반영 |
| [ISSUE-013](ISSUE-013-2026-11-17-default-font-settings-scope.md) | 기본 글자 설정 메모 패널 미적용 | closed | 기본 글자 크기·색상이 메인 에디터에만 적용되고 플로팅 메모 패널에는 미적용 | NoteEditor에 editorFontSize/editorTextColor 적용 |
| [ISSUE-014](ISSUE-014-2026-11-17-callout-block-not-working.md) | 콜아웃 블록 동작 안됨 | closed | `/콜아웃` 커맨드 및 툴바 버튼으로 콜아웃 블록 삽입 시 정상 동작하지 않음 | Callout content `inline*`→`block+`으로 수정 |
