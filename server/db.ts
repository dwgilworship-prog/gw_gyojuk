import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// TypeScript: global 객체 타입 확장
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  // eslint-disable-next-line no-var
  var __dbSignalHandlersRegistered: boolean | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * Supabase Transaction Pooler (PgBouncer) 호환 설정
 *
 * 주의: DATABASE_URL에 다음 파라미터가 포함되어야 합니다:
 * - 포트: 6543 (Transaction Mode)
 * - ?pgbouncer=true (PgBouncer 모드 활성화)
 *
 * 예시: postgresql://user:pass@host:6543/postgres?pgbouncer=true
 */
const poolConfig: pg.PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  // PgBouncer Transaction Mode 최적화 설정
  max: 5,                       // PgBouncer가 연결을 관리하므로 클라이언트 풀은 작게 유지
  idleTimeoutMillis: 20000,     // 20초 유휴 연결 타임아웃
  connectionTimeoutMillis: 5000, // 연결 타임아웃 5초
  allowExitOnIdle: true,        // 유휴 시 프로세스 종료 허용
};

// 싱글톤 패턴: 개발/운영 환경 모두 인스턴스 재사용
function getPool(): pg.Pool {
  if (!globalThis.__dbPool) {
    globalThis.__dbPool = new Pool(poolConfig);

    // Pool 에러 핸들링
    globalThis.__dbPool.on("error", (err) => {
      console.error("[DB Pool] Unexpected error on idle client:", err);
    });
  }
  return globalThis.__dbPool;
}

function getDb() {
  if (!globalThis.__db) {
    globalThis.__db = drizzle(getPool(), { schema });
  }
  return globalThis.__db;
}

export const pool = getPool();
export const db = getDb();

// 프로세스 종료 시 연결 풀 정리 (중복 등록 방지)
if (!globalThis.__dbSignalHandlersRegistered) {
  globalThis.__dbSignalHandlersRegistered = true;

  const gracefulShutdown = async (signal: string) => {
    console.log(`[DB] ${signal} received, closing pool...`);
    try {
      await pool.end();
      console.log("[DB] Pool closed successfully");
    } catch (err) {
      console.error("[DB] Error closing pool:", err);
    }
    process.exit(0);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}
