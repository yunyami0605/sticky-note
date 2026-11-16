# CLAUDE.md — Sticky Note App

## 프로젝트 개요

Electron + React + Tiptap 기반 데스크탑 스티키 노트 앱.
메인 패널(사이드바 + 에디터)과 플로팅 팝업 창으로 구성된다.

현재 버전: **v1.1** (기획 문서: `docs/planning-v1.1.md`)

---

## 아키텍처

```
Electron
├── 메인 프로세스  src/main/
│   ├── index.ts          IPC 핸들러, 창 관리, DB 브로드캐스트
│   └── services/
│       └── database.ts   SQLite CRUD (better-sqlite3)
├── Preload         src/preload/index.ts   IPC → window.api 노출
├── Shared          src/shared/types.ts    타입 + IPC 채널명 상수
└── Renderer        src/renderer/src/
    ├── components/
    │   ├── MainPanel/      사이드바 + 인라인 에디터 (최대 파일)
    │   ├── NoteCard/       사이드바 메모 카드
    │   ├── NoteEditor/     팝업 창 에디터
    │   ├── NoteWindow/     팝업 창 래퍼
    │   ├── Toolbar/        에디터 서식 툴바
    │   ├── SettingsPanel/  설정 패널 오버레이
    │   ├── ShortcutsModal/ 단축키 커스터마이즈 모달
    │   ├── SlashCommandMenu/ 슬래시 커맨드 팝업
    │   └── ColorPicker/    색상 선택기
    ├── extensions/
    │   ├── Callout.ts      콜아웃 블록 (커스텀 Tiptap Node)
    │   ├── DragHandle.ts   블록 드래그 핸들
    │   ├── Mention.ts      @페이지 멘션
    │   └── SlashCommand.ts / 슬래시 커맨드
    ├── store/
    │   ├── noteStore.ts    메모 상태 (Zustand)
    │   ├── folderStore.ts  폴더 상태 (Zustand)
    │   ├── tagStore.ts     태그 상태 (Zustand)
    │   └── settingsStore.ts 설정 상태 (Zustand)
    └── styles/globals.css  CSS 커스텀 프로퍼티 테마
```

---

## 핵심 개념

### IPC 통신
- 렌더러 → 메인: `window.api.*` (preload 경유)
- 메인 → 렌더러 브로드캐스트: `webContents.send()`
- 채널명은 `src/shared/types.ts`의 `IPC` 상수로만 사용 (문자열 하드코딩 금지)
- DB 저장 후 발신 창 제외 모든 창에 `note:updated` 브로드캐스트 → 창 간 실시간 동기화

### 테마 시스템
- CSS 커스텀 프로퍼티: `--app-text`, `--app-bg`, `--app-sidebar`, `--app-border`, `--app-hover`, `--app-active`, `--app-select`, `--app-text-muted`, `--app-text-dim`
- `document.documentElement`에 `data-theme-mode` / `data-theme-color` 어트리뷰트로 제어
- 하드코딩 색상 대신 반드시 CSS 변수 사용 (단, 다크/라이트 분기 인라인 스타일 허용)

### Tiptap 에디터
- StarterKit(heading 비활성 → 별도 Heading extension), TaskList, TaskItem, CodeBlockLowlight, Details/DetailsContent/DetailsSummary, Callout, SlashCommand, MentionNode, DragHandle 등록
- 에디터 기본 글자 크기/색상은 에디터 컨테이너 CSS로 적용 (Tiptap TextStyle mark와 독립적)
- 콘텐츠는 JSON(ProseMirror)으로 저장 (`JSON.stringify(editor.getJSON())`)

### 드래그 앤 드롭
- `dragtype` 데이터 키로 `'note'` / `'folder'` 구분 (반드시 먼저 확인)
- 중첩 폴더로 메모 드롭 시 **자식 `handleBodyDrop`에서 `e.stopPropagation()` 필수** — 없으면 부모 폴더로 버블링
- `handleHeaderDrop`에서도 note 타입을 먼저 처리 후 return (folder 타입 로직과 혼용 금지)

---

## 코딩 규칙

- TypeScript strict 모드 — `any` 사용 금지
- 컴포넌트 파일: `components/ComponentName/index.tsx`
- 색상 하드코딩 금지 → `var(--app-*)` 사용
- IPC 채널 문자열 하드코딩 금지 → `IPC.*` 상수 사용
- 주석은 WHY가 비자명할 때만 (WHAT 설명 주석 금지)
- 커밋은 사용자가 명시적으로 요청할 때만 (`feat:` / `fix:` / `refactor:` / `docs:` 컨벤션)

---

## 빌드 & 실행

```bash
npm run dev        # 개발 서버 (Electron + Vite HMR)
npm run build      # 프로덕션 빌드
npx tsc --noEmit   # 타입 체크
```

---

## 하지 말아야 할 것

- 테이블 블록 구현 — 플로팅 창 공간 제약으로 의도적 보류 (`docs/future-features.md` 참고)
- `window.api`를 메인 프로세스에서 직접 호출 — preload 경유만 가능
- Zustand store를 여러 창이 공유한다고 가정 — 창마다 독립 인스턴스
- `--no-verify`로 커밋 훅 우회
- 기존 기능 건드릴 때 `npx tsc --noEmit` 생략

---

## 미구현 / 보류 항목

기획 대비 미구현:
- 테이블 블록 (의도적 보류)
- 이모지 피커 (현재 `prompt()` 사용, 추후 커스텀 팝업으로 교체 예정)
- H3 툴바 버튼 (슬래시 커맨드로만 가능)
- "전체" 뷰 (전체 메모 집계 섹션)

장기 과제: `docs/future-features.md` 참고 (AI 연동, 템플릿, 모바일, API, 날짜 멘션)
