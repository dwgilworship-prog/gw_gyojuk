import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { UserCheck, CalendarIcon, Check, Clock, X, AlertCircle, Users, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { Mokjang } from "@shared/schema";

type AttendanceStatus = "ATTENDED" | "LATE" | "ABSENT" | "EXCUSED";

interface DashboardStats {
  total: number;
  attended: number;
  late: number;
  absent: number;
  excused: number;
  notChecked: number;
}

interface StudentDetail {
  id: string;
  name: string;
  grade: string | null;
  mokjangId: string | null;
  mokjangName: string;
  status: AttendanceStatus | null;
  memo: string | null;
  observations: string[];
  hasObservation: boolean;
}

interface DashboardData {
  stats: DashboardStats;
  students: StudentDetail[];
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: typeof Check; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ATTENDED: { label: "출석", icon: Check, variant: "default" },
  LATE: { label: "지각", icon: Clock, variant: "secondary" },
  ABSENT: { label: "결석", icon: X, variant: "destructive" },
  EXCUSED: { label: "사유", icon: AlertCircle, variant: "outline" },
};

// 이번 주 일요일 계산
const getThisSunday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  return sunday;
};

export default function AttendanceDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(getThisSunday());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showObservationOnly, setShowObservationOnly] = useState(false);
  const [selectedMokjang, setSelectedMokjang] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dateString = format(selectedDate, "yyyy-MM-dd");

  // 목장 목록
  const { data: mokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  // 대시보드 데이터
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/attendance-dashboard", { date: dateString }],
    queryFn: async () => {
      const res = await fetch(`/api/attendance-dashboard?date=${dateString}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
  });

  // 필터링된 학생 목록
  const filteredStudents = dashboardData?.students.filter(student => {
    // 특이사항 필터
    if (showObservationOnly && !student.hasObservation) return false;

    // 목장 필터
    if (selectedMokjang !== "all" && student.mokjangId !== selectedMokjang) return false;

    // 상태 필터
    if (selectedStatus !== "all") {
      if (selectedStatus === "notChecked" && student.status !== null) return false;
      if (selectedStatus !== "notChecked" && student.status !== selectedStatus) return false;
    }

    // 검색 필터
    return !(searchQuery && !student.name.includes(searchQuery));


  }) || [];

  const stats = dashboardData?.stats;

  return (
    <DashboardLayout title="출석 현황">
      <div className="p-4 md:p-6 space-y-6">
        {/* 날짜 선택 */}
        <div className="flex items-center justify-between">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                locale={ko}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 통계 카드 */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">전체</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.total}명</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">출석</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {stats.attended}명
                  <span className="text-sm font-normal ml-1">
                    ({stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0}%)
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600">지각</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-yellow-700">{stats.late}명</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">결석</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-red-700">{stats.absent}명</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-600">사유</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-blue-700">{stats.excused}명</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">미체크</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-gray-600">{stats.notChecked}명</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 필터 영역 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              {/* 검색 */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
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

              {/* 상태 필터 */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="ATTENDED">출석</SelectItem>
                  <SelectItem value="LATE">지각</SelectItem>
                  <SelectItem value="ABSENT">결석</SelectItem>
                  <SelectItem value="EXCUSED">사유</SelectItem>
                  <SelectItem value="notChecked">미체크</SelectItem>
                </SelectContent>
              </Select>

              {/* 특이사항 토글 */}
              <div className="flex items-center gap-2">
                <Switch
                  id="observation-filter"
                  checked={showObservationOnly}
                  onCheckedChange={setShowObservationOnly}
                />
                <Label htmlFor="observation-filter" className="text-sm cursor-pointer">
                  특이사항 있는 학생만
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 학생 목록 테이블 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                학생 목록
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredStudents.length}명)
                </span>
              </CardTitle>
            </div>
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
                      <TableHead className="w-24">이름</TableHead>
                      <TableHead className="w-20">학년</TableHead>
                      <TableHead className="w-24">목장</TableHead>
                      <TableHead className="w-20">상태</TableHead>
                      <TableHead>특이사항</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          조건에 맞는 학생이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.grade || "-"}</TableCell>
                          <TableCell>{student.mokjangName}</TableCell>
                          <TableCell>
                            {student.status ? (
                              <Badge variant={statusConfig[student.status].variant}>
                                {statusConfig[student.status].label}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                미체크
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.observations.length > 0 ? (
                              <div className="flex items-start gap-1">
                                <FileText className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">
                                  {student.observations.join(" / ")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
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
    </DashboardLayout>
  );
}
