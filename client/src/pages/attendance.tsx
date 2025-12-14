import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UserCheck, CalendarIcon, Check, Clock, X, AlertCircle, Save, Users } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Mokjang, Student, AttendanceLog, MokjangTeacher, Teacher } from "@shared/schema";

type AttendanceStatus = "ATTENDED" | "LATE" | "ABSENT" | "EXCUSED";

interface AttendanceState {
  [studentId: string]: AttendanceStatus;
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: typeof Check; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ATTENDED: { label: "출석", icon: Check, variant: "default" },
  LATE: { label: "지각", icon: Clock, variant: "secondary" },
  ABSENT: { label: "결석", icon: X, variant: "destructive" },
  EXCUSED: { label: "사유", icon: AlertCircle, variant: "outline" },
};

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMokjangId, setSelectedMokjangId] = useState<string>("");
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const dateString = format(selectedDate, "yyyy-MM-dd");

  const { data: mokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: allMokjangTeachers } = useQuery<MokjangTeacher[]>({
    queryKey: ["/api/mokjang-teachers"],
  });

  // 현재 로그인한 교사 정보
  const myTeacher = teachers?.find(t => t.userId === user?.id);
  const myMokjangIds = allMokjangTeachers
    ?.filter(mt => mt.teacherId === myTeacher?.id)
    .map(mt => mt.mokjangId) || [];

  const availableMokjangs = user?.role === "admin"
    ? mokjangs
    : mokjangs?.filter((m) => myMokjangIds.includes(m.id));

  // 교사일 경우 첫 번째 목장을 자동 선택
  useEffect(() => {
    if (user?.role === "teacher" && availableMokjangs && availableMokjangs.length > 0 && !selectedMokjangId) {
      setSelectedMokjangId(availableMokjangs[0].id);
    }
  }, [user?.role, availableMokjangs, selectedMokjangId]);

  const isAllMokjangsSelected = selectedMokjangId === "all";

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: isAllMokjangsSelected 
      ? ["/api/students", "all"] 
      : ["/api/students", { mokjangId: selectedMokjangId }],
    queryFn: async () => {
      if (!selectedMokjangId) return [];
      if (isAllMokjangsSelected) {
        const res = await fetch("/api/students");
        if (!res.ok) return [];
        return res.json();
      }
      const res = await fetch(`/api/students?mokjangId=${selectedMokjangId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedMokjangId,
  });

  const { data: existingAttendance, isLoading: isLoadingAttendance } = useQuery<AttendanceLog[]>({
    queryKey: isAllMokjangsSelected
      ? ["/api/attendance", { date: dateString, all: true }]
      : ["/api/attendance", { date: dateString, mokjangId: selectedMokjangId }],
    queryFn: async () => {
      if (!selectedMokjangId) return [];
      if (isAllMokjangsSelected) {
        const res = await fetch(`/api/attendance?date=${dateString}`);
        if (!res.ok) return [];
        return res.json();
      }
      const res = await fetch(`/api/attendance?date=${dateString}&mokjangId=${selectedMokjangId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedMokjangId,
  });

  useEffect(() => {
    if (students && existingAttendance) {
      const newState: AttendanceState = {};
      students.forEach((student) => {
        const existing = existingAttendance.find((a) => a.studentId === student.id);
        newState[student.id] = existing?.status as AttendanceStatus || "ATTENDED";
      });
      setAttendanceState(newState);
    }
  }, [students, existingAttendance]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const logs = Object.entries(attendanceState).map(([studentId, status]) => ({
        studentId,
        date: dateString,
        status,
        memo: null,
      }));
      return await apiRequest("POST", "/api/attendance", logs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "출석이 저장되었습니다." });
    },
    onError: () => {
      toast({ title: "저장 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleQuickSelect = (status: AttendanceStatus) => {
    if (!students) return;
    const newState: AttendanceState = {};
    students.forEach((student) => {
      newState[student.id] = status;
    });
    setAttendanceState(newState);
  };

  const getAttendanceSummary = () => {
    const counts = { ATTENDED: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
    Object.values(attendanceState).forEach((status) => {
      counts[status]++;
    });
    return counts;
  };

  const summary = getAttendanceSummary();
  const activeStudents = students?.filter((s) => s.status === "ACTIVE") || [];

  const getMokjangName = (mokjangId: string | null) => {
    if (!mokjangId) return "미배정";
    return mokjangs?.find((m) => m.id === mokjangId)?.name || "미배정";
  };

  const studentsByMokjang = isAllMokjangsSelected
    ? activeStudents.reduce((acc, student) => {
        const mokjangName = getMokjangName(student.mokjangId);
        if (!acc[mokjangName]) acc[mokjangName] = [];
        acc[mokjangName].push(student);
        return acc;
      }, {} as Record<string, Student[]>)
    : null;

  return (
    <DashboardLayout title="출석 체크">
      <div className="p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start" data-testid="button-change-date">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={selectedMokjangId} onValueChange={setSelectedMokjangId}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-mokjang">
                  <SelectValue placeholder="목장 선택" />
                </SelectTrigger>
                <SelectContent>
                  {user?.role === "admin" && (
                    <SelectItem value="all" data-testid="select-mokjang-all">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        전체 목장
                      </span>
                    </SelectItem>
                  )}
                  {availableMokjangs?.map((mokjang) => (
                    <SelectItem key={mokjang.id} value={mokjang.id}>
                      {mokjang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {!selectedMokjangId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                출석 체크할 목장을 선택해주세요.
              </p>
            </CardContent>
          </Card>
        ) : isLoadingStudents || isLoadingAttendance ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : activeStudents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                이 목장에 등록된 학생이 없습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    빠른 선택
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                      const config = statusConfig[status];
                      return (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSelect(status)}
                          data-testid={`button-quick-${status.toLowerCase()}`}
                        >
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {isAllMokjangsSelected && studentsByMokjang ? (
              <div className="space-y-4">
                {Object.entries(studentsByMokjang).map(([mokjangName, mokjangStudents]) => (
                  <div key={mokjangName} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {mokjangName} ({mokjangStudents.length}명)
                    </h3>
                    <div className="space-y-2">
                      {mokjangStudents.map((student) => {
                        const currentStatus = attendanceState[student.id] || "ATTENDED";
                        return (
                          <Card key={student.id} data-testid={`card-student-attendance-${student.id}`}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate" data-testid={`text-student-name-${student.id}`}>
                                    {student.name}
                                  </p>
                                  {student.grade && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {student.grade}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                                    const config = statusConfig[status];
                                    const Icon = config.icon;
                                    const isSelected = currentStatus === status;
                                    return (
                                      <Button
                                        key={status}
                                        size="sm"
                                        variant={isSelected ? config.variant : "ghost"}
                                        className={`px-2 ${isSelected ? "" : "opacity-50"}`}
                                        onClick={() => handleStatusChange(student.id, status)}
                                        data-testid={`button-status-${student.id}-${status.toLowerCase()}`}
                                      >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline ml-1 text-xs">{config.label}</span>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {activeStudents.map((student) => {
                  const currentStatus = attendanceState[student.id] || "ATTENDED";
                  return (
                    <Card key={student.id} data-testid={`card-student-attendance-${student.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate" data-testid={`text-student-name-${student.id}`}>
                              {student.name}
                            </p>
                            {student.grade && (
                              <p className="text-xs text-muted-foreground truncate">
                                {student.grade}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                              const config = statusConfig[status];
                              const Icon = config.icon;
                              const isSelected = currentStatus === status;
                              return (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={isSelected ? config.variant : "ghost"}
                                  className={`px-2 ${isSelected ? "" : "opacity-50"}`}
                                  onClick={() => handleStatusChange(student.id, status)}
                                  data-testid={`button-status-${student.id}-${status.toLowerCase()}`}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1 text-xs">{config.label}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">출석 {summary.ATTENDED}</Badge>
                    <Badge variant="secondary">지각 {summary.LATE}</Badge>
                    <Badge variant="destructive">결석 {summary.ABSENT}</Badge>
                    <Badge variant="outline">사유 {summary.EXCUSED}</Badge>
                  </div>
                  <Button 
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-attendance"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveMutation.isPending ? "저장 중..." : "출석 저장"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
