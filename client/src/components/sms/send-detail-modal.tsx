import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SmsHistory } from "@/lib/sms-utils";

interface AligoDetailItem {
    mdid: string;
    type: string;
    sender: string;
    receiver: string;
    sms_state: string;
    reg_date: string;
    send_date: string;
    reserve_date: string;
}

interface SendDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: SmsHistory | null;
}

export function SendDetailModal({ open, onOpenChange, data }: SendDetailModalProps) {
    const [details, setDetails] = useState<AligoDetailItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(false);

    useEffect(() => {
        if (open && data?.id) {
            fetchDetails(data.id);
        } else {
            setDetails([]);
        }
    }, [open, data?.id]);

    const fetchDetails = async (mid: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sms/detail/${mid}?page=1&page_size=100`, {
                credentials: "include",
            });
            if (res.ok) {
                const result = await res.json();
                if (result.result_code > 0 && result.list) {
                    setDetails(result.list);
                    setHasNextPage(result.next_yn === 'Y');
                }
            }
        } catch (error) {
            console.error("Failed to fetch SMS details:", error);
        } finally {
            setIsLoading(false);
        }
    };

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
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : details.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>수신번호</TableHead>
                                            <TableHead className="w-[120px]">발송일시</TableHead>
                                            <TableHead className="w-[100px]">결과</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {details.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-mono text-sm">{item.receiver}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {item.send_date || item.reg_date}
                                                </TableCell>
                                                <TableCell>
                                                    {item.sms_state === '발송완료' ? (
                                                        <Badge className="bg-green-600 text-xs">성공</Badge>
                                                    ) : item.sms_state === '전송중' ? (
                                                        <Badge variant="secondary" className="text-xs">전송중</Badge>
                                                    ) : item.sms_state === '예약대기' ? (
                                                        <Badge variant="outline" className="text-xs">예약중</Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="text-xs">{item.sms_state}</Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : data.recipients && data.recipients.length > 0 ? (
                                // Fallback to local data if API returns no results
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
                                                        <span className="text-muted-foreground text-xs">취소됨</span>
                                                    ) : recipient.status === 'success' ? (
                                                        <Badge className="bg-green-600 text-xs">성공</Badge>
                                                    ) : recipient.status === 'failed' ? (
                                                        <Badge variant="destructive" className="text-xs">실패</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">대기</Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground text-sm">
                                    상세 정보를 불러올 수 없습니다.
                                </div>
                            )}
                        </ScrollArea>
                        {hasNextPage && (
                            <div className="px-4 py-2 text-xs text-muted-foreground border-t text-center">
                                더 많은 결과가 있습니다. (페이지네이션 미구현)
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
