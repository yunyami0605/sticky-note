# ISSUE-005: 새 메모 생성 시 신규 표시 뱃지

**상태:** open  
**우선순위:** medium  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

메모를 새로 만들면 사이드바에 "새 메모" 텍스트로만 표시되어, 신규 작성 중인 메모임을 직관적으로 구별하기 어렵다.

## 해결 방안

### 추후 개선 (TODO)

- 콘텐츠가 비어있는 메모의 경우, 제목 텍스트 대신 빨간 원 + 흰색 "N" 뱃지로 표시
- `NoteCard`의 `getTitle()` 반환값이 `'새 메모'`인 경우(= 콘텐츠 없음)에 뱃지 렌더링
- 콘텐츠가 입력되는 순간 일반 제목으로 전환

```tsx
// 조건: !content || getTitle(content) === '새 메모'
<span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
  N
</span>
```

## 참고

- `src/renderer/src/components/NoteCard/index.tsx` — `getTitle()`, 렌더링 영역
