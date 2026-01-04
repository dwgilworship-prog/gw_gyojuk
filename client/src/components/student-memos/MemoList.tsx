import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MessageSquare } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MemoItem, type MemoItemData } from "./MemoItem";
import { MemoForm } from "./MemoForm";

interface MemoListProps {
  studentId: string;
  studentName: string;
  showToastMessage?: (message: string) => void;
}

export function MemoList({ studentId, showToastMessage }: MemoListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const notify = (message: string) => {
    if (showToastMessage) {
      showToastMessage(message);
    } else {
      toast({ title: message });
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [editingMemo, setEditingMemo] = useState<MemoItemData | null>(null);
  const [deletingMemoId, setDeletingMemoId] = useState<string | null>(null);

  const { data: memos, isLoading } = useQuery<MemoItemData[]>({
    queryKey: [`/api/students/${studentId}/memos`],
  });

  const deleteMutation = useMutation({
    mutationFn: async (memoId: string) => {
      await apiRequest("DELETE", `/api/memos/${memoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/memos`] });
      notify("메모가 삭제되었어요");
      setDeletingMemoId(null);
    },
    onError: () => {
      notify("메모 삭제 실패");
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (memoId: string) => {
      const res = await apiRequest("PATCH", `/api/memos/${memoId}/pin`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/memos`] });
    },
    onError: () => {
      notify("고정 상태 변경 실패");
    },
  });

  const canModifyMemo = (memo: MemoItemData) => {
    if (user?.role === "admin") return true;
    return user?.role === "teacher" && user.teacher?.id === memo.teacherId;
  };

  if (isLoading) {
    return (
      <div className="memo-list">
        <div className="memo-header">
          <h3 className="memo-title">
            <MessageSquare size={16} />
            특이사항 메모
          </h3>
        </div>
        <div className="memo-card" style={{ height: 60 }} />
        <div className="memo-card" style={{ height: 60 }} />
      </div>
    );
  }

  return (
    <div className="memo-list">
      <div className="memo-header">
        <h3 className="memo-title">
          <MessageSquare size={16} />
          특이사항 메모 {memos && memos.length > 0 && `(${memos.length})`}
        </h3>
        {!isAdding && !editingMemo && (
          <button className="memo-add-btn" onClick={() => setIsAdding(true)}>
            <Plus size={14} />
            메모 추가
          </button>
        )}
      </div>

      {isAdding && (
        <MemoForm
          studentId={studentId}
          onSuccess={() => setIsAdding(false)}
          onCancel={() => setIsAdding(false)}
          showToastMessage={showToastMessage}
        />
      )}

      {editingMemo && (
        <MemoForm
          studentId={studentId}
          existingMemo={editingMemo}
          onSuccess={() => setEditingMemo(null)}
          onCancel={() => setEditingMemo(null)}
          showToastMessage={showToastMessage}
        />
      )}

      {!isAdding && !editingMemo && (
        <div className="memo-items">
          {memos && memos.length > 0 ? (
            memos.map((memo) => (
              <MemoItem
                key={memo.id}
                memo={memo}
                canModify={canModifyMemo(memo)}
                onEdit={() => setEditingMemo(memo)}
                onDelete={() => setDeletingMemoId(memo.id)}
                onTogglePin={() => togglePinMutation.mutate(memo.id)}
              />
            ))
          ) : (
            <p className="memo-empty">등록된 메모가 없습니다.</p>
          )}
        </div>
      )}

      <AlertDialog open={!!deletingMemoId} onOpenChange={() => setDeletingMemoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메모 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 메모를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMemoId && deleteMutation.mutate(deletingMemoId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
