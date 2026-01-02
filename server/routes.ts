import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { sendSms, sendSmsMass, getSmsHistory, getSmsDetail, getSmsRemain, cancelSms } from "./sms";
import { logDataChange, compareChanges } from "./utils/logger";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const allUsers = await storage.getUsers();
    const sanitizedUsers = allUsers.map(({ password, ...rest }) => rest);
    res.json(sanitizedUsers);
  });

  app.get("/api/mokjang-teachers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mokjangTeachers = await storage.getAllMokjangTeachers();
    res.json(mokjangTeachers);
  });

  app.get("/api/teachers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ministryId } = req.query;
    if (ministryId && typeof ministryId === "string") {
      const teachers = await storage.getTeachersByMinistryId(ministryId);
      return res.json(teachers);
    }
    const teachers = await storage.getTeachers();
    res.json(teachers);
  });

  app.get("/api/teachers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teacher = await storage.getTeacher(req.params.id);
    if (!teacher) return res.sendStatus(404);
    res.json(teacher);
  });

  app.post("/api/teachers", async (req, res) => {
    // Force reload comment
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    const { email, name, phone, birth, startedAt } = req.body;
    console.log("[DEBUG] /api/teachers POST body:", { email, name, birth });

    if (!email) {
      return res.status(400).json({ message: "이메일은 필수입니다." });
    }

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

    // 교사 생성 로그
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

  app.patch("/api/teachers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    // 변경 전 데이터 조회
    const oldTeacher = await storage.getTeacher(req.params.id);
    if (!oldTeacher) return res.sendStatus(404);

    const teacher = await storage.updateTeacher(req.params.id, req.body);
    if (!teacher) return res.sendStatus(404);

    // 교사 수정 로그
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

  app.delete("/api/teachers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    // 삭제 전 데이터 조회
    const teacher = await storage.getTeacher(req.params.id);
    if (!teacher) return res.sendStatus(404);

    const deleted = await storage.deleteTeacher(req.params.id);
    if (!deleted) return res.sendStatus(404);

    // 교사 삭제 로그
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

  app.get("/api/teachers/:id/mokjangs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mokjangs = await storage.getMokjangsByTeacherId(req.params.id);
    res.json(mokjangs);
  });

  app.get("/api/mokjangs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mokjangs = await storage.getMokjangs();
    res.json(mokjangs);
  });

  app.get("/api/mokjangs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mokjang = await storage.getMokjang(req.params.id);
    if (!mokjang) return res.sendStatus(404);
    res.json(mokjang);
  });

  app.post("/api/mokjangs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const mokjang = await storage.createMokjang(req.body);
    res.status(201).json(mokjang);
  });

  app.patch("/api/mokjangs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const mokjang = await storage.updateMokjang(req.params.id, req.body);
    if (!mokjang) return res.sendStatus(404);
    res.json(mokjang);
  });

  app.delete("/api/mokjangs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const deleted = await storage.deleteMokjang(req.params.id);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(200);
  });

  app.get("/api/mokjangs/:mokjangId/teachers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mokjangTeachers = await storage.getMokjangTeachers(req.params.mokjangId);
    res.json(mokjangTeachers);
  });

  app.post("/api/mokjangs/:mokjangId/teachers/:teacherId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const assignment = await storage.assignTeacherToMokjang(req.params.mokjangId, req.params.teacherId);
    res.status(201).json(assignment);
  });

  app.delete("/api/mokjangs/:mokjangId/teachers/:teacherId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const removed = await storage.removeTeacherFromMokjang(req.params.mokjangId, req.params.teacherId);
    if (!removed) return res.sendStatus(404);
    res.sendStatus(200);
  });

  app.get("/api/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
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

  app.get("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const student = await storage.getStudent(req.params.id);
    if (!student) return res.sendStatus(404);
    res.json(student);
  });

  app.post("/api/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const student = await storage.createStudent(req.body);

    // 학생 생성 로그
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

  app.patch("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // 변경 전 데이터 조회
    const oldStudent = await storage.getStudent(req.params.id);
    if (!oldStudent) return res.sendStatus(404);

    const student = await storage.updateStudent(req.params.id, req.body);
    if (!student) return res.sendStatus(404);

    // 학생 수정 로그
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

  app.delete("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    // 삭제 전 데이터 조회
    const student = await storage.getStudent(req.params.id);
    if (!student) return res.sendStatus(404);

    const deleted = await storage.deleteStudent(req.params.id);
    if (!deleted) return res.sendStatus(404);

    // 학생 삭제 로그
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

  app.get("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
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

  app.post("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const logs = await storage.saveAttendance(req.body);
    res.status(201).json(logs);
  });

  app.delete("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { studentId, date } = req.body;
    if (!studentId || !date) {
      return res.status(400).json({ message: "studentId와 date가 필요합니다." });
    }
    const deleted = await storage.deleteAttendance(studentId, date);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(200);
  });

  // 출석 현황 대시보드 API
  app.get("/api/attendance-dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return res.status(400).json({ message: "date 파라미터가 필요합니다." });
    }

    try {
      // 1. 해당 날짜 출석 로그
      const attendanceLogs = await storage.getAttendanceByDate(date);

      // 2. 해당 날짜 특이사항
      const observations = await storage.getObservationsByDate(date);

      // 3. 전체 활성 학생 목록
      const allStudents = await storage.getStudents();
      const activeStudents = allStudents.filter(s => s.status === 'ACTIVE');

      // 4. 목장 정보
      const mokjangs = await storage.getMokjangs();

      // 5. 통계 계산
      const stats = {
        total: activeStudents.length,
        attended: attendanceLogs.filter(l => l.status === 'ATTENDED').length,
        late: attendanceLogs.filter(l => l.status === 'LATE').length,
        absent: attendanceLogs.filter(l => l.status === 'ABSENT').length,
        excused: attendanceLogs.filter(l => l.status === 'EXCUSED').length,
        notChecked: activeStudents.length - attendanceLogs.length,
      };

      // 6. 학생별 상세 현황 (출석 + 특이사항 조인)
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

  app.get("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
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

  app.get("/api/reports/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const report = await storage.getReport(req.params.id);
    if (!report) return res.sendStatus(404);
    res.json(report);
  });

  app.post("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const report = await storage.createReport(req.body);
    res.status(201).json(report);
  });

  app.patch("/api/reports/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const report = await storage.updateReport(req.params.id, req.body);
    if (!report) return res.sendStatus(404);
    res.json(report);
  });

  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [studentCount, mokjangCount, teacherCount, weeklyAttendance] = await Promise.all([
      storage.getStudentCount(),
      storage.getMokjangCount(),
      storage.getTeacherCount(),
      storage.getWeeklyAttendanceStats(),
    ]);
    res.json({ studentCount, mokjangCount, teacherCount, weeklyAttendance });
  });

  app.get("/api/dashboard-widgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const allStudents = await storage.getStudents();
    const activeStudents = allStudents.filter(s => s.status === "ACTIVE");
    const mokjangs = await storage.getMokjangs();

    const now = new Date();
    const longAbsenceResults = await Promise.all(activeStudents.map(async (student) => {
      const lastAttendance = await storage.getStudentLastAttendance(student.id);
      if (!lastAttendance) {
        return { student, weeksAbsent: 999, lastAttendanceDate: null };
      }
      const lastDate = new Date(lastAttendance.date);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksAbsent = Math.floor(diffDays / 7);
      return { student, weeksAbsent, lastAttendanceDate: lastAttendance.date };
    }));
    const longAbsenceStudents = longAbsenceResults
      .filter(r => r.weeksAbsent >= 4 && r.weeksAbsent !== 999) // 출석 기록 없는 학생 제외
      .sort((a, b) => b.weeksAbsent - a.weeksAbsent)
      .slice(0, 5);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const teachers = await storage.getTeachers();
    const activeTeachers = teachers.filter(t => t.status === "active");

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
      // Compare by month and day only (ignoring year)
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

  app.get("/api/long-absence-students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    const allStudents = await storage.getStudents();
    const activeStudents = allStudents.filter(s => s.status === "ACTIVE");

    const now = new Date();
    const results = await Promise.all(activeStudents.map(async (student) => {
      const lastAttendance = await storage.getStudentLastAttendance(student.id);
      if (!lastAttendance) {
        return { student, weeksAbsent: 999, lastAttendanceDate: null };
      }
      const lastDate = new Date(lastAttendance.date);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksAbsent = Math.floor(diffDays / 7);
      return { student, weeksAbsent, lastAttendanceDate: lastAttendance.date };
    }));

    const longAbsenceStudents = results.filter(r => r.weeksAbsent >= 2 && r.weeksAbsent !== 999); // 출석 기록 없는 학생 제외
    longAbsenceStudents.sort((a, b) => b.weeksAbsent - a.weeksAbsent);

    res.json(longAbsenceStudents);
  });

  app.get("/api/long-absence-contacts/:studentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const contacts = await storage.getLongAbsenceContactsByStudentId(req.params.studentId);
    res.json(contacts);
  });

  app.post("/api/long-absence-contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const contact = await storage.createLongAbsenceContact(req.body);
    res.status(201).json(contact);
  });

  // Ministry Routes
  app.get("/api/ministries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const ministries = await storage.getMinistries();
    res.json(ministries);
  });

  app.post("/api/ministries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const ministry = await storage.createMinistry(req.body);
    res.status(201).json(ministry);
  });

  app.patch("/api/ministries/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const ministry = await storage.updateMinistry(req.params.id, req.body);
    if (!ministry) return res.sendStatus(404);
    res.json(ministry);
  });

  app.delete("/api/ministries/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const deleted = await storage.deleteMinistry(req.params.id);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(200);
  });

  app.get("/api/ministries/:id/teachers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teachers = await storage.getMinistryTeachers(req.params.id);
    res.json(teachers);
  });

  app.post("/api/ministries/:id/teachers/:teacherId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const assignment = await storage.assignTeacherToMinistry(req.params.id, req.params.teacherId, req.body.role);
    res.status(201).json(assignment);
  });

  app.delete("/api/ministries/:id/teachers/:teacherId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const removed = await storage.removeTeacherFromMinistry(req.params.id, req.params.teacherId);
    if (!removed) return res.sendStatus(404);
    res.sendStatus(200);
  });

  app.get("/api/ministries/:id/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const students = await storage.getMinistryStudents(req.params.id);
    res.json(students);
  });

  app.post("/api/ministries/:id/students/:studentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const assignment = await storage.assignStudentToMinistry(req.params.id, req.params.studentId, req.body.role);
    res.status(201).json(assignment);
  });

  app.delete("/api/ministries/:id/students/:studentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const removed = await storage.removeStudentFromMinistry(req.params.id, req.params.studentId);
    if (!removed) return res.sendStatus(404);
    res.sendStatus(200);
  });

  app.get("/api/ministry-members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [teachers, students] = await Promise.all([
      storage.getAllMinistryTeachers(),
      storage.getAllMinistryStudents(),
    ]);
    res.json({ teachers, students });
  });

  // SMS API Routes
  // 문자 발송 (동일 내용을 여러명에게)
  app.post("/api/sms/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    try {
      const { sender, receiver, msg, msg_type, title, destination, rdate, rtime, testmode_yn } = req.body;

      if (!receiver || !msg) {
        return res.status(400).json({ message: "수신자와 메시지 내용은 필수입니다." });
      }

      const result = await sendSms({
        sender,
        receiver,
        msg,
        msg_type,
        title,
        destination,
        rdate,
        rtime,
        testmode_yn,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS send error:", error);
      res.status(500).json({ message: error.message || "문자 발송 중 오류가 발생했습니다." });
    }
  });

  // 대량 문자 발송 (각각 다른 내용)
  app.post("/api/sms/send-mass", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    try {
      const { sender, messages, msg_type, title, rdate, rtime, testmode_yn } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "발송할 메시지 목록이 필요합니다." });
      }

      if (messages.length > 500) {
        return res.status(400).json({ message: "한 번에 최대 500건까지 발송 가능합니다." });
      }

      const result = await sendSmsMass({
        sender,
        messages,
        msg_type: msg_type || 'SMS',
        title,
        rdate,
        rtime,
        testmode_yn,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS sendMass error:", error);
      res.status(500).json({ message: error.message || "대량 문자 발송 중 오류가 발생했습니다." });
    }
  });

  // 전송내역 조회
  app.get("/api/sms/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    try {
      const { page, page_size, start_date, limit_day } = req.query;

      const result = await getSmsHistory({
        page: page ? parseInt(page as string) : undefined,
        page_size: page_size ? parseInt(page_size as string) : undefined,
        start_date: start_date as string,
        limit_day: limit_day ? parseInt(limit_day as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS history error:", error);
      res.status(500).json({ message: error.message || "전송내역 조회 중 오류가 발생했습니다." });
    }
  });

  // 전송결과 상세 조회
  app.get("/api/sms/detail/:mid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    try {
      const { mid } = req.params;
      const { page, page_size } = req.query;

      const result = await getSmsDetail({
        mid,
        page: page ? parseInt(page as string) : undefined,
        page_size: page_size ? parseInt(page_size as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS detail error:", error);
      res.status(500).json({ message: error.message || "전송결과 상세 조회 중 오류가 발생했습니다." });
    }
  });

  // 발송가능 건수 조회
  app.get("/api/sms/remain", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    try {
      const result = await getSmsRemain();
      res.json(result);
    } catch (error: any) {
      console.error("SMS remain error:", error);
      res.status(500).json({ message: error.message || "발송가능 건수 조회 중 오류가 발생했습니다." });
    }
  });

  // 예약 취소
  app.post("/api/sms/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    try {
      const { mid } = req.body;

      if (!mid) {
        return res.status(400).json({ message: "메시지 ID가 필요합니다." });
      }

      const result = await cancelSms(mid);
      res.json(result);
    } catch (error: any) {
      console.error("SMS cancel error:", error);
      res.status(500).json({ message: error.message || "예약 취소 중 오류가 발생했습니다." });
    }
  });

  // 목장 보고서 관리자 대시보드 API
  app.get("/api/report-dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    const { date, mokjangId } = req.query;

    if (!date || typeof date !== "string") {
      return res.status(400).json({ message: "date 파라미터가 필요합니다." });
    }

    try {
      // 1. 목장 목록
      const allMokjangs = await storage.getMokjangs();
      const filteredMokjangs = mokjangId && typeof mokjangId === "string"
        ? allMokjangs.filter(m => m.id === mokjangId)
        : allMokjangs;

      // 2. 목장-교사 매핑
      const mokjangTeacherAssignments = await storage.getAllMokjangTeachers();
      const allTeachers = await storage.getTeachers();

      // 3. 해당 날짜 보고서
      const reportsOnDate = await storage.getReportsByDate(date);

      // 4. 전체 학생
      const allStudents = await storage.getStudents();
      const activeStudents = allStudents.filter(s => s.status === 'ACTIVE');

      // 5. 해당 날짜 출석 로그
      const attendanceLogs = await storage.getAttendanceByDate(date);

      // 6. 해당 날짜 특이사항
      const observations = await storage.getObservationsByDate(date);

      // 목장별 데이터 조합
      const mokjangData = filteredMokjangs.map(mokjang => {
        // 담당 교사
        const teacherIds = mokjangTeacherAssignments
          .filter(mt => mt.mokjangId === mokjang.id)
          .map(mt => mt.teacherId);
        const teachers = allTeachers.filter(t => teacherIds.includes(t.id));

        // 목장 소속 학생
        const mokjangStudents = activeStudents.filter(s => s.mokjangId === mokjang.id);
        const studentIds = mokjangStudents.map(s => s.id);

        // 출석 현황
        const mokjangAttendance = attendanceLogs.filter(log => studentIds.includes(log.studentId));
        const attendedCount = mokjangAttendance.filter(l => l.status === 'ATTENDED' || l.status === 'LATE').length;

        // 보고서
        const report = reportsOnDate.find(r => r.mokjangId === mokjang.id);

        // 특이사항 (첫 번째 것만 요약용)
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

  // 목장 상세 (출석 + 특이사항)
  app.get("/api/report-dashboard/:mokjangId/details", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

    const { mokjangId } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return res.status(400).json({ message: "date 파라미터가 필요합니다." });
    }

    try {
      // 목장 정보
      const mokjang = await storage.getMokjang(mokjangId);
      if (!mokjang) return res.sendStatus(404);

      // 보고서
      const report = await storage.getReportByMokjangAndDate(mokjangId, date);

      // 목장 소속 학생
      const allStudents = await storage.getStudentsByMokjangId(mokjangId);
      const activeStudents = allStudents.filter(s => s.status === 'ACTIVE');

      // 해당 날짜 출석 로그
      const attendanceLogs = await storage.getAttendanceByDateAndMokjang(date, mokjangId);

      // 해당 날짜 특이사항
      const observations = await storage.getObservationsByDate(date);

      // 학생별 출석 및 특이사항
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

  // Student Observations Routes
  // POST /api/observations - 새로운 특이사항 기록 생성
  app.post("/api/observations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { studentId, content, observationDate, attendanceLogId } = req.body;

    if (!studentId || !content || !observationDate) {
      return res.status(400).json({ message: "studentId, content, observationDate는 필수입니다." });
    }

    // 현재 로그인한 사용자의 teacher ID 가져오기
    const teacher = await storage.getTeacherByUserId(req.user!.id);

    const observation = await storage.createObservation({
      studentId,
      teacherId: teacher?.id || null,
      attendanceLogId: attendanceLogId || null,
      observationDate,
      content,
    });

    res.status(201).json(observation);
  });

  // GET /api/students/:studentId/observations - 특정 학생의 모든 기록 조회 (최신순)
  app.get("/api/students/:studentId/observations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const observations = await storage.getObservationsByStudentId(req.params.studentId);
    res.json(observations);
  });

  // GET /api/observations - 날짜별 특이사항 조회
  app.get("/api/observations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
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
  app.get("/api/observations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const observation = await storage.getObservation(req.params.id);
    if (!observation) return res.sendStatus(404);
    res.json(observation);
  });

  // PATCH /api/observations/:id - 기록 수정
  app.patch("/api/observations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const observation = await storage.updateObservation(req.params.id, req.body);
    if (!observation) return res.sendStatus(404);
    res.json(observation);
  });

  // DELETE /api/observations/:id - 기록 삭제
  app.delete("/api/observations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const deleted = await storage.deleteObservation(req.params.id);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(200);
  });

  // ========================================
  // 히든 관리자 메뉴: 로그 조회 API
  // ========================================

  // GET /api/admin/logs/login - 로그인 로그 조회
  app.get("/api/admin/logs/login", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

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
  app.get("/api/admin/logs/data-change", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);

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

  return httpServer;
}
