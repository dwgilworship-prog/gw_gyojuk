import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { RefreshCw, Search, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SmsHistory, SmsHistoryFilter, filterAndPaginateHistory } from "@/lib/sms-utils";
import { SendDetailModal } from "./send-detail-modal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SendHistoryProps {
    history: SmsHistory[];
    onRefresh: () => void;
}

const PAGE_SIZE = 10;

export function SendHistory({ history, onRefresh }: SendHistoryProps) {
    const { toast } = useToast();
    const [selectedItem, setSelectedItem] = useState<SmsHistory | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Filter input states
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<"ALL" | "SMS" | "LMS">("ALL");
    const [statusFilter, setStatusFilter] = useState<SmsHistoryFilter["status"]>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Applied filter (only updated on Search click)
    const [appliedFilter, setAppliedFilter] = useState<SmsHistoryFilter>({});
    const [currentPage, setCurrentPage] = useState(1);

    // Apply filter on search click
    const handleSearch = () => {
        setAppliedFilter({
            startDate,
            endDate,
            type: typeFilter,
            status: statusFilter,
            searchQuery: searchQuery.trim() || undefined,
        });
        setCurrentPage(1);
    };

    // Reset all filters
    const handleRefresh = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        setTypeFilter("ALL");
        setStatusFilter("ALL");
        setSearchQuery("");
        setAppliedFilter({});
        setCurrentPage(1);
        onRefresh();
    };

    // Calculated paginated result
    const paginatedResult = useMemo(() => {
        return filterAndPaginateHistory(history, appliedFilter, currentPage, PAGE_SIZE);
    }, [history, appliedFilter, currentPage]);

    const handleCancel = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("정말 예약 발송을 취소하시겠습니까?")) return;

        setCancellingId(id);
        try {
            const res = await fetch("/api/sms/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ mid: id }),
            });

            const result = await res.json();

            if (result.result_code > 0) {
                toast({ title: "예약 취소됨", description: "발송 예약이 취소되었습니다." });
                onRefresh();
            } else {
                toast({
                    title: "취소 실패",
                    description: result.message || "예약 취소에 실패했습니다.",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "취소 실패",
                description: error.message || "예약 취소 중 오류가 발생했습니다.",
                variant: "destructive"
            });
        } finally {
            setCancellingId(null);
        }
    };

    // Generate page numbers to display (max 5)
    const getPageNumbers = () => {
        const { totalPages, page } = paginatedResult;
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    📜 발송 내역
                </h2>
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    새로고침
                </Button>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap gap-2 items-center p-3 border rounded-md bg-muted/30">
                {/* Start Date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-[130px] justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "yyyy-MM-dd") : "시작일"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            locale={ko}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">~</span>

                {/* End Date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-[130px] justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "yyyy-MM-dd") : "종료일"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            locale={ko}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "ALL" | "SMS" | "LMS")}>
                    <SelectTrigger className="w-[100px] h-9">
                        <SelectValue placeholder="유형" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="LMS">LMS</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SmsHistoryFilter["status"])}>
                    <SelectTrigger className="w-[100px] h-9">
                        <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="scheduled">예약</SelectItem>
                        <SelectItem value="failed">실패</SelectItem>
                        <SelectItem value="cancelled">취소</SelectItem>
                    </SelectContent>
                </Select>

                {/* Search Input */}
                <Input
                    placeholder="내용/제목 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[180px] h-9"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />

                {/* Search Button */}
                <Button size="sm" onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-1" />
                    검색
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">발송일시</TableHead>
                            <TableHead className="w-[80px]">유형</TableHead>
                            <TableHead>내용 (요약)</TableHead>
                            <TableHead className="w-[80px]">수신자</TableHead>
                            <TableHead className="w-[100px]">상태</TableHead>
                            <TableHead className="w-[80px]">관리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedResult.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    발송 내역이 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedResult.data.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <TableCell className="text-xs">
                                        {item.status === 'scheduled' && item.scheduledAt
                                            ? <span className="text-blue-600 font-bold">{format(new Date(item.scheduledAt), "MM-dd HH:mm", { locale: ko })} (예약)</span>
                                            : format(new Date(item.sentAt), "MM-dd HH:mm", { locale: ko })
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.type}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                                        {item.title ? `[${item.title}] ` : ''}{item.content}
                                    </TableCell>
                                    <TableCell>{item.recipientCount}명</TableCell>
                                    <TableCell>
                                        {item.status === 'completed' && <Badge className="bg-green-600 hover:bg-green-700">완료</Badge>}
                                        {item.status === 'scheduled' && <Badge variant="secondary">예약대기</Badge>}
                                        {item.status === 'failed' && <Badge variant="destructive">실패</Badge>}
                                        {item.status === 'cancelled' && <Badge variant="outline">취소됨</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        {item.status === 'scheduled' ? (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-6 text-xs"
                                                onClick={(e) => handleCancel(item.id, e)}
                                                disabled={cancellingId === item.id}
                                            >
                                                {cancellingId === item.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    "취소"
                                                )}
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" size="sm" className="h-6 text-xs">상세</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {paginatedResult.totalPages > 0 && (
                <div className="flex items-center justify-center gap-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                    }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                            {getPageNumbers().map((pageNum) => (
                                <PaginationItem key={pageNum}>
                                    <PaginationLink
                                        href="#"
                                        isActive={pageNum === paginatedResult.page}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(pageNum);
                                        }}
                                    >
                                        {pageNum}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < paginatedResult.totalPages) setCurrentPage(currentPage + 1);
                                    }}
                                    className={currentPage >= paginatedResult.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                    <span className="text-sm text-muted-foreground">(총 {paginatedResult.total}건)</span>
                </div>
            )}

            <SendDetailModal
                open={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
                data={selectedItem}
            />
        </div>
    );
}
