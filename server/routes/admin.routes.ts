import { Router } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// GET /api/admin/logs/login - 로그인 로그 조회
router.get("/admin/logs/login", requireAdmin, async (req, res) => {
  const { page = "1", limit = "50" } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  try {
    const logs = await storage.getLoginLogs(limitNum, offset);
    const total = await storage.getLoginLogsCount();
    res.json({ logs, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error("로그인 로그 조회 오류:", error);
    res.status(500).json({ message: "로그 조회 중 오류가 발생했습니다." });
  }
});

// GET /api/admin/logs/data-change - 데이터 변경 로그 조회
router.get("/admin/logs/data-change", requireAdmin, async (req, res) => {
  const { page = "1", limit = "50", targetType } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  try {
    const logs = await storage.getDataChangeLogs(limitNum, offset, targetType as string | undefined);
    const total = await storage.getDataChangeLogsCount(targetType as string | undefined);
    res.json({ logs, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error("데이터 변경 로그 조회 오류:", error);
    res.status(500).json({ message: "로그 조회 중 오류가 발생했습니다." });
  }
});

export default router;
