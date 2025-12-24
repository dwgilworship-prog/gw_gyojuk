# GW_GYOJUK 프로젝트 인프라 설정

> 다른 AI에게 질문할 때 이 파일을 컨텍스트로 제공하세요.

---

## 1. 기술 스택 요약

| 카테고리 | 기술 | 버전/세부사항 |
|---------|------|--------------|
| **Language** | TypeScript | 5.6.3 |
| **Runtime** | Node.js | (ESM 모듈 방식) |
| **Frontend** | React | 18.3.1 |
| **Backend** | Express.js | 4.21.2 |
| **Database** | PostgreSQL | Supabase 호스팅 |
| **ORM** | Drizzle ORM | 0.39.3 |
| **Bundler** | Vite | 5.4.20 |
| **CSS** | Tailwind CSS | 3.4.17 |
| **Deployment** | Render | (추정) |

---

## 2. 프로젝트 구조

```
gw_gyojuk/
├── client/               # React 프론트엔드
│   └── src/
│       ├── components/   # UI 컴포넌트 (Radix UI 기반)
│       ├── pages/        # 페이지 컴포넌트
│       └── hooks/        # 커스텀 훅
├── server/               # Express 백엔드
│   ├── index.ts          # 서버 엔트리포인트
│   ├── routes.ts         # API 라우트
│   ├── db.ts             # DB 연결 (Drizzle + pg Pool)
│   ├── auth.ts           # 인증 (Passport.js)
│   ├── sms.ts            # SMS 발송 (aligoapi)
│   └── storage.ts        # 파일 저장소
├── shared/               # 공유 코드
│   └── schema.ts         # Drizzle 스키마 정의
├── dist/                 # 빌드 결과물
├── drizzle.config.ts     # Drizzle Kit 설정
├── vite.config.ts        # Vite 설정
└── package.json
```

---

## 3. 데이터베이스 설정

### Supabase PostgreSQL

```
호스팅: Supabase
연결 모드: Transaction Pooler (PgBouncer)
포트: 6543
```

### DATABASE_URL 형식

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### DB 연결 코드 (server/db.ts)

- **ORM**: Drizzle ORM + node-postgres (pg)
- **연결 풀**: pg.Pool (싱글톤 패턴 적용)
- **PgBouncer 최적화 설정**:
  ```typescript
  {
    max: 5,                       // 클라이언트 풀 크기
    idleTimeoutMillis: 20000,     // 유휴 연결 타임아웃
    connectionTimeoutMillis: 5000, // 연결 타임아웃
    allowExitOnIdle: true
  }
  ```

### 스키마 관리

```bash
# 스키마 푸시 (Drizzle Kit)
npm run db:push
```

---

## 4. 인증 시스템

| 항목 | 설정 |
|-----|------|
| 라이브러리 | Passport.js + passport-local |
| 세션 저장소 | connect-pg-simple (PostgreSQL) |
| 세션 라이브러리 | express-session |

---

## 5. 주요 의존성

### Frontend
- **UI 컴포넌트**: Radix UI (전체 컴포넌트 세트)
- **상태 관리**: TanStack React Query 5.60
- **라우팅**: Wouter 3.3.5
- **폼**: React Hook Form + Zod
- **차트**: Recharts
- **애니메이션**: Framer Motion
- **아이콘**: Lucide React, React Icons

### Backend
- **HTTP 클라이언트**: Axios
- **SMS**: aligoapi (알리고 문자 API)
- **엑셀**: xlsx (SheetJS)
- **날짜**: date-fns

---

## 6. 빌드 & 실행 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 타입 체크
npm run check

# DB 스키마 푸시
npm run db:push
```

---

## 7. 환경 변수 (필수)

```env
DATABASE_URL=postgresql://...?pgbouncer=true
# 기타 환경변수는 .env 파일 참조
```

---

## 8. 배포 환경

| 항목 | 설정 |
|-----|------|
| 플랫폼 | Render (추정) |
| 빌드 명령 | `npm run build` |
| 시작 명령 | `npm run start` |
| 출력 디렉토리 | `dist/` |

---

## 9. 알려진 이슈 & 해결책

### MaxClientsInSessionMode 에러
- **원인**: Hot Reload 시 DB 연결 누적
- **해결**: 싱글톤 패턴 적용 + Transaction Pooler 모드 사용

### Safari 스크롤 이슈
- **원인**: Flex 컨테이너 설정 누락
- **해결**: 부모 컨테이너에 `display: flex; flex-direction: column;` 적용

---

## 10. Path Aliases

```typescript
// tsconfig.json & vite.config.ts
"@/*"       → "./client/src/*"
"@shared/*" → "./shared/*"
"@assets/*" → "./attached_assets/*"
```

---

## 11. 코드 스타일

- ESM 모듈 (`"type": "module"`)
- TypeScript strict 모드
- Tailwind CSS 유틸리티 클래스

---

*마지막 업데이트: 2024-12-24*
