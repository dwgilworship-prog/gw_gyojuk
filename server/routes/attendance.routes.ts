import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { insertAttendanceLogSchema, insertStudentObservationSchema } from "@shared/schema";

const router = Router();

// 출석 배열 스키마
const attendanceArraySchema = z.array(insertAttendanceLogSchema);

// 출석 삭제 스키마
const deleteAttendanceSchema = z.object({
  studentId: z.string().min(1, "studentId는 필수입니다."),
  date: z.string().min(1, "date는 필수입니다."),
});

// 특이사항 수정 스키마
const updateObservationSchema = insertStudentObservationSchema.partial();

// GET /api/attendance - 출석 조회
router.get("/attendance", requireAuth, async (req, res) => {
  const { date, mokjangId, startDate, endDate } = req.query;
  if (date && mokjangId) {
    const logs = await storage.getAttendanceByDateAndMokjang(date as string, mokjangId as string);
    return res.json(logs);
  }
  if (date && !mokjangId) {
    const logs = await storage.getAttendanceByDate(date as string);
    return res.json(logs);
  }
  if (startDate && endDate) {
    const logs = await storage.getAttendanceByDateRange(startDate as string, endDate as string);
    return res.json(logs);
  }
  res.json([]);
});

// POST /api/attendance - 출석 저장
router.post("/attendance", requireAuth, validateBody(attendanceArraySchema), async (req, res) => {
  const logs = await storage.saveAttendance(req.body);
  res.status(201).json(logs);
});

// DELETE /api/attendance - 출석 삭제
router.delete("/attendance", requireAuth, validateBody(deleteAttendanceSchema), async (req, res) => {
  const { studentId, date } = req.body;
  const deleted = await storage.deleteAttendance(studentId, date);
  if (!deleted) return res.sendStatus(404);
  res.sendStatus(200);
});

// GET /api/attendance-dashboard - 출석 대시보드 (관리자 전용)
router.get("/attendance-dashboard", requireAdmin, async (req, res) => {
  const { date } = req.query;

  if (!date || typeof date !== "string") {
    return res.status(400).json({ message: "date 파라미터가 필요합니다." });
  }

  try {
    const attendanceLogs = await storage.getAttendanceByDate(date);
    const observations = await storage.getObservationsByDate(date);
    const allStudents = await storage.getStudents();
    const activeStudents = allStudents.filter(s => s.status === 'ACTIVE');
    const mokjangs = await storage.getMokjangs();

    const stats = {
      total: activeStudents.length,
      attended: attendanceLogs.filter(l => l.status === 'ATTENDED').length,
      late: attendanceLogs.filter(l => l.status === 'LATE').length,
      absent: attendanceLogs.filter(l => l.status === 'ABSENT').length,
      excused: attendanceLogs.filter(l => l.status === 'EXCUSED').length,
      notChecked: activeStudents.length - attendanceLogs.length,
    };

    const studentDetails = activeStudents.map(student => {
      const attendance = attendanceLogs.find(l => l.studentId === student.id);
      const studentObservations = observations.filter(o => o.studentId === student.id);
      const mokjang = mokjangs.find(m => m.id === student.mokjangId);

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        mokjangId: student.mokjangId,
        mokjangName: mokjang?.name || '미배정',
        status: attendance?.status || null,
        memo: attendance?.memo || null,
        observations: studentObservations.map(o => o.content),
        hasObservation: studentObservations.length > 0,
      };
    });

    res.json({ stats, students: studentDetails });
  } catch (error) {
    console.error("출석 대시보드 조회 오류:", error);
    res.status(500).json({ message: "조회 중 오류가 발생했습니다." });
  }
});

// GET /api/observations - 특이사항 조회
router.get("/observations", requireAuth, async (req, res) => {
  const { date, studentId } = req.query;

  if (studentId && date) {
    const observations = await storage.getObservationsByStudentAndDate(
      studentId as string,
      date as string
    );
    return res.json(observations);
  }

  if (date && typeof date === "string") {
    const observations = await storage.getObservationsByDate(date);
    return res.json(observations);
  }

  res.json([]);
});

// GET /api/observations/:id - 특정 특이사항 조회
router.get("/observations/:id", requireAuth, async (req, res) => {
  const observation = await storage.getObservation(req.params.id);
  if (!observation) return res.sendStatus(404);
  res.json(observation);
});

// POST /api/observations - 특이사항 생성
router.post("/observations", requireAuth, validateBody(insertStudentObservationSchema), async (req, res) => {
  const teacher = await storage.getTeacherByUserId(req.user!.id);

  const observation = await storage.createObservation({
    ...req.body,
    teacherId: teacher?.id || null,
  });

  res.status(201).json(observation);
});

// PATCH /api/observations/:id - 특이사항 수정
router.patch("/observations/:id", requireAuth, validateBody(updateObservationSchema), async (req, res) => {
  const observation = await storage.updateObservation(req.params.id, req.body);
  if (!observation) return res.sendStatus(404);
  res.json(observation);
});

// DELETE /api/observations/:id - 특이사항 삭제
router.delete("/observations/:id", requireAuth, async (req, res) => {
  const deleted = await storage.deleteObservation(req.params.id);
  if (!deleted) return res.sendStatus(404);
  res.sendStatus(200);
});

export default router;
