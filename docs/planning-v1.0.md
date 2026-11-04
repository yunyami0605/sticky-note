# Sticky Note App — 기획 문서 v1.0

**작성일:** 2026-11-04  
**플랫폼:** Windows / macOS (Electron)  
**레퍼런스:** Sticky Notepad: 메모 & 노트 (App Store, id1634804565)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | Sticky Note (가칭) |
| 목표 | 데스크탑에 항상 떠 있는 가볍고 직관적인 스티커 메모 앱 |
| 플랫폼 | Windows 10+, macOS 11+ |
| 기술 스택 | Electron + React + TypeScript |
| 상태 관리 | Zustand |
| 로컬 저장 | electron-store (JSON) |
| 빌드/배포 | electron-builder (NSIS/DMG) |

---

## 2. 1차 기능 목록 (MVP)

### 2.1 노트 관리

- [ ] 노트 생성 — 버튼 한 번으로 새 스티커 노트 생성
- [ ] 노트 삭제 — 개별 노트 삭제 (삭제 확인 없이 즉시 / 옵션으로 확인 다이얼로그)
- [ ] 노트 목록 — 전체 노트를 한 화면에서 조회하는 메인 패널
- [ ] 자동 저장 — 입력 멈춤 500ms 후 로컬에 자동 저장

### 2.2 텍스트 편집

- [ ] 기본 서식 — 굵게(B), 기울임(I), 밑줄(U), 취소선(S)
- [ ] 헤딩 — H1 / H2 / H3
- [ ] 리스트 — 불릿 목록, 번호 목록
- [ ] 체크리스트 — 할 일(To-do) 체크박스
- [ ] 폰트 크기 — 소/중/대 3단계

### 2.3 디자인 / 테마

- [ ] 색상 테마 — 6가지 노트 색상 (노랑, 파랑, 초록, 핑크, 보라, 흰색)
- [ ] 투명도 조절 — 슬라이더로 노트 배경 투명도 설정
- [ ] 다크 모드 — 시스템 다크 모드 연동

### 2.4 데스크탑 통합

- [ ] 항상 위 표시 — 모든 창 위에 노트 고정 (토글)
- [ ] 자유 이동 — 드래그로 화면 어디서나 위치 이동
- [ ] 크기 조절 — 노트 창 모서리 드래그로 리사이즈
- [ ] 시스템 트레이 — 트레이 아이콘으로 앱 숨기기/보이기/종료

### 2.5 내보내기

- [ ] TXT 내보내기 — 개별 노트 텍스트 파일로 저장
- [ ] 다중 내보내기 — 선택한 여러 노트 일괄 TXT 저장

---

## 3. 화면 구성

```
┌─────────────────────────────────────┐
│  메인 패널 (노트 목록)                │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 노트1 │ │ 노트2 │ │ 노트3 │  [+]  │
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘

┌──────────────────┐
│ ● ● ●  [📌][⋯] │  ← 노트 개별 창 (항상 위 고정 토글, 메뉴)
│                  │
│  노트 내용 입력   │
│                  │
│ 🎨 B I U S H1  │  ← 하단 툴바
└──────────────────┘
```

---

## 4. 기술 스택 상세

| 역할 | 라이브러리 |
|------|-----------|
| 프레임워크 | Electron 28+ |
| UI | React 18 + TypeScript |
| 리치 텍스트 에디터 | Tiptap (ProseMirror 기반) |
| 상태 관리 | Zustand |
| 로컬 DB | electron-store |
| 스타일 | Tailwind CSS |
| 빌드 | electron-builder |
| 패키지 매니저 | pnpm |

---

## 5. 프로젝트 구조 (예정)

```
note/
├── docs/
│   └── planning-v1.0.md
├── src/
│   ├── main/              # Electron 메인 프로세스
│   │   ├── index.ts
│   │   ├── tray.ts
│   │   └── store.ts
│   ├── renderer/          # React 렌더러 프로세스
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── MainPanel.tsx
│   │   ├── store/
│   │   │   └── noteStore.ts
│   │   └── styles/
│   │       └── globals.css
│   └── preload/
│       └── index.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── electron-builder.config.js
```

---

## 6. 데이터 모델

```typescript
interface Note {
  id: string;           // UUID
  content: string;      // Tiptap JSON (리치 텍스트)
  color: NoteColor;     // 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'white'
  opacity: number;      // 0.3 ~ 1.0
  position: { x: number; y: number };
  size: { width: number; height: number };
  isPinned: boolean;    // 항상 위 표시
  fontSize: 'sm' | 'md' | 'lg';
  createdAt: string;    // ISO 8601
  updatedAt: string;
}
```

---

## 7. 개발 단계

| 단계 | 내용 | 목표 |
|------|------|------|
| Phase 1 | Electron + React 프로젝트 셋업 | 빌드 환경 구성 |
| Phase 2 | 기본 노트 CRUD + 로컬 저장 | 노트 생성/삭제/저장 |
| Phase 3 | 리치 텍스트 에디터 (Tiptap) 연동 | 서식 편집 |
| Phase 4 | 색상 테마 + 투명도 + 다크모드 | 디자인 커스텀 |
| Phase 5 | 항상 위 고정 + 트레이 + 드래그 | OS 통합 |
| Phase 6 | TXT 내보내기 + 다중 선택 | 내보내기 |
| Phase 7 | 빌드 & 패키징 (Windows NSIS / Mac DMG) | 배포 |

---

## 8. 커스텀 기능 (추가 예정)

> 레퍼런스 앱 대비 추가하고 싶은 기능을 여기에 작성합니다.

- [ ] (미정) — 사용자 요청에 따라 추가

---

## 9. 미결 사항

- 앱 최종 이름 결정 필요
- 아이콘 디자인 방향 결정 필요
- 한국어 UI 여부 확인 필요
- 커스텀 기능 구체화 필요

---

*문서 버전: v1.0 | 다음 업데이트: 커스텀 기능 확정 후 v1.1*
