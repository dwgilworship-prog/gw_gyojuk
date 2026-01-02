import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { logLogin, getClientIp } from "./utils/logger";
import { loginRateLimiter, registerRateLimiter, passwordChangeRateLimiter } from "./middleware/rate-limit.middleware";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", registerRateLimiter, async (req, res, next) => {
    try {
      const { email, password, name, phone } = req.body;

      if (!name || name.trim() === "") {
        return res.status(400).send("이름을 입력해주세요");
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).send("이메일이 이미 존재합니다");
      }

      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
      });

      // teachers 테이블에 pending 상태로 추가
      const teacher = await storage.createTeacher({
        userId: user.id,
        name: name.trim(),
        phone: phone || null,
        status: "pending",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        res.status(201).json({
          ...safeUser,
          teacher: teacher,
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", loginRateLimiter, (req, res, next) => {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    passport.authenticate("local", async (err: any, user: SelectUser | false) => {
      if (err) return next(err);
      if (!user) {
        // 로그인 실패 로그 - 이메일로 사용자 조회하여 userId 가져오기
        const failedUser = await storage.getUserByEmail(req.body.email);
        if (failedUser) {
          await logLogin({
            userId: failedUser.id,
            action: "login_failed",
            ipAddress,
            userAgent,
          });
        }
        return res.status(401).send("이메일 또는 비밀번호가 올바르지 않습니다");
      }
      req.login(user, async (err) => {
        if (err) return next(err);

        // 로그인 성공 로그
        await logLogin({
          userId: user.id,
          action: "login",
          ipAddress,
          userAgent,
        });

        const { password, ...safeUser } = user;

        // teacher 정보도 함께 반환
        const teacher = await storage.getTeacherByUserId(safeUser.id);

        res.status(200).json({
          ...safeUser,
          teacher: teacher || null,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    const userId = req.user?.id;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    // 로그아웃 로그 (사용자가 로그인 상태인 경우에만)
    if (userId) {
      await logLogin({
        userId,
        action: "logout",
        ipAddress,
        userAgent,
      });
    }

    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...safeUser } = req.user!;

    // teacher 정보도 함께 반환
    const teacher = await storage.getTeacherByUserId(safeUser.id);

    res.json({
      ...safeUser,
      teacher: teacher || null,
    });
  });

  app.post("/api/change-password", passwordChangeRateLimiter, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const { currentPassword, newPassword } = req.body;
      const user = req.user!;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).send("비밀번호는 최소 6자 이상이어야 합니다");
      }

      // 현재 비밀번호 확인 (초기 비밀번호 변경이 아닌 경우)
      if (!user.mustChangePassword && currentPassword) {
        const isValid = await comparePasswords(currentPassword, user.password);
        if (!isValid) {
          return res.status(400).send("현재 비밀번호가 올바르지 않습니다");
        }
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(user.id, {
        password: hashedPassword,
        mustChangePassword: false,
      });

      if (!updatedUser) {
        return res.status(500).send("비밀번호 변경 실패");
      }

      // 세션 업데이트
      req.login(updatedUser, async (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = updatedUser;

        // teacher 정보도 함께 반환
        const teacher = await storage.getTeacherByUserId(safeUser.id);

        res.status(200).json({
          ...safeUser,
          teacher: teacher || null,
        });
      });
    } catch (error) {
      next(error);
    }
  });
}
