import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// GET /api/stats - 기본 통계
router.get("/stats", requireAuth, async (req, res) => {
  const [studentCount, mokjangCount, teacherCount, weeklyAttendance] = await Promise.all([
    storage.getStudentCount(),
    storage.getMokjangCount(),
    storage.getTeacherCount(),
    storage.getWeeklyAttendanceStats(),
  ]);
  res.json({ studentCount, mokjangCount, teacherCount, weeklyAttendance });
});

// GET /api/dashboard-widgets - 대시보드 위젯 데이터
router.get("/dashboard-widgets", requireAuth, async (req, res) => {
  const [allStudents, mokjangs, teachers] = await Promise.all([
    storage.getStudents(),
    storage.getMokjangs(),
    storage.getTeachers(),
  ]);

  const activeStudents = allStudents.filter(s => s.status === "ACTIVE");
  const activeTeachers = teachers.filter(t => t.status === "active");
  const now = new Date();

  // 배치 쿼리로 모든 학생의 마지막 출석일 한 번에 조회 (N+1 최적화)
  const studentIds = activeStudents.map(s => s.id);
  const lastAttendanceMap = await storage.getStudentsLastAttendanceBatch(studentIds);

  // 장기 결석 학생 계산
  const longAbsenceResults = activeStudents.map(student => {
    const lastDateStr = lastAttendanceMap.get(student.id);
    if (!lastDateStr) {
      return { student, weeksAbsent: 999, lastAttendanceDate: null };
    }
    const lastDate = new Date(lastDateStr);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksAbsent = Math.floor(diffDays / 7);
    return { student, weeksAbsent, lastAttendanceDate: lastDateStr };
  });

  const longAbsenceStudents = longAbsenceResults
    .filter(r => r.weeksAbsent >= 4 && r.weeksAbsent !== 999)
    .sort((a, b) => b.weeksAbsent - a.weeksAbsent)
    .slice(0, 5);

  // 이번 주 생일 계산
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const studentBirthdays = activeStudents.filter(student => {
    if (!student.birth) return false;
    const birthDate = new Date(student.birth);
    const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    return thisYearBirthday >= startOfWeek && thisYearBirthday <= endOfWeek;
  }).map(student => ({
    id: student.id,
    name: student.name,
    birth: student.birth,
    type: "student" as const,
    info: mokjangs.find(m => m.id === student.mokjangId)?.name || "미배정",
  }));

  const teacherBirthdays = activeTeachers.filter(teacher => {
    if (!teacher.birth) return false;
    const birthDate = new Date(teacher.birth);
    const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    return thisYearBirthday >= startOfWeek && thisYearBirthday <= endOfWeek;
  }).map(teacher => ({
    id: teacher.id,
    name: teacher.name,
    birth: teacher.birth,
    type: "teacher" as const,
    info: "교사",
  }));

  const birthdays = [...studentBirthdays, ...teacherBirthdays].sort((a, b) => {
    const dateA = new Date(a.birth!);
    const dateB = new Date(b.birth!);
    const monthDiff = dateA.getMonth() - dateB.getMonth();
    if (monthDiff !== 0) return monthDiff;
    return dateA.getDate() - dateB.getDate();
  });

  const unassignedStudents = activeStudents.filter(s => !s.mokjangId);

  res.json({
    longAbsenceStudents,
    birthdays,
    unassignedCount: unassignedStudents.length,
  });
});

export default router;
