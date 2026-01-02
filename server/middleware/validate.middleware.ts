import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Request body를 Zod 스키마로 검증하는 미들웨어
 * 검증 성공 시 req.body에 파싱된 데이터가 저장됨
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return res.status(400).json({
        message: "입력 데이터가 유효하지 않습니다.",
        errors,
      });
    }

    req.body = result.data;
    next();
  };
};

/**
 * Query parameters를 Zod 스키마로 검증하는 미들웨어
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return res.status(400).json({
        message: "쿼리 파라미터가 유효하지 않습니다.",
        errors,
      });
    }

    req.query = result.data as any;
    next();
  };
};

/**
 * Zod 에러를 읽기 쉬운 형태로 변환
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}
