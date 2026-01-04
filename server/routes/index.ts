import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "../auth";

// Route modules
import teacherRoutes from "./teacher.routes";
import studentRoutes from "./student.routes";
import mokjangRoutes from "./mokjang.routes";
import attendanceRoutes from "./attendance.routes";
import ministryRoutes from "./ministry.routes";
import smsRoutes from "./sms.routes";
import reportRoutes from "./report.routes";
import dashboardRoutes from "./dashboard.routes";
import adminRoutes from "./admin.routes";
import healthRoutes from "./health.routes";
import memoRoutes from "./memo.routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (includes /api/login, /api/logout, /api/register, /api/user, /api/change-password)
  setupAuth(app);

  // Register all route modules under /api prefix
  app.use("/api", teacherRoutes);
  app.use("/api", studentRoutes);
  app.use("/api", mokjangRoutes);
  app.use("/api", attendanceRoutes);
  app.use("/api", ministryRoutes);
  app.use("/api", smsRoutes);
  app.use("/api", reportRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", healthRoutes);
  app.use("/api", memoRoutes);

  return httpServer;
}
