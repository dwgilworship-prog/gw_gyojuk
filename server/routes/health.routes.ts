import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * 헬스 체크 엔드포인트
 * - 인증 불필요 (cronjob/모니터링 서비스용)
 * - 민감한 정보 노출 없음
 */
router.get("/health", async (_req, res) => {
  try {
    // DB 연결 확인 (간단한 쿼리)
    await db.execute(sql`SELECT 1`);

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    // 에러 상세는 로그로만 남기고, 클라이언트에는 최소 정보만
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
