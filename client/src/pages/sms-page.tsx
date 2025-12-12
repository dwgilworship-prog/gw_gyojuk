import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RecipientSelector } from "@/components/sms/recipient-selector";
import { MessageComposer } from "@/components/sms/message-composer";
import { SendHistory } from "@/components/sms/send-history";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    SmsHistory,
    SmsRecipient,
    getHistory,
    saveHistory,
    processTemplate,
    getTemplates
} from "@/lib/sms-utils";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/hooks/use-auth";
import { TemplateManager } from "@/components/sms/template-manager";
import { Button } from "@/components/ui/button";

export default function SmsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [history, setHistory] = useState<SmsHistory[]>([]);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        refreshHistory();
        refreshTemplates();
    }, []);

    const refreshHistory = () => {
        setHistory(getHistory());
    };

    const refreshTemplates = () => {
        setTemplates(getTemplates());
    };

    const handleSelectionChange = (ids: string[], type: 'student' | 'parent' | 'both', recipientsData: any[]) => {
        // Deduping is already handled relatively well by RecipientSelector but let's be safe
        setRecipients(recipientsData);
    };

    const handleSend = (data: {
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

        // Mock Sending Process
        toast({
            title: "API 미연동 상태입니다",
            description: "실제 발송 대신 발송 내역에 저장됩니다.",
            // variant: "default", 
        });

        // Create History Record
        const historyItem: SmsHistory = {
            id: uuidv4(),
            sentAt: new Date().toISOString(),
            type: data.type,
            title: data.title,
            content: data.content,
            recipientCount: recipients.length,
            successCount: recipients.length, // Mock success
            failCount: 0,
            status: data.isScheduled ? 'scheduled' : 'completed',
            scheduledAt: data.scheduledAt?.toISOString(),
            recipients: recipients.map(r => ({
                name: r.name,
                phone: r.phone,
                studentId: r.studentId,
                type: r.type,
                status: 'success'
            }))
        };

        saveHistory(historyItem);
        refreshHistory();

        if (data.isScheduled) {
            toast({ title: "예약되었습니다", description: `${recipients.length}명에게 예약 발송됩니다.` });
        } else {
            toast({ title: "발송되었습니다", description: `${recipients.length}명에게 문자를 발송했습니다.` });
        }
    };

    const handleTestSend = (content: string) => {
        if (!content) return;
        alert(`[테스트 발송]\n\n내용:\n${content}\n\n(실제 발송되지 않았습니다)`);
    };

    // Access Control (Optional, but safe)
    if (user?.role !== 'admin' && user?.role !== 'teacher') {
        // You might want to redirect or show unauthorized
    }

    return (
        <DashboardLayout title="문자 발송">
            <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
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
                        <SendHistory history={history} onRefresh={refreshHistory} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
