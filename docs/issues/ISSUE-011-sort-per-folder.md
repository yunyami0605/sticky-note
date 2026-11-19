# ISSUE-011: 정렬 기능 — 폴더별 독립 정렬

**상태:** open  
**우선순위:** medium  
**생성일:** 2026-11-17  
**수정일:** 2026-11-17  

## 문제 설명

현재 정렬(최근 수정순, 최근 생성순, 색상별, 직접 정렬)이 전체 메모에 단일 적용된다.  
폴더마다 메모의 수정 날짜가 다르기 때문에, 폴더별로 독립적인 정렬이 필요하다는 의견.

## 현재 구현

- `SortBy` 상태가 `MainPanel` 컴포넌트 레벨에서 하나만 관리
- 모든 `TreeSection`(폴더)이 동일한 `sortBy` 값으로 `sortNotes()` 호출

## 해결 방안

### 추후 개선 (TODO)

**방안 A — 전역 단일 정렬 유지 (현행)**
- 단순하고 UX가 명확. 복잡도 낮음.
- 사용자가 "전체 메모 중 최근 수정순"을 한눈에 볼 수 있음.

**방안 B — 폴더별 독립 정렬**
- `folders` 테이블에 `sort_by` 컬럼 추가
- `SidebarTree`의 `sortBy` 상태를 `Record<folderId, SortBy>` Map으로 변경
- 각 `TreeSection` 헤더에 미니 정렬 버튼 추가
- DB 마이그레이션 필요

**권장:** 우선 방안 A 유지, 사용자 피드백에 따라 방안 B 검토.

## 참고

- `src/renderer/src/components/MainPanel/index.tsx` — `SidebarTree`, `sortNotes()`
- `src/main/services/database.ts` — `folders` 테이블
