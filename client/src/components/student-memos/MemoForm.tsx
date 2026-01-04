import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MemoItemData } from "./MemoItem";

interface MemoFormProps {
  studentId: string;
  existingMemo?: MemoItemData;
  onSuccess: () => void;
  onCancel: () => void;
  showToastMessage?: (message: string) => void;
}

export function MemoForm({ studentId, existingMemo, onSuccess, onCancel, showToastMessage }: MemoFormProps) {
  const [content, setContent] = useState(existingMemo?.content || "");
  const { toast } = useToast();
  const isEditing = !!existingMemo;

  // 커스텀 토스트가 있으면 사용, 없으면 shadcn/ui 토스트 사용
  const notify = (message: string) => {
    if (showToastMessage) {
      showToastMessage(message);
    } else {
      toast({ title: message });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/students/${studentId}/memos`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/memos`] });
      notify("메모가 추가되었어요");
      onSuccess();
    },
    onError: () => {
      notify("메모 추가 실패");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("PATCH", `/api/memos/${existingMemo!.id}`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/memos`] });
      notify("메모가 수정되었어요");
      onSuccess();
    },
    onError: () => {
      notify("메모 수정 실패");
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    if (isEditing) {
      updateMutation.mutate(content);
    } else {
      createMutation.mutate(content);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="메모를 입력하세요..."
        rows={3}
        className="resize-none"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          취소
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isPending}>
          {isPending ? "저장 중..." : isEditing ? "수정" : "추가"}
        </Button>
      </div>
    </div>
  );
}
