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
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// 싱글톤 패턴: 개발 환경에서 Hot Reload 시 연결 재사용
function getPool(): pg.Pool {
  if (process.env.NODE_ENV !== "production") {
    // 개발 환경: global에 저장하여 재사용
    if (!globalThis.__dbPool) {
      globalThis.__dbPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }
    return globalThis.__dbPool;
  }

  // 프로덕션 환경: 새 인스턴스 생성
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

function getDb() {
  if (process.env.NODE_ENV !== "production") {
    if (!globalThis.__db) {
      globalThis.__db = drizzle(getPool(), { schema });
    }
    return globalThis.__db;
  }
  return drizzle(getPool(), { schema });
}

export const pool = getPool();
export const db = getDb();

// 프로세스 종료 시 연결 풀 정리 (한 번만 등록)
if (typeof globalThis.__dbPool === "undefined" || process.env.NODE_ENV === "production") {
  process.on("SIGINT", async () => {
    await pool.end();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await pool.end();
    process.exit(0);
  });
}
