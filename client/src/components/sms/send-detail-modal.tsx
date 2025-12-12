import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SmsHistory } from "@/lib/sms-utils";

interface SendDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: SmsHistory | null;
}

export function SendDetailModal({ open, onOpenChange, data }: SendDetailModalProps) {
    if (!data) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>발송 상세 내역</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground mr-2">발송일시:</span>
                            <span className="font-medium">
                                {format(new Date(data.sentAt), "yyyy-MM-dd HH:mm", { locale: ko })}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-2">문자유형:</span>
                            <span className="font-medium">{data.type}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-2">상태:</span>
                            <Badge variant={data.status === 'completed' ? 'default' : data.status === 'failed' ? 'destructive' : 'secondary'}>
                                {data.status === 'completed' ? '발송완료' : data.status === 'scheduled' ? '예약중' : data.status === 'cancelled' ? '취소됨' : '실패'}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-2">발송성공:</span>
                            <span className="text-green-600 font-medium">{data.successCount}명</span>
                            <span className="mx-1">/</span>
                            <span className="text-muted-foreground">총 {data.recipientCount}명</span>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                        {data.title && <div className="font-bold mb-1">[{data.title}]</div>}
                        {data.content}
                    </div>

                    <div className="border rounded-md">
                        <div className="bg-muted px-4 py-2 text-sm font-medium border-b">수신자 목록</div>
                        <ScrollArea className="h-[200px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">이름</TableHead>
                                        <TableHead>전화번호</TableHead>
                                        <TableHead className="w-[100px]">결과</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recipients.map((recipient, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{recipient.name}</TableCell>
                                            <TableCell>{recipient.phone}</TableCell>
                                            <TableCell>
                                                {data.status === 'cancelled' ? (
                                                    <span className="text-muted-foreground text-xs">⛔ 취소됨</span>
                                                ) : recipient.status === 'success' ? (
                                                    <span className="text-green-600 text-xs">✅ 성공</span>
                                                ) : recipient.status === 'failed' ? (
                                                    <span className="text-red-600 text-xs">❌ 실패</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">⏳ 대기</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
