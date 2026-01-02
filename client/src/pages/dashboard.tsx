import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, UserCog, UserCheck, AlertTriangle, Cake, UserX, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { Student } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import TeacherDashboard from "./teacher-dashboard";

interface Stats {
  studentCount: number;
  mokjangCount: number;
  teacherCount: number;
  weeklyAttendance: {
    total: number;
    attended: number;
    rate: number;
  };
}

interface LongAbsenceStudent {
  student: Student;
  weeksAbsent: number;
  lastAttendanceDate: string | null;
}

interface BirthdayPerson {
  id: string;
  name: string;
  birth: string | null;
  type: "student" | "teacher";
  info: string;
}

interface DashboardWidgets {
  longAbsenceStudents: LongAbsenceStudent[];
  birthdays: BirthdayPerson[];
  unassignedCount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: widgets, isLoading: isLoadingWidgets } = useQuery<DashboardWidgets>({
    queryKey: ["/api/dashboard-widgets"],
    enabled: isAdmin,
  });

  // 교사인 경우 전용 대시보드 표시
  if (!isAdmin) {
    return <TeacherDashboard />;
  }

  return (
    <DashboardLayout title="대시보드">
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
          <Card data-testid="card-stat-students">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">전체 학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              ) : (
                <div className="text-xl md:text-2xl font-bold" data-testid="text-student-count">
                  {stats?.studentCount ?? 0}<span className="text-xs md:text-sm font-normal text-muted-foreground ml-1">명</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-mokjangs">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">목장</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              ) : (
                <div className="text-xl md:text-2xl font-bold" data-testid="text-mokjang-count">
                  {stats?.mokjangCount ?? 0}<span className="text-xs md:text-sm font-normal text-muted-foreground ml-1">개</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-teachers">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">교사</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              ) : (
                <div className="text-xl md:text-2xl font-bold" data-testid="text-teacher-count">
                  {stats?.teacherCount ?? 0}<span className="text-xs md:text-sm font-normal text-muted-foreground ml-1">명</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-attendance">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                <span>출석률</span>
                <span className="ml-1 text-[10px] md:text-xs font-normal text-muted-foreground">
                  {(() => {
                    const now = new Date();
                    // 이번 주 일요일 계산 (서버 로직과 동일)
                    const sunday = new Date(now);
                    sunday.setDate(now.getDate() - now.getDay());

                    const month = sunday.getMonth() + 1;
                    const day = sunday.getDate();

                    // 일요일 날짜 기준으로 주차 계산
                    const weekOfMonth = Math.ceil(day / 7);

                    return `${month}월 ${weekOfMonth}째주(${month}/${day})`;
                  })()}
                </span>
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              ) : (
                <div className="text-xl md:text-2xl font-bold" data-testid="text-attendance-rate">
                  {stats?.weeklyAttendance?.rate ?? "-"}<span className="text-xs md:text-sm font-normal text-muted-foreground ml-1">%</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground hidden md:block">
                {stats?.weeklyAttendance?.total ? `${stats.weeklyAttendance.attended}/${stats.weeklyAttendance.total}명` : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-3">
            <Card data-testid="card-widget-long-absence">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 md:p-6 md:pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="hidden md:inline">장기결석자 알림</span>
                  <span className="md:hidden">장기결석</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1 md:p-6 md:pt-0">
                {isLoadingWidgets ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 hidden md:block" />
                  </div>
                ) : widgets?.longAbsenceStudents && widgets.longAbsenceStudents.length > 0 ? (
                  <div className="space-y-1 md:space-y-2">
                    <div className="md:hidden text-xl font-bold text-destructive">
                      {widgets.longAbsenceStudents.length}<span className="text-xs font-normal text-muted-foreground ml-1">명</span>
                    </div>
                    <div className="hidden md:block space-y-2">
                      {widgets.longAbsenceStudents.slice(0, 3).map((item) => (
                        <div key={item.student.id} className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground">-</span>
                          <span>{item.student.name}</span>
                          <span className="text-destructive font-medium">
                            {item.weeksAbsent === 999 ? "출석기록 없음" : `${item.weeksAbsent}주 결석`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link href="/long-absence">
                      <Button variant="ghost" size="sm" className="w-full mt-1 md:mt-2 text-xs md:text-sm h-8 md:h-9" data-testid="button-go-long-absence">
                        관리하기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground" data-testid="text-no-long-absence-widget">
                    장기결석자가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-widget-birthdays">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 md:p-6 md:pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Cake className="h-4 w-4 text-pink-500" />
                  <span className="hidden md:inline">이번 주 생일</span>
                  <span className="md:hidden">생일</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1 md:p-6 md:pt-0">
                {isLoadingWidgets ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 hidden md:block" />
                  </div>
                ) : widgets?.birthdays && widgets.birthdays.length > 0 ? (
                  <div className="space-y-1 md:space-y-2">
                    <div className="md:hidden text-xl font-bold text-pink-500">
                      {widgets.birthdays.length}<span className="text-xs font-normal text-muted-foreground ml-1">명</span>
                    </div>
                    <div className="hidden md:block space-y-2">
                      {widgets.birthdays.map((item: any) => {
                        const name = item.name || item.student?.name;
                        const birth = item.birth || item.student?.birth;
                        const info = item.info || (item.student ? (item.student.grade ? `(${item.student.grade})` : "") : "");

                        // 생년월일에서 월/일만 추출해 올해 날짜로 변환 (요일 정확히 표시)
                        const getThisYearBirthday = (birthStr: string) => {
                          const birthDate = new Date(birthStr);
                          return new Date(new Date().getFullYear(), birthDate.getMonth(), birthDate.getDate());
                        };

                        return (
                          <div key={item.id || item.student?.id} className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground">-</span>
                            <span className="text-pink-500 font-medium">
                              {birth ? format(getThisYearBirthday(birth), "M/d (E)", { locale: ko }) : ""}
                            </span>
                            <span>{name}</span>
                            {info && <span className="text-muted-foreground">({info})</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground" data-testid="text-no-birthdays">
                    이번 주 생일자가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1" data-testid="card-widget-unassigned">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 md:p-6 md:pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <UserX className="h-4 w-4 text-amber-500" />
                  미배정 학생
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1 md:p-6 md:pt-0">
                {isLoadingWidgets ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                ) : widgets?.unassignedCount && widgets.unassignedCount > 0 ? (
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-amber-500" data-testid="text-unassigned-count">
                      {widgets.unassignedCount}<span className="text-xs md:text-sm font-normal text-muted-foreground ml-1">명</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 md:mb-2 hidden md:block">명의 학생이 목장에 배정되지 않았습니다</p>
                    <Link href="/students">
                      <Button variant="ghost" size="sm" className="w-full text-xs md:text-sm h-8 md:h-9" data-testid="button-go-students">
                        배정하기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground" data-testid="text-no-unassigned">
                    모든 학생이 배정되었습니다
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
