import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { smsRateLimiter, smsMassRateLimiter } from "../middleware/rate-limit.middleware";
import { sendSms, sendSmsMass, getSmsHistory, getSmsDetail, getSmsRemain, cancelSms } from "../sms";

const router = Router();

// SMS 발송 스키마
const sendSmsSchema = z.object({
  sender: z.string().optional(),
  receiver: z.string().min(1, "수신자는 필수입니다."),
  msg: z.string().min(1, "메시지 내용은 필수입니다."),
  msg_type: z.enum(["SMS", "LMS", "MMS"]).optional(),
  title: z.string().optional(),
  destination: z.string().optional(),
  rdate: z.string().optional(),
  rtime: z.string().optional(),
  testmode_yn: z.enum(["Y", "N"]).optional(),
});

// 대량 SMS 발송 스키마
const sendSmsMassSchema = z.object({
  sender: z.string().optional(),
  messages: z.array(z.object({
    receiver: z.string(),
    msg: z.string(),
  })).min(1, "발송할 메시지 목록이 필요합니다.").max(500, "한 번에 최대 500건까지 발송 가능합니다."),
  msg_type: z.enum(["SMS", "LMS", "MMS"]).optional().default("SMS"),
  title: z.string().optional(),
  rdate: z.string().optional(),
  rtime: z.string().optional(),
  testmode_yn: z.enum(["Y", "N"]).optional(),
});

// SMS 취소 스키마
const cancelSmsSchema = z.object({
  mid: z.string().min(1, "메시지 ID가 필요합니다."),
});

// POST /api/sms/send - 문자 발송 (동일 내용을 여러명에게)
router.post("/sms/send", requireAdmin, smsRateLimiter, validateBody(sendSmsSchema), async (req, res) => {
  try {
    const result = await sendSms(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("SMS send error:", error);
    res.status(500).json({ message: error.message || "문자 발송 중 오류가 발생했습니다." });
  }
});

// POST /api/sms/send-mass - 대량 문자 발송 (각각 다른 내용)
router.post("/sms/send-mass", requireAdmin, smsMassRateLimiter, validateBody(sendSmsMassSchema), async (req, res) => {
  try {
    const result = await sendSmsMass(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("SMS sendMass error:", error);
    res.status(500).json({ message: error.message || "대량 문자 발송 중 오류가 발생했습니다." });
  }
});

// GET /api/sms/history - 전송내역 조회
router.get("/sms/history", requireAdmin, async (req, res) => {
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

// GET /api/sms/detail/:mid - 전송결과 상세 조회
router.get("/sms/detail/:mid", requireAdmin, async (req, res) => {
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

// GET /api/sms/remain - 발송가능 건수 조회
router.get("/sms/remain", requireAdmin, async (req, res) => {
  try {
    const result = await getSmsRemain();
    res.json(result);
  } catch (error: any) {
    console.error("SMS remain error:", error);
    res.status(500).json({ message: error.message || "발송가능 건수 조회 중 오류가 발생했습니다." });
  }
});

// POST /api/sms/cancel - 예약 취소
router.post("/sms/cancel", requireAdmin, validateBody(cancelSmsSchema), async (req, res) => {
  try {
    const result = await cancelSms(req.body.mid);
    res.json(result);
  } catch (error: any) {
    console.error("SMS cancel error:", error);
    res.status(500).json({ message: error.message || "예약 취소 중 오류가 발생했습니다." });
  }
});

export default router;
