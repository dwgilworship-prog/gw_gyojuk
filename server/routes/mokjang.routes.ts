import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { insertMokjangSchema } from "@shared/schema";

const router = Router();

// 목장 수정 스키마 (부분 업데이트)
const updateMokjangSchema = insertMokjangSchema.partial();

// GET /api/mokjangs - 모든 목장 조회
router.get("/mokjangs", requireAuth, async (req, res) => {
  const mokjangs = await storage.getMokjangs();
  res.json(mokjangs);
});

// GET /api/mokjangs/:id - 특정 목장 조회
router.get("/mokjangs/:id", requireAuth, async (req, res) => {
  const mokjang = await storage.getMokjang(req.params.id);
  if (!mokjang) return res.sendStatus(404);
  res.json(mokjang);
});

// POST /api/mokjangs - 목장 생성 (관리자 전용)
router.post("/mokjangs", requireAdmin, validateBody(insertMokjangSchema), async (req, res) => {
  const mokjang = await storage.createMokjang(req.body);
  res.status(201).json(mokjang);
});

// PATCH /api/mokjangs/:id - 목장 수정 (관리자 전용)
router.patch("/mokjangs/:id", requireAdmin, validateBody(updateMokjangSchema), async (req, res) => {
  const mokjang = await storage.updateMokjang(req.params.id, req.body);
  if (!mokjang) return res.sendStatus(404);
  res.json(mokjang);
});

// DELETE /api/mokjangs/:id - 목장 삭제 (관리자 전용)
router.delete("/mokjangs/:id", requireAdmin, async (req, res) => {
  const deleted = await storage.deleteMokjang(req.params.id);
  if (!deleted) return res.sendStatus(404);
  res.sendStatus(200);
});

// GET /api/mokjangs/:mokjangId/teachers - 목장의 교사 목록
router.get("/mokjangs/:mokjangId/teachers", requireAuth, async (req, res) => {
  const mokjangTeachers = await storage.getMokjangTeachers(req.params.mokjangId);
  res.json(mokjangTeachers);
});

// POST /api/mokjangs/:mokjangId/teachers/:teacherId - 목장에 교사 배정 (관리자 전용)
router.post("/mokjangs/:mokjangId/teachers/:teacherId", requireAdmin, async (req, res) => {
  const assignment = await storage.assignTeacherToMokjang(req.params.mokjangId, req.params.teacherId);
  res.status(201).json(assignment);
});

// DELETE /api/mokjangs/:mokjangId/teachers/:teacherId - 목장에서 교사 제거 (관리자 전용)
router.delete("/mokjangs/:mokjangId/teachers/:teacherId", requireAdmin, async (req, res) => {
  const removed = await storage.removeTeacherFromMokjang(req.params.mokjangId, req.params.teacherId);
  if (!removed) return res.sendStatus(404);
  res.sendStatus(200);
});

export default router;
