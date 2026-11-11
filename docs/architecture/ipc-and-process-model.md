# Electron IPC & 프로세스 모델

## 1. OS 프로세스 구조

Electron 앱은 창마다 독립적인 OS 프로세스를 사용한다. Chromium 브라우저 엔진의 아키텍처를 그대로 계승한 설계다.

```
Electron 앱 실행 시
├── 메인 프로세스     (Node.js + Electron, PID 1234)
├── 렌더러 프로세스 A (메인 패널,          PID 1235)
├── 렌더러 프로세스 B (팝업 창 1,          PID 1236)
└── 렌더러 프로세스 C (팝업 창 2,          PID 1237)
```

macOS 활성 상태 보기나 `ps aux | grep Electron` 으로 실제 PID를 확인할 수 있다.

**일반 앱과의 차이:**

| | 일반 앱 | Electron |
|---|---|---|
| 구조 | 프로세스 1개 + 여러 스레드 | 창마다 별도 OS 프로세스 |
| 메모리 | 스레드 간 공유 가능 | 프로세스 간 완전 분리 |
| 통신 | 직접 변수 접근 | IPC 필요 |
| 크래시 격리 | 스레드 하나 죽으면 전체 위험 | 창 하나 죽어도 나머지 생존 |

브라우저에서 탭 하나가 멈춰도 다른 탭이 살아있는 것과 같은 원리다.

---

## 2. 왜 자동으로 동기화되지 않는가

메인 패널과 팝업 창은 같은 SQLite DB를 바라보지만, 각 창은 **앱 시작 시 DB를 한 번 읽어 메모리(Zustand/useState)에 올리고 그 이후로는 메모리 상태만 사용**한다.

한 창이 DB에 저장해도 다른 창의 메모리는 그 사실을 모른다. 프로세스가 분리되어 있어서 Zustand 스토어조차 창마다 별개의 인스턴스이기 때문이다.

```
메인 패널 메모리: { notes: [...] }   ← 각자 독립
팝업 창 메모리:   { notes: [...] }   ← DB 변경을 모름
```

---

## 3. IPC (Inter-Process Communication)

IPC는 OS 프로세스 간 메시지를 주고받는 통로다. Electron은 Chromium의 IPC 메커니즘 위에 추상화 레이어를 올려 `ipcMain` / `ipcRenderer` API를 제공한다.

두 가지 통신 방식이 있다:

**invoke / handle** — 요청·응답 (HTTP와 유사)
```
렌더러 → ipcRenderer.invoke('note:update', data)
메인   ← ipcMain.handle('note:update', handler)
렌더러 ← return 값 (Promise)
```

**send / on** — 단방향 알림 (푸시 알림과 유사)
```
메인     → webContents.send('note:updated', note)
렌더러   ← ipcRenderer.on('note:updated', callback)
```

---

## 4. 노트 편집 동기화 흐름

메인 패널에서 타이핑 → 팝업 창에 반영되는 전체 흐름:

```
[사용자] 메인 패널에서 타이핑
    │
    ▼
[렌더러 A - 메인 패널]
  editor.onUpdate 발생
  → 500ms 디바운스 후 window.api.note.update(id, { content })
    │
    │  IPC invoke
    ▼
[메인 프로세스]
  ipcMain.handle('note:update')
  → SQLite에 저장
  → updated Note 객체 반환
  → 발신자(메인 패널) 제외 모든 창에 send('note:updated', updated)
    │                               │
    │  invoke 응답                  │  IPC send
    ▼                               ▼
[렌더러 A - 메인 패널]      [렌더러 B - 팝업 창]
  onNoteChange(updated)       ipcRenderer.on('note:updated')
  → 로컬 state 갱신           → setNote(updated)
                              → NoteEditor useEffect 감지
                              → editor.setContent(incoming)
                              → 화면 반영
```

DB를 재조회하지 않는다. 메인 프로세스가 저장하면서 반환받은 객체를 그대로 다른 창에 전달하므로 불필요한 쿼리가 없다.

---

## 5. 메모리 사용

팝업 창 하나를 열 때마다 OS 프로세스가 하나 추가되므로 메모리 사용량이 늘어난다.

```
팝업 1개 추가 시 주요 비용
├── Chromium 렌더러 엔진   (~50–100 MB)
├── React + Tiptap + extensions
├── JS 힙 (Zustand, 에디터 상태 등)
└── GPU 프로세스 지분
```

팝업을 많이 띄울수록 메모리를 많이 사용한다. 메모 앱 특성상 동시에 여러 창을 띄우는 경우가 적으므로 현재 구조(창마다 독립 프로세스)가 적합하다. 만약 메모리 최적화가 필요하다면 BrowserView나 offscreen rendering을 검토할 수 있으나 구조 변경이 크다.

---

## 6. 관련 파일

| 파일 | 역할 |
|------|------|
| `src/main/index.ts` | IPC 핸들러 등록, 창 관리, 브로드캐스트 |
| `src/preload/index.ts` | IPC API를 렌더러에 노출하는 브릿지 |
| `src/shared/types.ts` | IPC 채널명 상수 (IPC 객체) |
| `src/renderer/src/store/noteStore.ts` | 메인 패널 메모리 상태 |
| `src/renderer/src/pages/note.tsx` | 팝업 창 진입점, onUpdated 수신 |
