import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, date, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "teacher"]);
export const studentStatusEnum = pgEnum("student_status", ["ACTIVE", "REST", "GRADUATED"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["ATTENDED", "LATE", "ABSENT", "EXCUSED"]);
export const historyTypeEnum = pgEnum("history_type", ["mokjang_change", "status_change", "grade_change"]);
export const contactMethodEnum = pgEnum("contact_method", ["phone", "visit", "message"]);
export const genderEnum = pgEnum("gender", ["M", "F"]);
export const baptismEnum = pgEnum("baptism", ["infant", "baptized", "confirmed", "none"]);
export const teacherStatusEnum = pgEnum("teacher_status", ["active", "rest", "resigned"]);
export const ministryRoleEnum = pgEnum("ministry_role", ["admin", "member", "leader"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("teacher"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one }) => ({
  teacher: one(teachers, {
    fields: [users.id],
    references: [teachers.userId],
  }),
}));

export const teachers = pgTable("teachers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  birth: date("birth"),
  startedAt: date("started_at"),
  status: teacherStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  mokjangTeachers: many(mokjangTeachers),
  reports: many(reports),
}));

export const mokjangs = pgTable("mokjangs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  targetGrade: text("target_grade"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ministries = pgTable("ministries", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mokjangsRelations = relations(mokjangs, ({ many }) => ({
  mokjangTeachers: many(mokjangTeachers),
  students: many(students),
  reports: many(reports),
}));

export const ministriesRelations = relations(ministries, ({ many }) => ({
  ministryTeachers: many(ministryTeachers),
  ministryStudents: many(ministryStudents),
}));

export const mokjangTeachers = pgTable("mokjang_teachers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  mokjangId: varchar("mokjang_id", { length: 36 }).notNull().references(() => mokjangs.id, { onDelete: "cascade" }),
  teacherId: varchar("teacher_id", { length: 36 }).notNull().references(() => teachers.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const ministryTeachers = pgTable("ministry_teachers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  ministryId: varchar("ministry_id", { length: 36 }).notNull().references(() => ministries.id, { onDelete: "cascade" }),
  teacherId: varchar("teacher_id", { length: 36 }).notNull().references(() => teachers.id, { onDelete: "cascade" }),
  role: ministryRoleEnum("role").default("member"),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const ministryStudents = pgTable("ministry_students", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  ministryId: varchar("ministry_id", { length: 36 }).notNull().references(() => ministries.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 36 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  role: ministryRoleEnum("role").default("member"),
  assignedAt: timestamp("assigned_at").defaultNow(),
});



export const ministryTeachersRelations = relations(ministryTeachers, ({ one }) => ({
  ministry: one(ministries, {
    fields: [ministryTeachers.ministryId],
    references: [ministries.id],
  }),
  teacher: one(teachers, {
    fields: [ministryTeachers.teacherId],
    references: [teachers.id],
  }),
}));

export const ministryStudentsRelations = relations(ministryStudents, ({ one }) => ({
  ministry: one(ministries, {
    fields: [ministryStudents.ministryId],
    references: [ministries.id],
  }),
  student: one(students, {
    fields: [ministryStudents.studentId],
    references: [students.id],
  }),
}));

export const mokjangTeachersRelations = relations(mokjangTeachers, ({ one }) => ({
  mokjang: one(mokjangs, {
    fields: [mokjangTeachers.mokjangId],
    references: [mokjangs.id],
  }),
  teacher: one(teachers, {
    fields: [mokjangTeachers.teacherId],
    references: [teachers.id],
  }),
}));

export const students = pgTable("students", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  mokjangId: varchar("mokjang_id", { length: 36 }).references(() => mokjangs.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  birth: date("birth"),
  phone: text("phone"),
  parentPhone: text("parent_phone"),
  school: text("school"),
  grade: text("grade"),
  gender: genderEnum("gender"),
  baptism: baptismEnum("baptism").default("none"),
  status: studentStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const studentsRelations = relations(students, ({ one, many }) => ({
  mokjang: one(mokjangs, {
    fields: [students.mokjangId],
    references: [mokjangs.id],
  }),
  attendanceLogs: many(attendanceLogs),
  history: many(studentHistory),
  longAbsenceContacts: many(longAbsenceContacts),
}));

export const attendanceLogs = pgTable("attendance_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id", { length: 36 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  memo: text("memo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  student: one(students, {
    fields: [attendanceLogs.studentId],
    references: [students.id],
  }),
}));

export const reports = pgTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  mokjangId: varchar("mokjang_id", { length: 36 }).notNull().references(() => mokjangs.id, { onDelete: "cascade" }),
  teacherId: varchar("teacher_id", { length: 36 }).notNull().references(() => teachers.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  content: text("content"),
  prayerRequest: text("prayer_request"),
  suggestions: text("suggestions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  mokjang: one(mokjangs, {
    fields: [reports.mokjangId],
    references: [mokjangs.id],
  }),
  teacher: one(teachers, {
    fields: [reports.teacherId],
    references: [teachers.id],
  }),
}));

export const studentHistory = pgTable("student_history", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id", { length: 36 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  type: historyTypeEnum("type").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentHistoryRelations = relations(studentHistory, ({ one }) => ({
  student: one(students, {
    fields: [studentHistory.studentId],
    references: [students.id],
  }),
}));

export const longAbsenceContacts = pgTable("long_absence_contacts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id", { length: 36 }).notNull().references(() => students.id, { onDelete: "cascade" }),
  contactDate: date("contact_date").notNull(),
  contactMethod: contactMethodEnum("contact_method"),
  content: text("content"),
  contactedBy: varchar("contacted_by", { length: 36 }).references(() => teachers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const longAbsenceContactsRelations = relations(longAbsenceContacts, ({ one }) => ({
  student: one(students, {
    fields: [longAbsenceContacts.studentId],
    references: [students.id],
  }),
  teacher: one(teachers, {
    fields: [longAbsenceContacts.contactedBy],
    references: [teachers.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMokjangSchema = createInsertSchema(mokjangs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMinistrySchema = createInsertSchema(ministries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMokjangTeacherSchema = createInsertSchema(mokjangTeachers).omit({
  id: true,
  assignedAt: true,
});

export const insertMinistryTeacherSchema = createInsertSchema(ministryTeachers).omit({
  id: true,
  assignedAt: true,
});

export const insertMinistryStudentSchema = createInsertSchema(ministryStudents).omit({
  id: true,
  assignedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceLogSchema = createInsertSchema(attendanceLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentHistorySchema = createInsertSchema(studentHistory).omit({
  id: true,
  createdAt: true,
});

export const insertLongAbsenceContactSchema = createInsertSchema(longAbsenceContacts).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertMokjang = z.infer<typeof insertMokjangSchema>;
export type Mokjang = typeof mokjangs.$inferSelect;
export type InsertMinistry = z.infer<typeof insertMinistrySchema>;
export type Ministry = typeof ministries.$inferSelect;
export type InsertMokjangTeacher = z.infer<typeof insertMokjangTeacherSchema>;
export type MokjangTeacher = typeof mokjangTeachers.$inferSelect;
export type InsertMinistryTeacher = z.infer<typeof insertMinistryTeacherSchema>;
export type MinistryTeacher = typeof ministryTeachers.$inferSelect;
export type InsertMinistryStudent = z.infer<typeof insertMinistryStudentSchema>;
export type MinistryStudent = typeof ministryStudents.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertAttendanceLog = z.infer<typeof insertAttendanceLogSchema>;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertStudentHistory = z.infer<typeof insertStudentHistorySchema>;
export type StudentHistory = typeof studentHistory.$inferSelect;
export type InsertLongAbsenceContact = z.infer<typeof insertLongAbsenceContactSchema>;
export type LongAbsenceContact = typeof longAbsenceContacts.$inferSelect;
