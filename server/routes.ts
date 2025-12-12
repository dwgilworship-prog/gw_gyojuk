import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";

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
    });

    const teacher = await storage.createTeacher({
      userId: newUser.id,
      name,
      phone: phone || null,
      birth: birth || null,
      startedAt: startedAt || null,
    });

    res.status(201).json(teacher);
  });

  app.patch("/api/teachers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const teacher = await storage.updateTeacher(req.params.id, req.body);
    if (!teacher) return res.sendStatus(404);
    res.json(teacher);
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const deleted = await storage.deleteTeacher(req.params.id);
    if (!deleted) return res.sendStatus(404);
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
    res.status(201).json(student);
  });

  app.patch("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const student = await storage.updateStudent(req.params.id, req.body);
    if (!student) return res.sendStatus(404);
    res.json(student);
  });

  app.delete("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    if (user.role !== "admin") return res.sendStatus(403);
    const deleted = await storage.deleteStudent(req.params.id);
    if (!deleted) return res.sendStatus(404);
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

  return httpServer;
}
