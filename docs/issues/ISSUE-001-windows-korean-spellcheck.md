# ISSUE-001: Windows 한국어 맞춤법 검사 미지원

**상태:** deferred  
**우선순위:** low  
**생성일:** 2026-11-09  
**수정일:** 2026-11-09  

## 문제 설명

Windows 환경에서 맞춤법 검사를 활성화해도 한국어에 빨간 밑줄이 표시되지 않는다.  
macOS는 시스템 맞춤법 검사가 자동으로 연동되어 정상 동작하지만, Windows는 별도 설정이 필요하다.

- 영향 범위: Windows 사용자 전체
- macOS는 무관

## 원인 분석

Electron은 Windows에서 Hunspell 기반 맞춤법 검사를 사용한다.  
한국어(`ko-KR`) Hunspell 사전 파일(`.bdic` 형식)이 번들되지 않으면 한국어 단어를 검사할 수 없다.  
Chromium의 bdic 사전은 chromium 내부 서버에서 다운로드되거나 직접 번들해야 한다.

## 해결 방안

### 현재 적용 (Method 1 — 부분 해결)

`src/main/index.ts`에서 Windows 한정으로 시스템 언어팩 활용 시도:

```ts
if (process.platform === 'win32') {
  session.defaultSession.setSpellCheckerLanguages(['ko-KR', 'en-US'])
}
```

- Windows 10/11에서 한국어 언어팩이 설치된 경우 동작할 수 있음
- 사용자 PC에 한국어 언어팩이 없으면 여전히 미작동

### 추후 개선 (Method 2 — TODO)

`ko_KR.bdic` 사전 파일을 앱에 직접 번들하는 방식:

1. `ko_KR.bdic` 파일 확보 (Chromium 소스 또는 LibreOffice에서 변환, 약 3MB)
2. `resources/dictionaries/ko_KR.bdic` 로 배치
3. 메인 프로세스에서 경로 지정:

```ts
const dictPath = path.join(
  is.dev ? path.join(__dirname, '../../resources/dictionaries')
         : path.join(process.resourcesPath, 'dictionaries')
)
session.defaultSession.setSpellCheckerDictionaryDownloadURL('file://' + dictPath + '/')
session.defaultSession.setSpellCheckerLanguages(['ko-KR', 'en-US'])
```

4. `electron-builder` 설정에 `dictionaries/` 폴더를 `extraResources`에 추가

**조건:** Windows 사용자 비중이 높아지거나 맞춤법 검사 완성도 요구가 생길 때 적용.

## 참고

- Electron 공식 문서: [Spell Checking](https://www.electronjs.org/docs/latest/tutorial/spellchecker)
- Chromium bdic 형식: Hunspell `.dic/.aff` → `convert_dict` 도구로 변환
- 관련 파일: `src/main/index.ts`, `src/renderer/src/components/SettingsPanel/index.tsx`
