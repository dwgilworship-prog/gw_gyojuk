import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { logDataChange, compareChanges } from "../utils/logger";
import { insertStudentSchema, insertLongAbsenceContactSchema } from "@shared/schema";

const router = Router();

// 학생 수정 스키마 (부분 업데이트)
const updateStudentSchema = insertStudentSchema.partial();

// GET /api/students - 모든 학생 조회
router.get("/students", requireAuth, async (req, res) => {
  const { mokjangId, ministryId } = req.query;
  if (mokjangId && typeof mokjangId === "string") {
    const students = await storage.getStudentsByMokjangId(mokjangId);
    return res.json(students);
  }
  if (ministryId && typeof ministryId === "string") {
    const students = await storage.getStudentsByMinistryId(ministryId);
    return res.json(students);
  }
  const students = await storage.getStudents();
  res.json(students);
});

// GET /api/students/:id - 특정 학생 조회
router.get("/students/:id", requireAuth, async (req, res) => {
  const student = await storage.getStudent(req.params.id);
  if (!student) return res.sendStatus(404);
  res.json(student);
});

// POST /api/students - 학생 생성
router.post("/students", requireAuth, validateBody(insertStudentSchema), async (req, res) => {
  const student = await storage.createStudent(req.body);

  await logDataChange({
    userId: req.user!.id,
    action: "create",
    targetType: "student",
    targetId: student.id,
    targetName: student.name,
    changes: { created: req.body },
  });

  res.status(201).json(student);
});

// PATCH /api/students/:id - 학생 수정
router.patch("/students/:id", requireAuth, validateBody(updateStudentSchema), async (req, res) => {
  const oldStudent = await storage.getStudent(req.params.id);
  if (!oldStudent) return res.sendStatus(404);

  const student = await storage.updateStudent(req.params.id, req.body);
  if (!student) return res.sendStatus(404);

  const changes = compareChanges(oldStudent, req.body);
  if (Object.keys(changes).length > 0) {
    await logDataChange({
      userId: req.user!.id,
      action: "update",
      targetType: "student",
      targetId: student.id,
      targetName: student.name,
      changes,
    });
  }

  res.json(student);
});

// DELETE /api/students/:id - 학생 삭제 (관리자 전용)
router.delete("/students/:id", requireAdmin, async (req, res) => {
  const user = req.user!;

  const student = await storage.getStudent(req.params.id);
  if (!student) return res.sendStatus(404);

  const deleted = await storage.deleteStudent(req.params.id);
  if (!deleted) return res.sendStatus(404);

  await logDataChange({
    userId: user.id,
    action: "delete",
    targetType: "student",
    targetId: req.params.id,
    targetName: student.name,
    changes: { deleted: student },
  });

  res.sendStatus(200);
});

// GET /api/students/:studentId/observations - 학생 특이사항 조회
router.get("/students/:studentId/observations", requireAuth, async (req, res) => {
  const observations = await storage.getObservationsByStudentId(req.params.studentId);
  res.json(observations);
});

// GET /api/long-absence-students - 장기 결석 학생 목록 (관리자 전용)
router.get("/long-absence-students", requireAdmin, async (req, res) => {
  const allStudents = await storage.getStudents();
  const activeStudents = allStudents.filter(s => s.status === "ACTIVE");

  // 배치 쿼리로 모든 학생의 마지막 출석일 한 번에 조회 (N+1 최적화)
  const studentIds = activeStudents.map(s => s.id);
  const lastAttendanceMap = await storage.getStudentsLastAttendanceBatch(studentIds);

  const now = new Date();
  const results = activeStudents.map(student => {
    const lastDateStr = lastAttendanceMap.get(student.id);
    if (!lastDateStr) {
      return { student, weeksAbsent: 999, lastAttendanceDate: null };
    }
    const lastDate = new Date(lastDateStr);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksAbsent = Math.floor(diffDays / 7);
    return { student, weeksAbsent, lastAttendanceDate: lastDateStr };
  });

  const longAbsenceStudents = results.filter(r => r.weeksAbsent >= 2 && r.weeksAbsent !== 999);
  longAbsenceStudents.sort((a, b) => b.weeksAbsent - a.weeksAbsent);

  res.json(longAbsenceStudents);
});

// GET /api/long-absence-contacts/:studentId - 학생별 장기 결석 연락 기록
router.get("/long-absence-contacts/:studentId", requireAuth, async (req, res) => {
  const contacts = await storage.getLongAbsenceContactsByStudentId(req.params.studentId);
  res.json(contacts);
});

// POST /api/long-absence-contacts - 장기 결석 연락 기록 생성
router.post("/long-absence-contacts", requireAuth, validateBody(insertLongAbsenceContactSchema), async (req, res) => {
  const contact = await storage.createLongAbsenceContact(req.body);
  res.status(201).json(contact);
});

export default router;
