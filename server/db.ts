import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                      // 최대 연결 수 (Supabase 무료 티어 고려)
  idleTimeoutMillis: 30000,     // 30초 동안 미사용 연결 자동 종료
  connectionTimeoutMillis: 2000, // 연결 타임아웃 2초
});

// 프로세스 종료 시 연결 풀 정리
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

export const db = drizzle(pool, { schema });
