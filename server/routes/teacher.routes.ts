import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { hashPassword } from "../auth";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { logDataChange, compareChanges } from "../utils/logger";
import { insertTeacherSchema } from "@shared/schema";

const router = Router();

// 교사 생성 스키마 (email 포함)
const createTeacherSchema = z.object({
  email: z.string().email("유효한 이메일 형식이 아닙니다."),
  name: z.string().min(1, "이름은 필수입니다."),
  phone: z.string().nullable().optional(),
  birth: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
});

// 교사 수정 스키마 (부분 업데이트)
const updateTeacherSchema = insertTeacherSchema.partial();

// GET /api/users - 모든 사용자 조회 (관리자 전용)
router.get("/users", requireAdmin, async (req, res) => {
  const allUsers = await storage.getUsers();
  const sanitizedUsers = allUsers.map(({ password, ...rest }) => rest);
  res.json(sanitizedUsers);
});

// GET /api/mokjang-teachers - 모든 목장-교사 매핑 조회
router.get("/mokjang-teachers", requireAuth, async (req, res) => {
  const mokjangTeachers = await storage.getAllMokjangTeachers();
  res.json(mokjangTeachers);
});

// GET /api/teachers - 모든 교사 조회
router.get("/teachers", requireAuth, async (req, res) => {
  const { ministryId } = req.query;
  if (ministryId && typeof ministryId === "string") {
    const teachers = await storage.getTeachersByMinistryId(ministryId);
    return res.json(teachers);
  }
  const teachers = await storage.getTeachers();
  res.json(teachers);
});

// GET /api/teachers/:id - 특정 교사 조회
router.get("/teachers/:id", requireAuth, async (req, res) => {
  const teacher = await storage.getTeacher(req.params.id);
  if (!teacher) return res.sendStatus(404);
  res.json(teacher);
});

// POST /api/teachers - 교사 생성 (관리자 전용)
router.post("/teachers", requireAdmin, validateBody(createTeacherSchema), async (req, res) => {
  const user = req.user!;
  const { email, name, phone, birth, startedAt } = req.body;

  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
  }

  const defaultPassword = "shepherd1234";
  const hashedPassword = await hashPassword(defaultPassword);

  const newUser = await storage.createUser({
    email,
    password: hashedPassword,
    role: "teacher",
    mustChangePassword: true,
  });

  const teacher = await storage.createTeacher({
    userId: newUser.id,
    name,
    phone: phone || null,
    birth: birth || null,
    startedAt: startedAt || null,
  });

  await logDataChange({
    userId: user.id,
    action: "create",
    targetType: "teacher",
    targetId: teacher.id,
    targetName: teacher.name,
    changes: { created: { email, name, phone, birth, startedAt } },
  });

  res.status(201).json(teacher);
});

// PATCH /api/teachers/:id - 교사 수정 (관리자 전용)
router.patch("/teachers/:id", requireAdmin, validateBody(updateTeacherSchema), async (req, res) => {
  const user = req.user!;

  const oldTeacher = await storage.getTeacher(req.params.id);
  if (!oldTeacher) return res.sendStatus(404);

  const teacher = await storage.updateTeacher(req.params.id, req.body);
  if (!teacher) return res.sendStatus(404);

  const changes = compareChanges(oldTeacher, req.body);
  if (Object.keys(changes).length > 0) {
    await logDataChange({
      userId: user.id,
      action: "update",
      targetType: "teacher",
      targetId: teacher.id,
      targetName: teacher.name,
      changes,
    });
  }

  res.json(teacher);
});

// DELETE /api/teachers/:id - 교사 삭제 (관리자 전용)
router.delete("/teachers/:id", requireAdmin, async (req, res) => {
  const user = req.user!;

  const teacher = await storage.getTeacher(req.params.id);
  if (!teacher) return res.sendStatus(404);

  const deleted = await storage.deleteTeacher(req.params.id);
  if (!deleted) return res.sendStatus(404);

  await logDataChange({
    userId: user.id,
    action: "delete",
    targetType: "teacher",
    targetId: req.params.id,
    targetName: teacher.name,
    changes: { deleted: teacher },
  });

  res.sendStatus(200);
});

// GET /api/teachers/:id/mokjangs - 교사의 목장 목록 조회
router.get("/teachers/:id/mokjangs", requireAuth, async (req, res) => {
  const mokjangs = await storage.getMokjangsByTeacherId(req.params.id);
  res.json(mokjangs);
});

// POST /api/teachers/:id/reset-password - 비밀번호 초기화 (관리자 전용)
router.post("/teachers/:id/reset-password", requireAdmin, async (req, res) => {
  const adminUser = req.user!;

  const teacher = await storage.getTeacher(req.params.id);
  if (!teacher) return res.status(404).json({ message: "교사를 찾을 수 없습니다." });
  if (!teacher.userId) return res.status(400).json({ message: "연결된 사용자 계정이 없습니다." });

  const defaultPassword = "shepherd1234";
  const hashedPassword = await hashPassword(defaultPassword);

  const updated = await storage.updateUser(teacher.userId, {
    password: hashedPassword,
    mustChangePassword: true,
  });
  if (!updated) return res.status(500).json({ message: "비밀번호 초기화에 실패했습니다." });

  await logDataChange({
    userId: adminUser.id,
    action: "update",
    targetType: "teacher",
    targetId: teacher.id,
    targetName: teacher.name,
    changes: { passwordReset: { old: null, new: true } },
  });

  res.json({ message: "비밀번호가 초기화되었습니다.", defaultPassword });
});

export default router;
