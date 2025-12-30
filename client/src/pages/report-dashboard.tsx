import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarIcon, Check, Clock, X, AlertCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { Mokjang, Report } from "@shared/schema";

type AttendanceStatus = "ATTENDED" | "LATE" | "ABSENT" | "EXCUSED";

interface MokjangReportData {
  mokjang: {
    id: string;
    name: string;
    targetGrade: string | null;
  };
  teachers: { id: string; name: string }[];
  attendance: {
    total: number;
    attended: number;
  };
  report: Report | null;
  observationSummary: string | null;
  hasReport: boolean;
}

interface DashboardResponse {
  mokjangs: MokjangReportData[];
  date: string;
}

interface StudentDetail {
  id: string;
  name: string;
  grade: string | null;
  status: AttendanceStatus | null;
  memo: string | null;
  observations: string[];
}

interface MokjangDetailResponse {
  mokjang: {
    id: string;
    name: string;
    targetGrade: string | null;
  };
  report: Report | null;
  students: StudentDetail[];
  date: string;
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: typeof Check; className: string }> = {
  ATTENDED: { label: "출석", icon: Check, className: "text-green-600" },
  LATE: { label: "지각", icon: Clock, className: "text-yellow-600" },
  ABSENT: { label: "결석", icon: X, className: "text-red-600" },
  EXCUSED: { label: "사유", icon: AlertCircle, className: "text-blue-600" },
};

// 이번 주 일요일 계산
const getThisSunday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  return sunday;
};

export default function ReportDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(getThisSunday());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedMokjang, setSelectedMokjang] = useState<string>("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMokjangId, setSelectedMokjangId] = useState<string | null>(null);

  const dateString = format(selectedDate, "yyyy-MM-dd");
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

  // 목장 목록
  const { data: mokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  // 대시보드 데이터
  const { data: dashboardData, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["/api/report-dashboard", { date: dateString, mokjangId: selectedMokjang !== "all" ? selectedMokjang : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams({ date: dateString });
      if (selectedMokjang !== "all") {
        params.append("mokjangId", selectedMokjang);
      }
      const res = await fetch(`/api/report-dashboard?${params}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
  });

  // 목장 상세 데이터
  const { data: detailData, isLoading: isDetailLoading } = useQuery<MokjangDetailResponse>({
    queryKey: ["/api/report-dashboard", selectedMokjangId, "details", { date: dateString }],
    queryFn: async () => {
      const res = await fetch(`/api/report-dashboard/${selectedMokjangId}/details?date=${dateString}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
    enabled: !!selectedMokjangId && detailModalOpen,
  });

  const handlePrevWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleRowClick = (mokjangId: string) => {
    setSelectedMokjangId(mokjangId);
    setDetailModalOpen(true);
  };

  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return "-";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <DashboardLayout title="목장 보고서">
      <div className="p-4 md:p-6 space-y-6">
        {/* 필터 영역 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* 주 단위 날짜 선택 */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          // 선택한 날짜가 속한 주의 일요일로 설정
                          const sunday = startOfWeek(date, { weekStartsOn: 0 });
                          setSelectedDate(sunday);
                          setIsCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return date.getDay() !== 0 || date > today;
                      }}
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextWeek}
                  disabled={addWeeks(selectedDate, 1) > new Date()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* 목장 필터 */}
              <Select value={selectedMokjang} onValueChange={setSelectedMokjang}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="목장 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 목장</SelectItem>
                  {mokjangs?.map((mokjang) => (
                    <SelectItem key={mokjang.id} value={mokjang.id}>
                      {mokjang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 목장 보고서 테이블 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              목장별 보고서 현황
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({dashboardData?.mokjangs.length || 0}개 목장)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">목장명</TableHead>
                      <TableHead className="w-28">담당교사</TableHead>
                      <TableHead className="w-24">출석현황</TableHead>
                      <TableHead>목장 메모</TableHead>
                      <TableHead className="w-24 text-center">작성상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!dashboardData?.mokjangs || dashboardData.mokjangs.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          목장 데이터가 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboardData.mokjangs.map((item) => (
                        <TableRow
                          key={item.mokjang.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(item.mokjang.id)}
                        >
                          <TableCell className="font-medium">
                            <div>
                              {item.mokjang.name}
                              {item.mokjang.targetGrade && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({item.mokjang.targetGrade})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.teachers.length > 0
                              ? item.teachers.map(t => t.name).join(", ")
                              : <span className="text-muted-foreground">-</span>
                            }
                          </TableCell>
                          <TableCell>
                            <span className={item.attendance.attended === item.attendance.total && item.attendance.total > 0 ? "text-green-600 font-medium" : ""}>
                              {item.attendance.attended}/{item.attendance.total}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {truncateText(item.report?.content)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.hasReport ? (
                              <Badge variant="default" className="bg-green-600">작성완료</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">미작성</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 상세 모달 */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {detailData?.mokjang.name} 상세
              <span className="text-sm font-normal text-muted-foreground">
                ({format(selectedDate, "M월 d일", { locale: ko })})
              </span>
            </DialogTitle>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          ) : detailData && (
            <div className="space-y-6">
              {/* 목장 보고서 섹션 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  목장 보고서
                </h3>
                {detailData.report ? (
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      {detailData.report.content && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">특이사항</p>
                          <p className="text-sm whitespace-pre-wrap">{detailData.report.content}</p>
                        </div>
                      )}
                      {detailData.report.prayerRequest && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">기도제목</p>
                          <p className="text-sm whitespace-pre-wrap">{detailData.report.prayerRequest}</p>
                        </div>
                      )}
                      {detailData.report.suggestions && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">건의사항</p>
                          <p className="text-sm whitespace-pre-wrap">{detailData.report.suggestions}</p>
                        </div>
                      )}
                      {!detailData.report.content && !detailData.report.prayerRequest && !detailData.report.suggestions && (
                        <p className="text-sm text-muted-foreground">작성된 내용이 없습니다.</p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground text-center py-4">
                        작성된 보고서가 없습니다
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* 학생별 출석 및 특이사항 섹션 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  학생별 출석 및 특이사항
                </h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">이름</TableHead>
                        <TableHead className="w-16 text-center">출석</TableHead>
                        <TableHead>메모/특이사항</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailData.students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                            소속 학생이 없습니다
                          </TableCell>
                        </TableRow>
                      ) : (
                        detailData.students.map((student) => {
                          const config = student.status ? statusConfig[student.status] : null;
                          const StatusIcon = config?.icon;

                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">
                                {student.name}
                                {student.grade && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({student.grade})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {config && StatusIcon ? (
                                  <div className={`flex items-center justify-center gap-1 ${config.className}`}>
                                    <StatusIcon className="h-4 w-4" />
                                    <span className="text-xs">{config.label}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">미체크</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="space-y-1">
                                  {student.memo && (
                                    <p className="text-muted-foreground">{student.memo}</p>
                                  )}
                                  {student.observations.length > 0 && (
                                    <div className="space-y-1">
                                      {student.observations.map((obs, idx) => (
                                        <p key={idx} className="text-orange-600 flex items-start gap-1">
                                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                          {obs}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {!student.memo && student.observations.length === 0 && (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
