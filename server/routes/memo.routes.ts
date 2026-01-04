import { Router } from "express";
import { db } from "../db";
import { studentMemos, teachers } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// GET /api/students/:studentId/memos - 학생의 메모 목록 조회
router.get("/students/:studentId/memos", requireAuth, async (req, res) => {
  try {
    const { studentId } = req.params;

    const memos = await db
      .select({
        id: studentMemos.id,
        studentId: studentMemos.studentId,
        teacherId: studentMemos.teacherId,
        teacherName: teachers.name,
        content: studentMemos.content,
        isPinned: studentMemos.isPinned,
        createdAt: studentMemos.createdAt,
        updatedAt: studentMemos.updatedAt,
      })
      .from(studentMemos)
      .leftJoin(teachers, eq(studentMemos.teacherId, teachers.id))
      .where(eq(studentMemos.studentId, studentId))
      .orderBy(desc(studentMemos.isPinned), desc(studentMemos.createdAt));

    res.json(memos);
  } catch (error) {
    console.error("Error fetching memos:", error);
    res.status(500).json({ error: "Failed to fetch memos" });
  }
});

// POST /api/students/:studentId/memos - 메모 추가
router.post("/students/:studentId/memos", requireAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { content } = req.body;
    const user = req.user!;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    // 현재 사용자의 teacher ID 조회
    const teacher = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.userId, user.id))
      .limit(1);

    const teacherId = teacher[0]?.id || null;

    const [memo] = await db
      .insert(studentMemos)
      .values({
        studentId,
        teacherId,
        content: content.trim(),
      })
      .returning();

    // 작성자 이름 포함해서 반환
    const teacherName = teacher[0] ? (await db.select({ name: teachers.name }).from(teachers).where(eq(teachers.id, teacher[0].id)))[0]?.name : null;

    res.status(201).json({
      ...memo,
      teacherName,
    });
  } catch (error) {
    console.error("Error creating memo:", error);
    res.status(500).json({ error: "Failed to create memo" });
  }
});

// PATCH /api/memos/:id - 메모 수정
router.patch("/memos/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user!;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    // 메모 조회
    const [existingMemo] = await db
      .select()
      .from(studentMemos)
      .where(eq(studentMemos.id, id));

    if (!existingMemo) {
      return res.status(404).json({ error: "Memo not found" });
    }

    // 권한 체크: admin이거나 작성자 본인
    if (user.role !== "admin") {
      const teacher = await db
        .select({ id: teachers.id })
        .from(teachers)
        .where(eq(teachers.userId, user.id))
        .limit(1);

      if (existingMemo.teacherId !== teacher[0]?.id) {
        return res.status(403).json({ error: "Permission denied" });
      }
    }

    const [updated] = await db
      .update(studentMemos)
      .set({ content: content.trim(), updatedAt: new Date() })
      .where(eq(studentMemos.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating memo:", error);
    res.status(500).json({ error: "Failed to update memo" });
  }
});

// DELETE /api/memos/:id - 메모 삭제
router.delete("/memos/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // 메모 조회
    const [existingMemo] = await db
      .select()
      .from(studentMemos)
      .where(eq(studentMemos.id, id));

    if (!existingMemo) {
      return res.status(404).json({ error: "Memo not found" });
    }

    // 권한 체크: admin이거나 작성자 본인
    if (user.role !== "admin") {
      const teacher = await db
        .select({ id: teachers.id })
        .from(teachers)
        .where(eq(teachers.userId, user.id))
        .limit(1);

      if (existingMemo.teacherId !== teacher[0]?.id) {
        return res.status(403).json({ error: "Permission denied" });
      }
    }

    await db.delete(studentMemos).where(eq(studentMemos.id, id));
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting memo:", error);
    res.status(500).json({ error: "Failed to delete memo" });
  }
});

// PATCH /api/memos/:id/pin - 메모 고정/해제 토글
router.patch("/memos/:id/pin", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [existingMemo] = await db
      .select()
      .from(studentMemos)
      .where(eq(studentMemos.id, id));

    if (!existingMemo) {
      return res.status(404).json({ error: "Memo not found" });
    }

    const [updated] = await db
      .update(studentMemos)
      .set({
        isPinned: !existingMemo.isPinned,
        updatedAt: new Date(),
      })
      .where(eq(studentMemos.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error toggling pin:", error);
    res.status(500).json({ error: "Failed to toggle pin" });
  }
});

export default router;
