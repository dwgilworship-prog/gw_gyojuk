import { Request, Response, NextFunction } from "express";

/**
 * 인증된 사용자만 접근 가능
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  next();
};

/**
 * 관리자만 접근 가능 (requireAuth 이후에 사용)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  if (req.user!.role !== "admin") {
    return res.sendStatus(403);
  }
  next();
};
