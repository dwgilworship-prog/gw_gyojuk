import {
  users, teachers, mokjangs, mokjangTeachers, students, attendanceLogs, reports, longAbsenceContacts,
  type User, type InsertUser,
  type Teacher, type InsertTeacher,
  type Mokjang, type InsertMokjang,
  type MokjangTeacher, type InsertMokjangTeacher,
  type Student, type InsertStudent,
  type AttendanceLog, type InsertAttendanceLog,
  type Report, type InsertReport,
  type LongAbsenceContact, type InsertLongAbsenceContact,
  ministries, ministryTeachers, ministryStudents,
  type Ministry, type InsertMinistry,
  type MinistryTeacher, type InsertMinistryTeacher,
  type MinistryStudent, type InsertMinistryStudent
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByUserId(userId: string): Promise<Teacher | undefined>;
  getTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;

  getMokjang(id: string): Promise<Mokjang | undefined>;
  getMokjangs(): Promise<Mokjang[]>;
  getMokjangsByTeacherId(teacherId: string): Promise<Mokjang[]>;
  createMokjang(mokjang: InsertMokjang): Promise<Mokjang>;
  updateMokjang(id: string, mokjang: Partial<InsertMokjang>): Promise<Mokjang | undefined>;
  deleteMokjang(id: string): Promise<boolean>;

  assignTeacherToMokjang(mokjangId: string, teacherId: string): Promise<MokjangTeacher>;
  removeTeacherFromMokjang(mokjangId: string, teacherId: string): Promise<boolean>;
  getMokjangTeachers(mokjangId: string): Promise<MokjangTeacher[]>;
  getAllMokjangTeachers(): Promise<MokjangTeacher[]>;

  getStudent(id: string): Promise<Student | undefined>;
  getStudents(): Promise<Student[]>;
  getStudentsByMokjangId(mokjangId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  getAttendanceLog(id: string): Promise<AttendanceLog | undefined>;
  getAttendanceByDateAndMokjang(date: string, mokjangId: string): Promise<AttendanceLog[]>;
  getAttendanceByDate(date: string): Promise<AttendanceLog[]>;
  getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceLog[]>;
  saveAttendance(logs: InsertAttendanceLog[]): Promise<AttendanceLog[]>;

  getReport(id: string): Promise<Report | undefined>;
  getReportsByMokjangId(mokjangId: string): Promise<Report[]>;
  getReportsByDate(date: string): Promise<Report[]>;
  getReportByMokjangAndDate(mokjangId: string, date: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined>;

  getStudentCount(): Promise<number>;
  getMokjangCount(): Promise<number>;
  getTeacherCount(): Promise<number>;
  getWeeklyAttendanceStats(): Promise<{ total: number; attended: number; rate: number }>;

  getLongAbsenceContactsByStudentId(studentId: string): Promise<LongAbsenceContact[]>;
  createLongAbsenceContact(contact: InsertLongAbsenceContact): Promise<LongAbsenceContact>;
  getStudentLastAttendance(studentId: string): Promise<{ date: string } | undefined>;

  // Ministry related
  getMinistry(id: string): Promise<Ministry | undefined>;
  getMinistries(): Promise<Ministry[]>;
  createMinistry(ministry: InsertMinistry): Promise<Ministry>;
  updateMinistry(id: string, ministry: Partial<InsertMinistry>): Promise<Ministry | undefined>;
  deleteMinistry(id: string): Promise<boolean>;

  assignTeacherToMinistry(ministryId: string, teacherId: string, role?: "admin" | "member" | "leader"): Promise<MinistryTeacher>;
  removeTeacherFromMinistry(ministryId: string, teacherId: string): Promise<boolean>;
  getMinistryTeachers(ministryId: string): Promise<MinistryTeacher[]>;
  getMinistriesByTeacherId(teacherId: string): Promise<Ministry[]>;

  assignStudentToMinistry(ministryId: string, studentId: string, role?: "admin" | "member" | "leader"): Promise<MinistryStudent>;
  removeStudentFromMinistry(ministryId: string, studentId: string): Promise<boolean>;
  getMinistryStudents(ministryId: string): Promise<MinistryStudent[]>;
  getStudentsByMinistryId(ministryId: string): Promise<Student[]>;
  getMinistriesByStudentId(studentId: string): Promise<Ministry[]>;
  getTeachersByMinistryId(ministryId: string): Promise<Teacher[]>;
  getAllMinistryTeachers(): Promise<MinistryTeacher[]>;
  getAllMinistryStudents(): Promise<MinistryStudent[]>;
}


export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: false });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async getTeacherByUserId(userId: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, userId));
    return teacher || undefined;
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).orderBy(teachers.name);
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(insertTeacher).returning();
    return teacher;
  }

  async updateTeacher(id: string, teacherData: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [teacher] = await db.update(teachers)
      .set({ ...teacherData, updatedAt: new Date() })
      .where(eq(teachers.id, id))
      .returning();
    return teacher || undefined;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const teacher = await this.getTeacher(id);
    if (!teacher || !teacher.userId) return false;

    // Delete the user, which will cascade delete the teacher due to foreign key constraint
    console.log(`[DEBUG] Deleting user ${teacher.userId} for teacher ${id}`);
    const result = await db.delete(users).where(eq(users.id, teacher.userId));
    return (result.rowCount ?? 0) > 0;
  }

  async getMokjang(id: string): Promise<Mokjang | undefined> {
    const [mokjang] = await db.select().from(mokjangs).where(eq(mokjangs.id, id));
    return mokjang || undefined;
  }

  async getMokjangs(): Promise<Mokjang[]> {
    return await db.select().from(mokjangs).orderBy(mokjangs.name);
  }

  async getMokjangsByTeacherId(teacherId: string): Promise<Mokjang[]> {
    const result = await db
      .select({ mokjang: mokjangs })
      .from(mokjangTeachers)
      .innerJoin(mokjangs, eq(mokjangTeachers.mokjangId, mokjangs.id))
      .where(eq(mokjangTeachers.teacherId, teacherId));
    return result.map(r => r.mokjang);
  }

  async createMokjang(insertMokjang: InsertMokjang): Promise<Mokjang> {
    const [mokjang] = await db.insert(mokjangs).values(insertMokjang).returning();
    return mokjang;
  }

  async updateMokjang(id: string, mokjangData: Partial<InsertMokjang>): Promise<Mokjang | undefined> {
    const [mokjang] = await db.update(mokjangs)
      .set({ ...mokjangData, updatedAt: new Date() })
      .where(eq(mokjangs.id, id))
      .returning();
    return mokjang || undefined;
  }

  async deleteMokjang(id: string): Promise<boolean> {
    const result = await db.delete(mokjangs).where(eq(mokjangs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async assignTeacherToMokjang(mokjangId: string, teacherId: string): Promise<MokjangTeacher> {
    const existing = await db.select().from(mokjangTeachers)
      .where(and(eq(mokjangTeachers.mokjangId, mokjangId), eq(mokjangTeachers.teacherId, teacherId)));

    if (existing.length > 0) {
      return existing[0];
    }

    const [assignment] = await db.insert(mokjangTeachers)
      .values({ mokjangId, teacherId })
      .returning();
    return assignment;
  }

  async removeTeacherFromMokjang(mokjangId: string, teacherId: string): Promise<boolean> {
    const result = await db.delete(mokjangTeachers)
      .where(and(eq(mokjangTeachers.mokjangId, mokjangId), eq(mokjangTeachers.teacherId, teacherId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getMokjangTeachers(mokjangId: string): Promise<MokjangTeacher[]> {
    return await db.select().from(mokjangTeachers).where(eq(mokjangTeachers.mokjangId, mokjangId));
  }

  async getAllMokjangTeachers(): Promise<MokjangTeacher[]> {
    return await db.select().from(mokjangTeachers);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(students.name);
  }

  async getStudentsByMokjangId(mokjangId: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.mokjangId, mokjangId)).orderBy(students.name);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: string, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db.update(students)
      .set({ ...studentData, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return student || undefined;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAttendanceLog(id: string): Promise<AttendanceLog | undefined> {
    const [log] = await db.select().from(attendanceLogs).where(eq(attendanceLogs.id, id));
    return log || undefined;
  }

  async getAttendanceByDateAndMokjang(date: string, mokjangId: string): Promise<AttendanceLog[]> {
    const studentIds = await db.select({ id: students.id }).from(students).where(eq(students.mokjangId, mokjangId));
    if (studentIds.length === 0) return [];

    const ids = studentIds.map(s => s.id);
    return await db.select().from(attendanceLogs)
      .where(and(
        eq(attendanceLogs.date, date),
        sql`${attendanceLogs.studentId} IN ${ids}`
      ));
  }

  async getAttendanceByDate(date: string): Promise<AttendanceLog[]> {
    return await db.select().from(attendanceLogs)
      .where(eq(attendanceLogs.date, date));
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceLog[]> {
    return await db.select().from(attendanceLogs)
      .where(and(
        gte(attendanceLogs.date, startDate),
        lte(attendanceLogs.date, endDate)
      ));
  }

  async saveAttendance(logs: InsertAttendanceLog[]): Promise<AttendanceLog[]> {
    if (logs.length === 0) return [];

    const results: AttendanceLog[] = [];
    for (const log of logs) {
      const existing = await db.select().from(attendanceLogs)
        .where(and(
          eq(attendanceLogs.studentId, log.studentId),
          eq(attendanceLogs.date, log.date)
        ));

      if (existing.length > 0) {
        const [updated] = await db.update(attendanceLogs)
          .set({ status: log.status, memo: log.memo, updatedAt: new Date() })
          .where(eq(attendanceLogs.id, existing[0].id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db.insert(attendanceLogs).values(log).returning();
        results.push(created);
      }
    }
    return results;
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportsByMokjangId(mokjangId: string): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.mokjangId, mokjangId))
      .orderBy(desc(reports.date));
  }

  async getReportsByDate(date: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.date, date));
  }

  async getReportByMokjangAndDate(mokjangId: string, date: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports)
      .where(and(eq(reports.mokjangId, mokjangId), eq(reports.date, date)));
    return report || undefined;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async updateReport(id: string, reportData: Partial<InsertReport>): Promise<Report | undefined> {
    const [report] = await db.update(reports)
      .set({ ...reportData, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return report || undefined;
  }

  async getStudentCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(students);
    return result?.count ?? 0;
  }

  async getMokjangCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(mokjangs);
    return result?.count ?? 0;
  }

  async getTeacherCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(teachers);
    return result?.count ?? 0;
  }

  async getWeeklyAttendanceStats(): Promise<{ total: number; attended: number; rate: number }> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startDate = startOfWeek.toISOString().split("T")[0];
    const endDate = endOfWeek.toISOString().split("T")[0];

    const logs = await db.select().from(attendanceLogs)
      .where(and(
        gte(attendanceLogs.date, startDate),
        lte(attendanceLogs.date, endDate)
      ));

    const total = logs.length;
    const attended = logs.filter(l => l.status === "ATTENDED" || l.status === "LATE").length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { total, attended, rate };
  }

  async getLongAbsenceContactsByStudentId(studentId: string): Promise<LongAbsenceContact[]> {
    return await db.select().from(longAbsenceContacts)
      .where(eq(longAbsenceContacts.studentId, studentId))
      .orderBy(desc(longAbsenceContacts.contactDate));
  }

  async createLongAbsenceContact(contact: InsertLongAbsenceContact): Promise<LongAbsenceContact> {
    const [result] = await db.insert(longAbsenceContacts).values(contact).returning();
    return result;
  }

  async getStudentLastAttendance(studentId: string): Promise<{ date: string } | undefined> {
    const [log] = await db.select({ date: attendanceLogs.date })
      .from(attendanceLogs)
      .where(and(
        eq(attendanceLogs.studentId, studentId),
        sql`${attendanceLogs.status} IN ('ATTENDED', 'LATE')`
      ))
      .orderBy(desc(attendanceLogs.date))
      .limit(1);
    return log || undefined;
  }

  // Ministry implementation
  async getMinistry(id: string): Promise<Ministry | undefined> {
    const [ministry] = await db.select().from(ministries).where(eq(ministries.id, id));
    return ministry || undefined;
  }

  async getMinistries(): Promise<Ministry[]> {
    return await db.select().from(ministries).orderBy(ministries.name);
  }

  async createMinistry(insertMinistry: InsertMinistry): Promise<Ministry> {
    const [ministry] = await db.insert(ministries).values(insertMinistry).returning();
    return ministry;
  }

  async updateMinistry(id: string, ministryData: Partial<InsertMinistry>): Promise<Ministry | undefined> {
    const [ministry] = await db.update(ministries)
      .set({ ...ministryData, updatedAt: new Date() })
      .where(eq(ministries.id, id))
      .returning();
    return ministry || undefined;
  }

  async deleteMinistry(id: string): Promise<boolean> {
    const result = await db.delete(ministries).where(eq(ministries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async assignTeacherToMinistry(ministryId: string, teacherId: string, role: "admin" | "member" | "leader" = "member"): Promise<MinistryTeacher> {
    const existing = await db.select().from(ministryTeachers)
      .where(and(eq(ministryTeachers.ministryId, ministryId), eq(ministryTeachers.teacherId, teacherId)));

    if (existing.length > 0) {
      return existing[0];
    }

    const [assignment] = await db.insert(ministryTeachers)
      .values({ ministryId, teacherId, role })
      .returning();
    return assignment;
  }

  async removeTeacherFromMinistry(ministryId: string, teacherId: string): Promise<boolean> {
    const result = await db.delete(ministryTeachers)
      .where(and(eq(ministryTeachers.ministryId, ministryId), eq(ministryTeachers.teacherId, teacherId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getMinistryTeachers(ministryId: string): Promise<MinistryTeacher[]> {
    return await db.select().from(ministryTeachers).where(eq(ministryTeachers.ministryId, ministryId));
  }

  async getTeachersByMinistryId(ministryId: string): Promise<Teacher[]> {
    const result = await db
      .select({ teacher: teachers })
      .from(ministryTeachers)
      .innerJoin(teachers, eq(ministryTeachers.teacherId, teachers.id))
      .where(eq(ministryTeachers.ministryId, ministryId))
      .orderBy(teachers.name);
    return result.map(r => r.teacher);
  }

  async getAllMinistryTeachers(): Promise<MinistryTeacher[]> {
    return await db.select().from(ministryTeachers);
  }

  async getMinistriesByTeacherId(teacherId: string): Promise<Ministry[]> {
    const result = await db
      .select({ ministry: ministries })
      .from(ministryTeachers)
      .innerJoin(ministries, eq(ministryTeachers.ministryId, ministries.id))
      .where(eq(ministryTeachers.teacherId, teacherId));
    return result.map(r => r.ministry);
  }

  async assignStudentToMinistry(ministryId: string, studentId: string, role: "admin" | "member" | "leader" = "member"): Promise<MinistryStudent> {
    const existing = await db.select().from(ministryStudents)
      .where(and(eq(ministryStudents.ministryId, ministryId), eq(ministryStudents.studentId, studentId)));

    if (existing.length > 0) {
      return existing[0];
    }

    const [assignment] = await db.insert(ministryStudents)
      .values({ ministryId, studentId, role })
      .returning();
    return assignment;
  }

  async removeStudentFromMinistry(ministryId: string, studentId: string): Promise<boolean> {
    const result = await db.delete(ministryStudents)
      .where(and(eq(ministryStudents.ministryId, ministryId), eq(ministryStudents.studentId, studentId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getMinistryStudents(ministryId: string): Promise<MinistryStudent[]> {
    return await db.select().from(ministryStudents).where(eq(ministryStudents.ministryId, ministryId));
  }

  async getStudentsByMinistryId(ministryId: string): Promise<Student[]> {
    const result = await db
      .select({ student: students })
      .from(ministryStudents)
      .innerJoin(students, eq(ministryStudents.studentId, students.id))
      .where(eq(ministryStudents.ministryId, ministryId))
      .orderBy(students.name);
    return result.map(r => r.student);
  }

  async getAllMinistryStudents(): Promise<MinistryStudent[]> {
    return await db.select().from(ministryStudents);
  }

  async getMinistriesByStudentId(studentId: string): Promise<Ministry[]> {
    const result = await db
      .select({ ministry: ministries })
      .from(ministryStudents)
      .innerJoin(ministries, eq(ministryStudents.ministryId, ministries.id))
      .where(eq(ministryStudents.studentId, studentId));
    return result.map(r => r.ministry);
  }
}

export const storage = new DatabaseStorage();
