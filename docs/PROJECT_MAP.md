# PROJECT_MAP.md - 교적부 시스템 프로젝트 지도

> 이 문서는 에이전트가 전체 코드를 읽지 않고도 프로젝트 구조를 파악할 수 있도록 작성된 핵심 요약본입니다.

---

## 1. Folder Structure (폴더 구조)

```
gw_gyojuk/
├── client/                    # 프론트엔드 (React SPA)
│   └── src/
│       ├── components/        # 재사용 UI 컴포넌트
│       │   ├── ui/            # shadcn/ui 기반 공통 컴포넌트
│       │   ├── sms/           # SMS 발송 관련 컴포넌트
│       │   ├── student-memos/ # 학생 메모 컴포넌트
│       │   └── teacher-dashboard/ # 교사용 대시보드 컴포넌트
│       ├── hooks/             # 커스텀 훅 (use-auth, use-theme 등)
│       ├── lib/               # 유틸리티, 상수, 보호된 라우트
│       ├── pages/             # 페이지 컴포넌트
│       ├── App.tsx            # 라우팅 설정 및 앱 진입점
│       └── main.tsx           # React 앱 마운트
│
├── server/                    # 백엔드 (Express API)
│   ├── routes/                # API 라우트 (도메인별 분리)
│   │   ├── index.ts           # 라우트 등록 진입점
│   │   ├── teacher.routes.ts  # 교사 CRUD
│   │   ├── student.routes.ts  # 학생 CRUD
│   │   ├── mokjang.routes.ts  # 목장(소그룹) 관리
│   │   ├── attendance.routes.ts # 출석 기록
│   │   ├── ministry.routes.ts # 봉사부서 관리
│   │   ├── sms.routes.ts      # SMS 발송
│   │   ├── report.routes.ts   # 목장 보고서
│   │   ├── memo.routes.ts     # 학생 메모
│   │   ├── dashboard.routes.ts # 대시보드 데이터
│   │   ├── admin.routes.ts    # 관리자 기능
│   │   └── health.routes.ts   # 헬스체크
│   ├── middleware/            # 미들웨어
│   │   ├── auth.middleware.ts # 인증/권한 체크
│   │   ├── validate.middleware.ts # 입력 유효성 검사
│   │   └── rate-limit.middleware.ts # Rate limiting
│   ├── utils/                 # 유틸리티
│   │   └── logger.ts          # 로그인/데이터 변경 로깅
│   ├── auth.ts                # Passport.js 인증 설정
│   ├── storage.ts             # 데이터 액세스 레이어 (Drizzle ORM)
│   ├── db.ts                  # PostgreSQL 연결
│   ├── sms.ts                 # Aligo SMS API 연동
│   └── index.ts               # 서버 진입점
│
├── shared/                    # 프론트/백엔드 공유
│   └── schema.ts              # Drizzle 스키마 + Zod 타입 정의
│
├── docs/                      # 문서
│   └── improvements/          # 개선 문서 버전별 관리
│
└── drizzle.config.ts          # Drizzle ORM 설정
```

---

## 2. Tech Stack (기술 스택)

| 영역 | 기술 |
|------|------|
| **Frontend** | React 18, TypeScript, Wouter (라우팅), TanStack Query (서버 상태) |
| **UI** | Tailwind CSS, shadcn/ui (Radix UI 기반), Lucide Icons |
| **Backend** | Express.js, TypeScript |
| **Database** | PostgreSQL (Drizzle ORM) |
| **Authentication** | Passport.js (Local Strategy), express-session |
| **Validation** | Zod (스키마 기반 유효성 검사) |
| **SMS** | Aligo API (aligoapi 패키지) |
| **Build** | Vite (클라이언트), esbuild (서버) |
| **PWA** | vite-plugin-pwa |

---

## 3. Current Core Logic (핵심 비즈니스 흐름)

### 3.1 사용자 역할
- **admin**: 전체 시스템 관리 (교사/목장/학생 관리, 출석 대시보드, SMS 발송)
- **teacher**: 담당 목장의 학생 출석 체크 및 보고서 작성

### 3.2 주요 흐름

```
[교사 등록 플로우]
회원가입 → pending 상태로 생성 → admin이 승인(active) → 목장 배정

[학생 관리 플로우]
학생 등록 → 목장 배정 → 출석 관리 → (장기결석 시) 연락 기록

[출석 체크 플로우]
교사 로그인 → 담당 목장 선택 → 주일 날짜 선택 → 학생별 출석 상태 입력
출석 상태: ATTENDED(출석) | LATE(지각) | ABSENT(결석) | EXCUSED(공결)

[보고서 플로우]
출석 체크 후 → 목장 보고서 작성 (내용, 기도제목, 건의사항)

[SMS 발송 플로우] (admin only)
수신자 선택 → 메시지 작성 → 발송 → 발송 내역 조회
```

### 3.3 권한 체크 위치
- **클라이언트**: `client/src/lib/protected-route.tsx` - 라우트별 접근 제어
- **서버**: `server/middleware/auth.middleware.ts` - API별 인증/권한 체크

---

## 4. Data Schema (DB 테이블 구조)

### 핵심 테이블 관계도

```
users (1) ─────── (0..1) teachers
                           │
                           ├── mokjang_teachers (N:M) ── mokjangs
                           │                               │
                           │                               └── students (1:N)
                           │                                      │
                           └── ministry_teachers (N:M) ─ ministries ─ ministry_students
```

### 테이블 상세

#### `users` - 사용자 계정
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR(36) | PK (UUID) |
| email | TEXT | 로그인 이메일 |
| password | TEXT | 해시된 비밀번호 |
| role | ENUM | `admin` \| `teacher` |
| must_change_password | BOOLEAN | 초기 비밀번호 변경 필요 여부 |

#### `teachers` - 교사 정보
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR(36) | PK |
| user_id | VARCHAR(36) | FK → users |
| name | TEXT | 이름 |
| phone | TEXT | 연락처 |
| status | ENUM | `pending` \| `active` \| `rest` \| `resigned` |

#### `mokjangs` - 목장 (소그룹)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR(36) | PK |
| name | TEXT | 목장 이름 |
| target_grade | TEXT | 대상 학년 |
| is_active | BOOLEAN | 활성 여부 |

#### `students` - 학생
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR(36) | PK |
| mokjang_id | VARCHAR(36) | FK → mokjangs (nullable) |
| name | TEXT | 이름 |
| birth | DATE | 생년월일 |
| phone | TEXT | 본인 연락처 |
| parent_phone | TEXT | 부모 연락처 |
| grade | TEXT | 학년 |
| gender | ENUM | `M` \| `F` |
| baptism | ENUM | `infant` \| `baptized` \| `confirmed` \| `none` |
| status | ENUM | `ACTIVE` \| `REST` \| `GRADUATED` |

#### `attendance_logs` - 출석 기록
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR(36) | PK |
| student_id | VARCHAR(36) | FK → students |
| date | DATE | 출석 날짜 |
| status | ENUM | `ATTENDED` \| `LATE` \| `ABSENT` \| `EXCUSED` |
| memo | TEXT | 메모 |

#### `reports` - 목장 보고서
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR(36) | PK |
| mokjang_id | VARCHAR(36) | FK → mokjangs |
| teacher_id | VARCHAR(36) | FK → teachers |
| date | DATE | 보고 날짜 |
| content | TEXT | 보고 내용 |
| prayer_request | TEXT | 기도제목 |
| suggestions | TEXT | 건의사항 |

#### `ministries` / `ministry_teachers` / `ministry_students` - 봉사부서
- 학생과 교사를 봉사부서에 배정 (N:M 관계)
- role: `admin` | `leader` | `member`

#### `student_observations` - 학생 특이사항
- 출석 체크 시 기록하는 특이사항

#### `student_memos` - 학생 메모
- 학생별 일반 메모 (고정 기능 포함)

#### `long_absence_contacts` - 장기결석 연락 기록
- 장기 결석 학생에 대한 연락 이력

#### `login_logs` / `data_change_logs` - 감사 로그
- 로그인/로그아웃 기록
- 학생/교사 데이터 변경 이력

---

## 5. API Endpoints 요약

| Prefix | 담당 | 주요 기능 |
|--------|------|----------|
| `/api/login, /logout, /register, /user` | auth.ts | 인증 |
| `/api/teachers/*` | teacher.routes.ts | 교사 CRUD, 승인 |
| `/api/students/*` | student.routes.ts | 학생 CRUD |
| `/api/mokjangs/*` | mokjang.routes.ts | 목장 관리, 교사 배정 |
| `/api/attendance/*` | attendance.routes.ts | 출석 기록 CRUD |
| `/api/ministries/*` | ministry.routes.ts | 봉사부서 관리 |
| `/api/sms/*` | sms.routes.ts | SMS 발송/조회 |
| `/api/reports/*` | report.routes.ts | 목장 보고서 |
| `/api/dashboard/*` | dashboard.routes.ts | 대시보드 통계 |
| `/api/admin/*` | admin.routes.ts | 관리자 기능 |
| `/api/memos/*` | memo.routes.ts | 학생 메모 CRUD |

---

## 6. 에이전트 활용 가이드

이 문서를 기반으로 다음과 같은 질문을 할 수 있습니다:

- "권한 체크 로직은 어디에 있고, 새로운 권한 레벨을 추가하려면 어디를 수정해야 할까?"
- "학생 데이터 수정 시 변경 이력을 추적하는 로직이 있는가?"
- "새로운 API 엔드포인트를 추가하려면 어떤 패턴을 따라야 하는가?"
- "출석 통계 대시보드 로직을 확장하려면 어디를 봐야 하는가?"

---

*마지막 업데이트: 2025-01-05*
