import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;      // 시간 윈도우 (밀리초)
  maxRequests: number;   // 최대 요청 수
  message?: string;      // 제한 초과 시 메시지
  keyGenerator?: (req: Request) => string;  // 식별 키 생성 함수
}

// 메모리 기반 저장소
const stores = new Map<string, Map<string, RateLimitRecord>>();

// IP 추출 함수
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

// 주기적으로 만료된 레코드 정리 (메모리 누수 방지)
function cleanupExpiredRecords(storeName: string) {
  const store = stores.get(storeName);
  if (!store) return;

  const now = Date.now();
  store.forEach((record, key) => {
    if (record.resetTime < now) {
      store.delete(key);
    }
  });
}

// 정리 작업 주기 설정 (5분마다)
setInterval(() => {
  stores.forEach((_, storeName) => {
    cleanupExpiredRecords(storeName);
  });
}, 5 * 60 * 1000);

/**
 * Rate Limiting 미들웨어 생성
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    keyGenerator = getClientIp,
  } = options;

  // 고유 저장소 생성
  const storeName = `rateLimit_${Date.now()}_${Math.random()}`;
  stores.set(storeName, new Map());

  return (req: Request, res: Response, next: NextFunction) => {
    const store = stores.get(storeName)!;
    const key = keyGenerator(req);
    const now = Date.now();

    const record = store.get(key);

    if (!record || record.resetTime < now) {
      // 새 윈도우 시작
      store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      // 남은 요청 수 헤더 추가
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));

      return next();
    }

    if (record.count >= maxRequests) {
      // 제한 초과
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
      res.setHeader("Retry-After", retryAfter);

      return res.status(429).json({
        message,
        retryAfter,
      });
    }

    // 카운트 증가
    record.count++;

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - record.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    next();
  };
}

/**
 * 로그인 시도 제한 (IP 기반)
 * - 5분에 10회 시도 가능
 */
export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5분
  maxRequests: 10,
  message: "로그인 시도가 너무 많습니다. 5분 후 다시 시도해주세요.",
});

/**
 * 회원가입 제한 (IP 기반)
 * - 1시간에 5회 시도 가능
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1시간
  maxRequests: 5,
  message: "회원가입 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.",
});

/**
 * SMS 발송 제한 (사용자 기반)
 * - 1분에 10건 발송 가능
 */
export const smsRateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1분
  maxRequests: 10,
  message: "문자 발송이 너무 많습니다. 1분 후 다시 시도해주세요.",
  keyGenerator: (req) => req.user?.id || getClientIp(req),
});

/**
 * 대량 SMS 발송 제한 (사용자 기반)
 * - 10분에 5회 발송 가능
 */
export const smsMassRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10분
  maxRequests: 5,
  message: "대량 문자 발송이 너무 많습니다. 10분 후 다시 시도해주세요.",
  keyGenerator: (req) => req.user?.id || getClientIp(req),
});

/**
 * 비밀번호 변경 제한 (사용자 기반)
 * - 1시간에 5회 시도 가능
 */
export const passwordChangeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1시간
  maxRequests: 5,
  message: "비밀번호 변경 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.",
  keyGenerator: (req) => req.user?.id || getClientIp(req),
});
