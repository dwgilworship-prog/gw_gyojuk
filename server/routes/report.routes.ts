import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { insertReportSchema } from "@shared/schema";

const router = Router();

// 보고서 수정 스키마 (부분 업데이트)
const updateReportSchema = insertReportSchema.partial();

// GET /api/reports - 보고서 조회
router.get("/reports", requireAuth, async (req, res) => {
  const { mokjangId, date } = req.query;
  if (mokjangId && typeof mokjangId === "string") {
    const reports = await storage.getReportsByMokjangId(mokjangId);
    return res.json(reports);
  }
  if (date && typeof date === "string") {
    const reports = await storage.getReportsByDate(date);
    return res.json(reports);
  }
  res.json([]);
});

// GET /api/reports/:id - 특정 보고서 조회
router.get("/reports/:id", requireAuth, async (req, res) => {
  const report = await storage.getReport(req.params.id);
  if (!report) return res.sendStatus(404);
  res.json(report);
});

// POST /api/reports - 보고서 생성
router.post("/reports", requireAuth, validateBody(insertReportSchema), async (req, res) => {
  const report = await storage.createReport(req.body);
  res.status(201).json(report);
});

// PATCH /api/reports/:id - 보고서 수정
router.patch("/reports/:id", requireAuth, validateBody(updateReportSchema), async (req, res) => {
  const report = await storage.updateReport(req.params.id, req.body);
  if (!report) return res.sendStatus(404);
  res.json(report);
});

// GET /api/report-dashboard - 보고서 대시보드 (관리자 전용)
router.get("/report-dashboard", requireAdmin, async (req, res) => {
  const { date, mokjangId } = req.query;

  if (!date || typeof date !== "string") {
    return res.status(400).json({ message: "date 파라미터가 필요합니다." });
  }

  try {
    const allMokjangs = await storage.getMokjangs();
    const filteredMokjangs = mokjangId && typeof mokjangId === "string"
      ? allMokjangs.filter(m => m.id === mokjangId)
      : allMokjangs;

    const mokjangTeacherAssignments = await storage.getAllMokjangTeachers();
    const allTeachers = await storage.getTeachers();
    const reportsOnDate = await storage.getReportsByDate(date);
    const allStudents = await storage.getStudents();
    const activeStudents = allStudents.filter(s => s.status === 'ACTIVE');
    const attendanceLogs = await storage.getAttendanceByDate(date);
    const observations = await storage.getObservationsByDate(date);

    const mokjangData = filteredMokjangs.map(mokjang => {
      const teacherIds = mokjangTeacherAssignments
        .filter(mt => mt.mokjangId === mokjang.id)
        .map(mt => mt.teacherId);
      const teachers = allTeachers.filter(t => teacherIds.includes(t.id));

      const mokjangStudents = activeStudents.filter(s => s.mokjangId === mokjang.id);
      const studentIds = mokjangStudents.map(s => s.id);

      const mokjangAttendance = attendanceLogs.filter(log => studentIds.includes(log.studentId));
      const attendedCount = mokjangAttendance.filter(l => l.status === 'ATTENDED' || l.status === 'LATE').length;

      const report = reportsOnDate.find(r => r.mokjangId === mokjang.id);

      const mokjangObservations = observations.filter(o => studentIds.includes(o.studentId));
      const firstObservation = mokjangObservations.length > 0 ? mokjangObservations[0].content : null;

      return {
        mokjang: {
          id: mokjang.id,
          name: mokjang.name,
          targetGrade: mokjang.targetGrade,
        },
        teachers: teachers.map(t => ({ id: t.id, name: t.name })),
        attendance: {
          total: mokjangStudents.length,
          attended: attendedCount,
        },
        report: report || null,
        observationSummary: firstObservation,
        hasReport: !!report,
      };
    });

    res.json({ mokjangs: mokjangData, date });
  } catch (error) {
    console.error("보고서 대시보드 조회 오류:", error);
    res.status(500).json({ message: "조회 중 오류가 발생했습니다." });
  }
});

// GET /api/report-dashboard/:mokjangId/details - 목장 상세 (출석 + 특이사항)
router.get("/report-dashboard/:mokjangId/details", requireAdmin, async (req, res) => {
  const { mokjangId } = req.params;
  const { date } = req.query;

  if (!date || typeof date !== "string") {
    return res.status(400).json({ message: "date 파라미터가 필요합니다." });
  }

  try {
    const mokjang = await storage.getMokjang(mokjangId);
    if (!mokjang) return res.sendStatus(404);

    const report = await storage.getReportByMokjangAndDate(mokjangId, date);
    const allStudents = await storage.getStudentsByMokjangId(mokjangId);
    const activeStudents = allStudents.filter(s => s.status === 'ACTIVE');
    const attendanceLogs = await storage.getAttendanceByDateAndMokjang(date, mokjangId);
    const observations = await storage.getObservationsByDate(date);

    const studentDetails = activeStudents.map(student => {
      const attendance = attendanceLogs.find(l => l.studentId === student.id);
      const studentObservations = observations.filter(o => o.studentId === student.id);

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        status: attendance?.status || null,
        memo: attendance?.memo || null,
        observations: studentObservations.map(o => o.content),
      };
    });

    res.json({
      mokjang: { id: mokjang.id, name: mokjang.name, targetGrade: mokjang.targetGrade },
      report: report || null,
      students: studentDetails,
      date,
    });
  } catch (error) {
    console.error("목장 상세 조회 오류:", error);
    res.status(500).json({ message: "조회 중 오류가 발생했습니다." });
  }
});

export default router;
