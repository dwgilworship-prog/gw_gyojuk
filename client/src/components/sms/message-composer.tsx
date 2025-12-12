import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock, Send, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { calculateBytes, SMS_MAX_BYTES, SmsTemplate, getTemplates } from "@/lib/sms-utils";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
    onSend: (data: {
        type: 'SMS' | 'LMS';
        title?: string;
        content: string;
        isScheduled: boolean;
        scheduledAt?: Date;
    }) => void;
    onTestSend: (content: string) => void;
    recipientCount: number;
    templates: SmsTemplate[];
}

export function MessageComposer({ onSend, onTestSend, recipientCount, templates }: MessageComposerProps) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [msgType, setMsgType] = useState<'SMS' | 'LMS'>('SMS');
    const [bytes, setBytes] = useState(0);

    // Scheduling
    const [isScheduled, setIsScheduled] = useState(false);
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState("09:00");

    // Removed internal templates state and useEffect

    useEffect(() => {
        const currentBytes = calculateBytes(content);
        setBytes(currentBytes);
        if (msgType === 'SMS' && currentBytes > SMS_MAX_BYTES) {
            setMsgType('LMS');
        }
    }, [content, msgType]);

    const handleTemplateClick = (templateContent: string) => {
        // Append or replace? Usually replace or insert at cursor. 
        // Simplified: Append for now.
        setContent(prev => prev + templateContent);
    };

    const handleInsertVariable = (variable: string) => {
        setContent(prev => prev + variable);
    }

    const handleSendClick = () => {
        let scheduledAt: Date | undefined;
        if (isScheduled && date) {
            const [hours, minutes] = time.split(':').map(Number);
            scheduledAt = new Date(date);
            scheduledAt.setHours(hours, minutes);
        }

        onSend({
            type: msgType,
            title: msgType === 'LMS' ? title : undefined,
            content,
            isScheduled,
            scheduledAt
        });

        // Reset form
        setContent("");
        setTitle("");
        setIsScheduled(false);
        setBytes(0);
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    📝 문자 작성
                </h2>
                <div className="flex gap-2">
                    <RadioGroup
                        defaultValue="SMS"
                        value={msgType}
                        onValueChange={(v) => setMsgType(v as 'SMS' | 'LMS')}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="SMS" id="sms" />
                            <Label htmlFor="sms">SMS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="LMS" id="lms" />
                            <Label htmlFor="lms">LMS</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            {msgType === 'LMS' && (
                <Input
                    placeholder="제목 (LMS는 필수 아님)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            )}

            {/* Variables & Templates Helper */}
            <div className="flex flex-wrap gap-2 text-xs">
                <Button variant="outline" size="sm" className="h-7" onClick={() => handleInsertVariable('%이름%')}>%이름%</Button>
                <Button variant="outline" size="sm" className="h-7" onClick={() => handleInsertVariable('%목장%')}>%목장%</Button>
                <Button variant="outline" size="sm" className="h-7" onClick={() => handleInsertVariable('%학년%')}>%학년%</Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 ml-auto">📋 자주 쓰는 문구</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 max-h-60 overflow-y-auto p-2" align="end">
                        {templates.length === 0 ? (
                            <div className="text-center text-muted-foreground p-2">저장된 문구가 없습니다.</div>
                        ) : (
                            <div className="space-y-1">
                                {templates.map(t => (
                                    <div
                                        key={t.id}
                                        className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                                        onClick={() => handleTemplateClick(t.content)}
                                    >
                                        <div className="font-medium truncate">{t.title}</div>
                                        <div className="text-xs text-muted-foreground truncate">{t.content}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            <div className="relative flex-1">
                <Textarea
                    placeholder="내용을 입력하세요..."
                    className="h-full min-h-[200px] resize-none pr-2 pb-8"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className={cn(
                    "absolute bottom-2 right-2 text-xs font-mono px-2 py-1 rounded bg-muted/80",
                    bytes > SMS_MAX_BYTES && msgType === 'SMS' ? "text-destructive font-bold" : "text-muted-foreground"
                )}>
                    {bytes} / {msgType === 'SMS' ? SMS_MAX_BYTES : '2000'} bytes
                </div>
            </div>

            {/* Scheduling */}
            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="schedule"
                        checked={isScheduled}
                        onCheckedChange={(c) => setIsScheduled(c === true)}
                    />
                    <Label htmlFor="schedule" className="font-medium cursor-pointer">예약 발송</Label>
                </div>

                {isScheduled && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[140px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center border rounded-md bg-white px-3 w-[120px]">
                            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full text-sm outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => onTestSend(content)}>
                    <Smartphone className="w-4 h-4 mr-2" />
                    테스트 발송
                </Button>
                <Button
                    className="flex-[2]"
                    disabled={recipientCount === 0 || content.length === 0}
                    onClick={handleSendClick}
                >
                    <Send className="w-4 h-4 mr-2" />
                    {isScheduled ? '예약 발송' : '발송하기'} ({recipientCount}명)
                </Button>
            </div>
        </div>
    );
}
