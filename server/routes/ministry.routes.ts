import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { insertMinistrySchema } from "@shared/schema";

const router = Router();

// 사역부 수정 스키마 (부분 업데이트)
const updateMinistrySchema = insertMinistrySchema.partial();

// 멤버 역할 스키마
const memberRoleSchema = z.object({
  role: z.enum(["admin", "member", "leader"]).optional().default("member"),
});

// GET /api/ministries - 모든 사역부 조회
router.get("/ministries", requireAuth, async (req, res) => {
  const ministries = await storage.getMinistries();
  res.json(ministries);
});

// POST /api/ministries - 사역부 생성 (관리자 전용)
router.post("/ministries", requireAdmin, validateBody(insertMinistrySchema), async (req, res) => {
  const ministry = await storage.createMinistry(req.body);
  res.status(201).json(ministry);
});

// PATCH /api/ministries/:id - 사역부 수정 (관리자 전용)
router.patch("/ministries/:id", requireAdmin, validateBody(updateMinistrySchema), async (req, res) => {
  const ministry = await storage.updateMinistry(req.params.id, req.body);
  if (!ministry) return res.sendStatus(404);
  res.json(ministry);
});

// DELETE /api/ministries/:id - 사역부 삭제 (관리자 전용)
router.delete("/ministries/:id", requireAdmin, async (req, res) => {
  const deleted = await storage.deleteMinistry(req.params.id);
  if (!deleted) return res.sendStatus(404);
  res.sendStatus(200);
});

// GET /api/ministries/:id/teachers - 사역부의 교사 목록
router.get("/ministries/:id/teachers", requireAuth, async (req, res) => {
  const teachers = await storage.getMinistryTeachers(req.params.id);
  res.json(teachers);
});

// POST /api/ministries/:id/teachers/:teacherId - 사역부에 교사 배정 (관리자 전용)
router.post("/ministries/:id/teachers/:teacherId", requireAdmin, validateBody(memberRoleSchema), async (req, res) => {
  const assignment = await storage.assignTeacherToMinistry(req.params.id, req.params.teacherId, req.body.role);
  res.status(201).json(assignment);
});

// DELETE /api/ministries/:id/teachers/:teacherId - 사역부에서 교사 제거 (관리자 전용)
router.delete("/ministries/:id/teachers/:teacherId", requireAdmin, async (req, res) => {
  const removed = await storage.removeTeacherFromMinistry(req.params.id, req.params.teacherId);
  if (!removed) return res.sendStatus(404);
  res.sendStatus(200);
});

// GET /api/ministries/:id/students - 사역부의 학생 목록
router.get("/ministries/:id/students", requireAuth, async (req, res) => {
  const students = await storage.getMinistryStudents(req.params.id);
  res.json(students);
});

// POST /api/ministries/:id/students/:studentId - 사역부에 학생 배정 (관리자 전용)
router.post("/ministries/:id/students/:studentId", requireAdmin, validateBody(memberRoleSchema), async (req, res) => {
  const assignment = await storage.assignStudentToMinistry(req.params.id, req.params.studentId, req.body.role);
  res.status(201).json(assignment);
});

// DELETE /api/ministries/:id/students/:studentId - 사역부에서 학생 제거 (관리자 전용)
router.delete("/ministries/:id/students/:studentId", requireAdmin, async (req, res) => {
  const removed = await storage.removeStudentFromMinistry(req.params.id, req.params.studentId);
  if (!removed) return res.sendStatus(404);
  res.sendStatus(200);
});

// GET /api/ministry-members - 모든 사역부 멤버 조회
router.get("/ministry-members", requireAuth, async (req, res) => {
  const [teachers, students] = await Promise.all([
    storage.getAllMinistryTeachers(),
    storage.getAllMinistryStudents(),
  ]);
  res.json({ teachers, students });
});

export default router;
