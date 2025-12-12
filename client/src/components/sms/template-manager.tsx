import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Pencil, Save, X } from "lucide-react";
import { SmsTemplate, getTemplates, saveTemplate, deleteTemplate } from "@/lib/sms-utils";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

interface TemplateManagerProps {
    onSelect?: (content: string) => void;
    trigger?: React.ReactNode;
    onUpdate?: () => void;
}

export function TemplateManager({ onSelect, trigger, onUpdate }: TemplateManagerProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [templates, setTemplates] = useState<SmsTemplate[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const refresh = () => {
        setTemplates(getTemplates());
    };

    useEffect(() => {
        if (open) refresh();
    }, [open]);

    const handleSave = () => {
        if (!title || !content) return;

        const newTemplate: SmsTemplate = {
            id: editingId || uuidv4(),
            title,
            content,
            createdAt: new Date().toISOString(),
        };

        saveTemplate(newTemplate);
        refresh();
        onUpdate?.(); // Notify parent
        handleCancel();
        toast({ title: "템플릿 저장됨" });
    };

    const handleDelete = (id: string) => {
        if (confirm("삭제하시겠습니까?")) {
            deleteTemplate(id);
            refresh();
            onUpdate?.(); // Notify parent
        }
    };

    const handleEdit = (t: SmsTemplate) => {
        setEditingId(t.id);
        setTitle(t.title);
        setContent(t.content);
    };

    const handleCancel = () => {
        setEditingId(null);
        setTitle("");
        setContent("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm">템플릿 관리</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>자주 쓰는 문구 관리</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2">
                    {/* Editor */}
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                        <Input
                            placeholder="제목 (예: 행사 안내)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <Textarea
                            placeholder="내용을 입력하세요..."
                            className="max-h-[100px]"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            {editingId && (
                                <Button variant="ghost" size="sm" onClick={handleCancel}>
                                    <X className="w-4 h-4 mr-2" />
                                    취소
                                </Button>
                            )}
                            <Button size="sm" onClick={handleSave} disabled={!title || !content}>
                                <Save className="w-4 h-4 mr-2" />
                                {editingId ? "수정완료" : "추가"}
                            </Button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        {templates.map(t => (
                            <div key={t.id} className="border rounded-lg p-3 relative group hover:border-primary transition-colors">
                                <div className="font-medium pr-16 truncate">{t.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">{t.content}</div>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(t)}>
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>

                                {onSelect && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="mt-2 w-full text-xs"
                                        onClick={() => {
                                            onSelect(t.content);
                                            setOpen(false);
                                        }}
                                    >
                                        선택하기
                                    </Button>
                                )}
                            </div>
                        ))}
                        {templates.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-4">
                                등록된 템플릿이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
