import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Pin, Pencil, Trash2, MoreVertical } from "lucide-react";
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
    <div className={`memo-card ${memo.isPinned ? "pinned" : ""}`}>
      <div className="memo-card-inner">
        <div className="memo-card-content">
          <div className="memo-card-meta">
            {memo.isPinned && <Pin size={12} color="#f59e0b" />}
            <span className="memo-card-author">{memo.teacherName || "관리자"}</span>
            {createdAt && (
              <>
                <span>·</span>
                <span>{format(createdAt, "yyyy.MM.dd HH:mm", { locale: ko })}</span>
              </>
            )}
          </div>
          <p className="memo-card-text">{memo.content}</p>
        </div>

        {canModify && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="memo-menu-btn">
                <MoreVertical size={16} />
              </button>
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
