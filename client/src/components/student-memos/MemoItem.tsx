import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Pin, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface MemoItemData {
  id: string;
  studentId: string;
  teacherId: string | null;
  teacherName: string | null;
  content: string;
  isPinned: boolean;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
}

interface MemoItemProps {
  memo: MemoItemData;
  canModify: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function MemoItem({ memo, canModify, onEdit, onDelete, onTogglePin }: MemoItemProps) {
  const createdAt = memo.createdAt ? new Date(memo.createdAt) : null;

  return (
    <div className={`p-3 rounded-lg border ${memo.isPinned ? "bg-amber-50 border-amber-200" : "bg-muted/30"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            {memo.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
            <span className="font-medium">{memo.teacherName || "관리자"}</span>
            {createdAt && (
              <>
                <span>·</span>
                <span>{format(createdAt, "yyyy.MM.dd HH:mm", { locale: ko })}</span>
              </>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">{memo.content}</p>
        </div>

        {canModify && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onTogglePin}>
                <Pin className="h-4 w-4 mr-2" />
                {memo.isPinned ? "고정 해제" : "고정"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
