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

interface BirthdayStudent {
  student: Student;
  mokjangName: string;
}

interface DashboardWidgets {
  longAbsenceStudents: LongAbsenceStudent[];
  birthdays: BirthdayStudent[];
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

  return (
    <DashboardLayout title="대시보드">
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-stat-students">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium">전체 학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-student-count">
                  {stats?.studentCount ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">명</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-mokjangs">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium">목장</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-mokjang-count">
                  {stats?.mokjangCount ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-teachers">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium">교사</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-teacher-count">
                  {stats?.teacherCount ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">명</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-attendance">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium">이번 주 출석률</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-attendance-rate">
                  {stats?.weeklyAttendance?.rate ?? "-"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {stats?.weeklyAttendance?.total ? `${stats.weeklyAttendance.attended}/${stats.weeklyAttendance.total}명` : "%"}
              </p>
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card data-testid="card-widget-long-absence">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  장기결석자 알림
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingWidgets ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : widgets?.longAbsenceStudents && widgets.longAbsenceStudents.length > 0 ? (
                  <div className="space-y-2">
                    {widgets.longAbsenceStudents.slice(0, 3).map((item) => (
                      <div key={item.student.id} className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">-</span>
                        <span>{item.student.name}</span>
                        <span className="text-destructive font-medium">
                          {item.weeksAbsent === 999 ? "출석기록 없음" : `${item.weeksAbsent}주 결석`}
                        </span>
                      </div>
                    ))}
                    <Link href="/long-absence">
                      <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-go-long-absence">
                        관리하기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-long-absence-widget">
                    장기결석자가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-widget-birthdays">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cake className="h-4 w-4 text-pink-500" />
                  이번 주 생일
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingWidgets ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : widgets?.birthdays && widgets.birthdays.length > 0 ? (
                  <div className="space-y-2">
                    {widgets.birthdays.map((item) => (
                      <div key={item.student.id} className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">-</span>
                        <span className="text-pink-500 font-medium">
                          {item.student.birth ? format(new Date(item.student.birth), "M/d (E)", { locale: ko }) : ""}
                        </span>
                        <span>{item.student.name}</span>
                        {item.student.grade && (
                          <span className="text-muted-foreground">({item.student.grade})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-birthdays">
                    이번 주 생일자가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-widget-unassigned">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserX className="h-4 w-4 text-amber-500" />
                  미배정 학생
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingWidgets ? (
                  <Skeleton className="h-8 w-16" />
                ) : widgets?.unassignedCount && widgets.unassignedCount > 0 ? (
                  <div>
                    <div className="text-2xl font-bold text-amber-500" data-testid="text-unassigned-count">
                      {widgets.unassignedCount}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">명의 학생이 목장에 배정되지 않았습니다</p>
                    <Link href="/students">
                      <Button variant="ghost" size="sm" className="w-full" data-testid="button-go-students">
                        배정하기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-unassigned">
                    모든 학생이 배정되었습니다
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!isAdmin && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">최근 활동</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  아직 활동 기록이 없습니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">빠른 작업</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  사이드 메뉴에서 원하는 기능을 선택하세요.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
