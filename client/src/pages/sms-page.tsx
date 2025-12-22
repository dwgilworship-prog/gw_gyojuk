import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RecipientSelector } from "@/components/sms/recipient-selector";
import { MessageComposer } from "@/components/sms/message-composer";
import { SendHistory } from "@/components/sms/send-history";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getTemplates } from "@/lib/sms-utils";
import { useAuth } from "@/hooks/use-auth";
import { TemplateManager } from "@/components/sms/template-manager";
import { format } from "date-fns";

interface AligoHistoryItem {
    mid: string;
    type: string;
    sender: string;
    sms_count: string;
    reserve_state: string;
    msg: string;
    fail_count: string;
    reg_date: string;
    reserve: string;
}

interface AligoRemain {
    result_code: number;
    message: string;
    SMS_CNT?: number;
    LMS_CNT?: number;
    MMS_CNT?: number;
}

export default function SmsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [aligoHistory, setAligoHistory] = useState<AligoHistoryItem[]>([]);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [remain, setRemain] = useState<AligoRemain | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        refreshHistory();
        refreshTemplates();
        fetchRemain();
    }, []);

    const refreshHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/sms/history?page=1&page_size=100", {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                if (data.result_code > 0 && data.list) {
                    setAligoHistory(data.list);
                } else if (data.result_code < 0) {
                    console.error("Aligo API error:", data.message);
                }
            }
        } catch (error) {
            console.error("Failed to fetch SMS history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRemain = async () => {
        try {
            const res = await fetch("/api/sms/remain", {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                if (data.result_code > 0) {
                    setRemain(data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch remain:", error);
        }
    };

    const refreshTemplates = () => {
        setTemplates(getTemplates());
    };

    const handleSelectionChange = (ids: string[], type: 'student' | 'parent' | 'both', recipientsData: any[]) => {
        setRecipients(recipientsData);
    };

    const handleSend = async (data: {
        type: 'SMS' | 'LMS';
        title?: string;
        content: string;
        isScheduled: boolean;
        scheduledAt?: Date;
    }) => {
        if (recipients.length === 0) {
            toast({ title: "수신자를 선택해주세요", variant: "destructive" });
            return;
        }

        setIsSending(true);

        try {
            // 수신자 전화번호 목록 생성 (쉼표로 구분, 최대 1000명)
            const receiverList = recipients
                .map(r => r.phone?.replace(/-/g, ''))
                .filter(Boolean);

            if (receiverList.length === 0) {
                toast({ title: "유효한 전화번호가 없습니다", variant: "destructive" });
                setIsSending(false);
                return;
            }

            // %이름% 등 치환 변수가 있으면 destination 파라미터 생성
            const hasNameVariable = data.content.includes('%고객명%') || data.content.includes('%이름%');
            let destination = '';
            if (hasNameVariable) {
                destination = recipients
                    .map(r => `${r.phone?.replace(/-/g, '')}|${r.name}`)
                    .join(',');
            }

            // 예약 발송 시간 설정
            let rdate, rtime;
            if (data.isScheduled && data.scheduledAt) {
                rdate = format(data.scheduledAt, 'yyyyMMdd');
                rtime = format(data.scheduledAt, 'HHmm');
            }

            // 메시지 내용에서 %이름% -> %고객명% 치환 (Aligo API 호환)
            let msgContent = data.content.replace(/%이름%/g, '%고객명%');

            const requestBody = {
                receiver: receiverList.join(','),
                msg: msgContent,
                msg_type: data.type,
                title: data.type === 'LMS' ? data.title : undefined,
                destination: hasNameVariable ? destination : undefined,
                rdate,
                rtime,
            };

            const res = await fetch("/api/sms/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(requestBody),
            });

            const result = await res.json();

            if (result.result_code > 0) {
                toast({
                    title: data.isScheduled ? "예약 발송 완료" : "발송 완료",
                    description: `성공: ${result.success_cnt}건, 실패: ${result.error_cnt}건`,
                });
                refreshHistory();
                fetchRemain();
            } else {
                toast({
                    title: "발송 실패",
                    description: result.message || "문자 발송 중 오류가 발생했습니다.",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "발송 실패",
                description: error.message || "문자 발송 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleTestSend = async (content: string) => {
        if (!content) return;

        // 테스트 모드로 발송 (실제 발송되지 않음)
        toast({
            title: "테스트 발송",
            description: "테스트 모드에서는 실제 발송되지 않습니다. 실제 발송하려면 '발송하기' 버튼을 사용하세요.",
        });
    };

    // Aligo API 응답을 기존 컴포넌트 형식으로 변환
    const convertedHistory = aligoHistory.map(item => ({
        id: item.mid,
        sentAt: item.reg_date,
        type: item.type as 'SMS' | 'LMS',
        title: undefined,
        content: item.msg,
        recipientCount: parseInt(item.sms_count) || 0,
        successCount: parseInt(item.sms_count) - parseInt(item.fail_count) || 0,
        failCount: parseInt(item.fail_count) || 0,
        status: item.reserve_state === '예약대기중' ? 'scheduled' as const :
               item.reserve_state === '전송완료' ? 'completed' as const :
               item.reserve_state === '취소완료' ? 'cancelled' as const : 'completed' as const,
        scheduledAt: item.reserve || undefined,
        recipients: [],
    }));

    if (user?.role !== 'admin') {
        return (
            <DashboardLayout title="문자 발송">
                <div className="p-6 text-center text-muted-foreground">
                    관리자만 접근할 수 있습니다.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="문자 발송">
            <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
                {/* 발송 가능 건수 표시 */}
                {remain && remain.result_code > 0 && (
                    <Card className="bg-muted/30">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-4 items-center">
                                <span className="text-sm font-medium">발송 가능 건수:</span>
                                <Badge variant="secondary" className="text-sm">
                                    SMS: {remain.SMS_CNT?.toLocaleString()}건
                                </Badge>
                                <Badge variant="secondary" className="text-sm">
                                    LMS: {remain.LMS_CNT?.toLocaleString()}건
                                </Badge>
                                <Badge variant="secondary" className="text-sm">
                                    MMS: {remain.MMS_CNT?.toLocaleString()}건
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    {/* Left Col: Recipients */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="h-full">
                            <CardContent className="p-4">
                                <RecipientSelector onSelectionChange={handleSelectionChange} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Col: Composer */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="h-full">
                            <CardContent className="p-4 h-full flex flex-col">
                                <div className="flex justify-end mb-2">
                                    <TemplateManager onUpdate={refreshTemplates} />
                                </div>
                                <MessageComposer
                                    onSend={handleSend}
                                    onTestSend={handleTestSend}
                                    recipientCount={recipients.length}
                                    templates={templates}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Row: History */}
                <Card>
                    <CardContent className="p-4">
                        <SendHistory
                            history={convertedHistory}
                            onRefresh={refreshHistory}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
