import { db } from "../db";
import { loginLogs, dataChangeLogs } from "@shared/schema";

// 민감 정보 필터링할 키 목록
const SENSITIVE_KEYS = ["password", "token", "secret", "credential"];

// 로그에서 제외할 키 목록 (관계 테이블로 별도 관리되는 필드들)
const EXCLUDED_KEYS = ["ministryIds", "mokjangIds"];

// 객체에서 민감 정보 제거
function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive))) {
      continue; // 민감 정보는 저장하지 않음
    }
    sanitized[key] = value;
  }
  return sanitized;
}

// 로그인 로그 기록
export async function logLogin(params: {
  userId: string;
  action: "login" | "logout" | "login_failed";
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.insert(loginLogs).values({
      userId: params.userId,
      action: params.action,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    });
  } catch (error) {
    console.error("[Logger] 로그인 로그 기록 실패:", error);
    // 로그 실패가 메인 로직을 방해하지 않도록 에러 무시
  }
}

// 데이터 변경 로그 기록
export async function logDataChange(params: {
  userId: string;
  action: "create" | "update" | "delete";
  targetType: "student" | "teacher";
  targetId: string;
  targetName: string;
  changes?: Record<string, { old: any; new: any }> | { created: object } | { deleted: object };
}): Promise<void> {
  try {
    await db.insert(dataChangeLogs).values({
      userId: params.userId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      targetName: params.targetName,
      changes: params.changes || null,
    });
  } catch (error) {
    console.error("[Logger] 데이터 변경 로그 기록 실패:", error);
    // 로그 실패가 메인 로직을 방해하지 않도록 에러 무시
  }
}

// 변경사항 비교 헬퍼 함수
export function compareChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  // 민감 정보 제거
  const sanitizedOld = sanitizeData(oldData);
  const sanitizedNew = sanitizeData(newData);

  // oldData에 존재하는 키만 비교 (실제 테이블 컬럼만 비교)
  // 관계 테이블로 관리되는 필드(ministryIds 등)는 제외
  for (const key of Object.keys(sanitizedNew)) {
    // 제외할 키는 무시
    if (EXCLUDED_KEYS.includes(key)) {
      continue;
    }

    // oldData에 없는 키는 무시 (테이블에 존재하지 않는 필드)
    if (!(key in sanitizedOld)) {
      continue;
    }

    const oldValue = sanitizedOld[key];
    const newValue = sanitizedNew[key];

    // 값이 다른 경우에만 기록
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { old: oldValue, new: newValue };
    }
  }

  return changes;
}

// IP 주소 추출 헬퍼
export function getClientIp(req: any): string | undefined {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    // x-forwarded-for는 콤마로 구분된 IP 목록일 수 있음
    const ips = (typeof forwardedFor === "string" ? forwardedFor : forwardedFor[0]).split(",");
    return ips[0].trim();
  }
  return req.ip || req.connection?.remoteAddress;
}
