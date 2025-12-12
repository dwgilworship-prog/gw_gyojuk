# Shepherd Flow - 단계별 구현 스텝 가이드

> **사용법**: AI Agent에게 PRD 문서와 함께 이 파일을 제공하고, Step 순서대로 진행을 요청합니다.

---

## 📋 전체 로드맵

| Step | 단계명 | 선행 조건 |
|------|--------|----------|
| 0 | 프로젝트 초기 설정 | 없음 |
| 1 | 데이터베이스 스키마 | Step 0 |
| 2 | 인증 시스템 | Step 1 |
| 3 | 레이아웃 및 네비게이션 | Step 2 |
| 4 | 학생 관리 (CRUD) | Step 3 |
| 5 | 교사 관리 (CRUD) | Step 3 |
| 6 | 목장 관리 (CRUD + 배정) | Step 4, 5 |
| 7 | 출석 체크 시스템 | Step 6 |
| 8 | 목장 보고서 | Step 7 |
| 9 | 대시보드 | Step 7, 8 |
| 10 | UI/UX 폴리싱 및 테스트 | Step 9 |

---

## Step 0: 프로젝트 초기 설정

### 목표
Next.js 14 프로젝트 생성 및 개발 환경 구축

### 해야 할 것
1. Next.js 14 프로젝트 생성 (App Router, TypeScript, Tailwind CSS)
2. 핵심 의존성 설치
   - Supabase 클라이언트 (@supabase/supabase-js, @supabase/ssr)
   - UI/애니메이션 (framer-motion, lucide-react)
   - 차트 (recharts)
   - 유틸리티 (date-fns, clsx, tailwind-merge)
3. shadcn/ui 초기화 및 필수 컴포넌트 설치
4. PRD 6.1절의 컬러 시스템을 globals.css에 적용
5. 폴더 구조 생성 (components, lib, hooks, types, stores)
6. 환경 변수 파일 생성 (.env.local)

### 완료 기준
- `npm run dev`로 프로젝트 정상 실행
- shadcn/ui 컴포넌트 import 가능
- Tailwind CSS 정상 작동

---

## Step 1: 데이터베이스 스키마

### 목표
Supabase에 PRD 7절의 데이터 모델 구현

### 해야 할 것
1. PRD 7절 ERD 기반으로 Supabase SQL 작성
2. 테이블 생성: teachers, mokjangs, mokjang_teachers, students, attendance_logs, reports
3. ENUM 타입 생성: user_role, student_status, attendance_status
4. 필요한 인덱스 생성
5. updated_at 자동 갱신 트리거 생성
6. RLS(Row Level Security) 정책 설정
   - Admin: 모든 테이블 풀 액세스
   - Teacher: 담당 목장 데이터만 접근
7. TypeScript 타입 정의 파일 생성 (src/types/database.ts)

### 완료 기준
- Supabase 대시보드에서 모든 테이블 확인
- RLS 정책 활성화 확인
- TypeScript 타입 정의 완료

---

## Step 2: 인증 시스템

### 목표
Supabase Auth 연동 및 로그인/로그아웃 구현

### 해야 할 것
1. Supabase 클라이언트 설정 파일 생성
   - 브라우저용 클라이언트 (lib/supabase/client.ts)
   - 서버용 클라이언트 (lib/supabase/server.ts)
2. 미들웨어 설정 (인증 상태 체크, 리다이렉션)
3. useAuth 커스텀 훅 구현
   - 현재 사용자 정보
   - 교사 정보 및 역할 (admin/teacher)
   - 로그인/로그아웃 함수
4. 로그인 페이지 구현 (PRD 6.2절 디자인 참고)
   - Glassmorphism 스타일 로그인 폼
   - 오로라 효과 배경 애니메이션
5. 보호된 라우트 설정

### 완료 기준
- 이메일/비밀번호 로그인 작동
- 미로그인 시 로그인 페이지로 리다이렉션
- 로그인 후 대시보드로 이동
- 로그아웃 기능 작동

---

## Step 3: 레이아웃 및 네비게이션

### 목표
대시보드 레이아웃, 사이드바, 모바일 네비게이션 구현

### 해야 할 것
1. 대시보드 레이아웃 구현
   - PRD 6.1절 "Ethereal Glass" 디자인 컨셉 적용
   - 노이즈 텍스처 배경
2. 데스크톱 사이드바 구현
   - 로고 및 제품명
   - 역할별 메뉴 분기 (PRD 3.1, 3.2절 참고)
     - Admin: 대시보드, 학생관리, 교사관리, 목장관리, 출석체크, 보고서
     - Teacher: 대시보드, 출석체크, 보고서
   - 현재 사용자 정보 표시
   - 로그아웃 버튼
3. 모바일 하단 탭 네비게이션 구현 (PRD 6.2절 참고)
   - Floating Glass Style
   - 홈/출석/보고서/메뉴
4. 헤더 컴포넌트 구현
5. 반응형 처리 (lg 브레이크포인트 기준)

### 완료 기준
- 데스크톱에서 사이드바 표시
- 모바일에서 하단 탭바 표시
- 역할에 따른 메뉴 분기 작동
- 현재 페이지 활성 상태 표시

---

## Step 4: 학생 관리 (CRUD)

### 목표
학생 목록 조회, 등록, 수정, 삭제 기능 구현 (관리자 전용)

### 해야 할 것
1. 학생 관련 Server Actions 구현
   - getStudents(): 전체 학생 목록 (목장 정보 포함)
   - getStudentsByMokjang(): 특정 목장 학생 목록
   - createStudent(): 학생 등록
   - updateStudent(): 학생 정보 수정
   - deleteStudent(): 학생 삭제
2. 학생 목록 페이지 구현 (/students)
   - 검색 기능 (이름, 학교, 목장)
   - 카드 형태 목록
   - 상태 배지 표시 (재적/휴식/졸업)
3. 학생 등록/수정 Dialog 구현
   - PRD 4.2절 FR-004 필드 참고
   - 목장 선택 드롭다운
4. 삭제 확인 및 처리
5. 관리자 권한 체크

### 완료 기준
- 학생 목록 조회 및 검색 작동
- 학생 등록 작동 (필수 필드 검증)
- 학생 정보 수정 작동
- 학생 삭제 작동
- 일반 교사 접근 시 권한 없음 처리

---

## Step 5: 교사 관리 (CRUD)

### 목표
교사 목록 조회, 등록, 수정, 삭제 기능 구현 (관리자 전용)

### 해야 할 것
1. 교사 관련 Server Actions 구현
   - getTeachers(): 전체 교사 목록 (담당 목장 포함)
   - createTeacher(): 교사 등록
   - updateTeacher(): 교사 정보 수정 (역할 변경 포함)
   - deleteTeacher(): 교사 삭제
2. 교사 목록 페이지 구현 (/teachers)
   - 역할 배지 표시 (관리자/교사)
   - 담당 목장 표시
3. 교사 등록/수정 Dialog 구현
   - 역할 선택 (admin/teacher)
4. 관리자 권한 체크

### 완료 기준
- 교사 목록 조회 작동
- 교사 등록 작동
- 역할 변경 작동
- 교사 삭제 작동

---

## Step 6: 목장 관리 (CRUD + 배정)

### 목표
목장 생성/수정/삭제 및 교사·학생 배정 기능 구현 (관리자 전용)

### 해야 할 것
1. 목장 관련 Server Actions 구현
   - getMokjangs(): 전체 목장 목록 (교사, 학생 수 포함)
   - getMyMokjangs(): 담당 목장 목록 (교사용)
   - createMokjang(): 목장 생성
   - updateMokjang(): 목장 정보 수정
   - deleteMokjang(): 목장 삭제
   - assignTeacherToMokjang(): 교사 배정
   - removeTeacherFromMokjang(): 교사 배정 해제
   - assignStudentsToMokjang(): 학생 일괄 배정
2. 목장 목록 페이지 구현 (/mokjangs)
   - 카드 형태로 표시
   - 담당 교사, 학생 수 표시
3. 목장 상세/편집 Sheet 구현
   - 기본 정보 수정
   - 교사 배정 (드롭다운 선택)
   - 학생 배정 (체크박스 다중 선택 또는 드래그앤드롭)
4. 관리자 권한 체크

### 완료 기준
- 목장 CRUD 작동
- 교사 배정/해제 작동
- 학생 배정 작동
- 배정 변경 시 실시간 반영

---

## Step 7: 출석 체크 시스템

### 목표
모바일 최적화된 출석 체크 UI 및 기능 구현

### 해야 할 것
1. 출석 관련 Server Actions 구현
   - getAttendanceByDate(): 특정 목장/날짜의 출석 현황
   - saveAttendance(): 출석 정보 일괄 저장 (upsert)
2. 출석 체크 페이지 구현 (/attendance)
   - 목장 선택 드롭다운 (담당 목장만 표시)
   - 날짜 표시 (기본: 오늘)
   - PRD 4.3절 FR-006, FR-007 참고
3. 학생별 출석 상태 토글 구현
   - 터치/클릭으로 상태 순환: 미체크 → 출석 → 지각 → 결석 → 사유결석
   - 상태별 색상 구분 (Green/Yellow/Red/Blue)
   - PRD 6.2절 Swipe Interaction 고려
4. 저장 버튼 (하단 고정)
   - 모든 학생 체크 완료 시 활성화
5. 완료 시 Confetti 애니메이션 (PRD 6.2절)
6. 중복 제출 방지 처리

### 완료 기준
- 담당 목장 학생 목록 표시
- 출석 상태 토글 작동
- 저장 및 완료 애니메이션 작동
- 기존 출석 데이터 로드
- 모바일에서 사용성 확인

---

## Step 8: 목장 보고서

### 목표
주차별 목장 보고서 작성 및 조회 기능 구현

### 해야 할 것
1. 보고서 관련 Server Actions 구현
   - getReportsByMokjang(): 특정 목장 보고서 목록
   - getReportsByDate(): 특정 날짜 전체 보고서 (관리자용)
   - getReport(): 단일 보고서 조회
   - createReport(): 보고서 생성
   - updateReport(): 보고서 수정
2. 보고서 작성 페이지 구현 (/reports)
   - 목장 선택
   - 날짜 선택 (기본: 이번 주 일요일)
   - PRD 4.4절 FR-009 필드 참고
     - 금주 출석 요약 (자동 계산 표시)
     - 나눔 내용 (Textarea)
     - 기도 제목 (Textarea)
     - 건의 사항 (Textarea)
3. 임시 저장 기능 (localStorage)
4. 제출 상태 관리
5. 관리자용 전체 보고서 열람 기능
   - 날짜별/목장별 필터링
   - 미제출 목장 표시

### 완료 기준
- 보고서 작성 및 저장 작동
- 임시 저장 작동
- 기존 보고서 불러오기 작동
- 관리자 전체 보고서 열람 작동

---

## Step 9: 대시보드

### 목표
관리자/교사별 통계 대시보드 구현

### 해야 할 것
1. 통계 관련 Server Actions 구현
   - getWeeklyStats(): 이번 주 전체 출석 통계
   - getAttendanceTrend(): 최근 4주 출석률 추이
   - getMokjangRanking(): 목장별 출석률 랭킹
   - getMyMokjangStats(): 담당 목장 통계 (교사용)
2. 관리자 대시보드 구현 (PRD 4.5절 FR-011)
   - 통계 카드 (총 학생 수, 이번 주 출석률, 보고서 제출률)
   - 주간 출석률 도넛 차트
   - 최근 4주 출석 추이 라인 차트
   - 목장별 출석률 랭킹 바 차트
   - 미제출 보고서 알림 카드
3. 교사 대시보드 구현 (PRD 4.5절 FR-012)
   - 담당 목장 출석률 카드
   - 담당 학생 최근 출석 현황
   - 장기 결석자 알림
4. 역할에 따른 대시보드 분기

### 완료 기준
- 관리자: 전체 통계 대시보드 표시
- 교사: 담당 목장 통계 대시보드 표시
- 차트 애니메이션 작동
- 데이터 실시간 반영

---

## Step 10: UI/UX 폴리싱 및 테스트

### 목표
전체 UI/UX 품질 향상 및 최종 점검

### 해야 할 것
1. 디자인 일관성 점검
   - PRD 6.1절 "Ethereal Glass" 컨셉 전체 적용 확인
   - 컬러 시스템 일관성 (Violet-Indigo 그라데이션)
   - 타이포그래피 계층 구조
2. 인터랙션 점검 (PRD 6.3절)
   - 버튼 호버 Glow 효과
   - 페이지 전환 Slide-in/Fade-in
   - 스켈레톤 로딩 UI
   - 토스트 알림
3. 반응형 점검
   - 모바일 (< 768px)
   - 태블릿 (768px - 1024px)
   - 데스크톱 (> 1024px)
   - 터치 타겟 44px 이상
4. 접근성 점검
   - 키보드 네비게이션
   - 색상 대비
   - 폼 라벨 연결
5. 성능 점검
   - Lighthouse 점수 (목표: 90+)
   - 이미지 최적화
   - 불필요한 리렌더링 제거
6. 에러 처리 점검
   - API 에러 시 사용자 피드백
   - 네트워크 오류 처리
   - 빈 상태 UI

### 완료 기준
- 모든 페이지 디자인 일관성 확보
- 모바일/데스크톱 반응형 정상 작동
- 주요 사용자 플로우 테스트 완료
- Lighthouse 성능 점수 90+ 달성

---

## 🚀 AI Agent 사용 가이드

### Step별 프롬프트 예시

```
[PRD 문서 전체 붙여넣기]

---

위 PRD와 아래 구현 가이드를 참고하여 Step {N}을 구현해주세요.

[이 가이드의 해당 Step 내용 붙여넣기]

완료 기준을 모두 만족하는지 확인 후 다음 Step으로 진행하겠습니다.
```

### 주의사항
1. **순서 준수**: 반드시 Step 순서대로 진행 (의존성 있음)
2. **완료 확인**: 각 Step의 완료 기준을 모두 만족한 후 다음 진행
3. **PRD 참조**: 상세 요구사항은 항상 PRD 문서 참조
4. **테스트**: 각 Step 완료 후 해당 기능 직접 테스트

---

**문서 버전**: 1.0
