import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, LogOut, AlertCircle, UserPlus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface LoginLog {
  id: string;
  userId: string;
  action: "login" | "logout" | "login_failed";
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  userEmail?: string;
  userName?: string;
}

interface DataChangeLog {
  id: string;
  userId: string;
  action: "create" | "update" | "delete";
  targetType: "student" | "teacher";
  targetId: string;
  targetName: string | null;
  changes: any;
  createdAt: string;
  userEmail?: string;
}

interface LogResponse<T> {
  logs: T[];
  total: number;
  page: number;
  limit: number;
}

const actionIcons = {
  login: LogIn,
  logout: LogOut,
  login_failed: AlertCircle,
  create: UserPlus,
  update: Pencil,
  delete: Trash2,
};

const actionLabels = {
  login: "로그인",
  logout: "로그아웃",
  login_failed: "로그인 실패",
  create: "생성",
  update: "수정",
  delete: "삭제",
};

const actionColors = {
  login: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  login_failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  create: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  update: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const targetTypeLabels = {
  student: "학생",
  teacher: "교사",
};

function formatUserAgent(userAgent: string | null): string {
  if (!userAgent) return "-";
  // 간단히 브라우저 정보만 추출
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "기타";
}

function formatChanges(changes: any): string {
  if (!changes) return "-";

  if (changes.created) {
    return "신규 생성";
  }

  if (changes.deleted) {
    return "삭제됨";
  }

  // update의 경우 변경된 필드들 표시
  const fields = Object.keys(changes);
  if (fields.length === 0) return "-";

  return fields.map(field => {
    const change = changes[field];
    return `${field}: ${change.old || "(없음)"} → ${change.new || "(없음)"}`;
  }).join(", ");
}

export default function AdminLogs() {
  const [loginPage, setLoginPage] = useState(1);
  const [dataChangePage, setDataChangePage] = useState(1);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");
  const limit = 20;

  const { data: loginLogsData, isLoading: isLoadingLogin } = useQuery<LogResponse<LoginLog>>({
    queryKey: ["/api/admin/logs/login", loginPage],
    queryFn: async () => {
      const res = await fetch(`/api/admin/logs/login?page=${loginPage}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch login logs");
      return res.json();
    },
  });

  const { data: dataChangeLogsData, isLoading: isLoadingDataChange } = useQuery<LogResponse<DataChangeLog>>({
    queryKey: ["/api/admin/logs/data-change", dataChangePage, targetTypeFilter],
    queryFn: async () => {
      const typeParam = targetTypeFilter !== "all" ? `&targetType=${targetTypeFilter}` : "";
      const res = await fetch(`/api/admin/logs/data-change?page=${dataChangePage}&limit=${limit}${typeParam}`);
      if (!res.ok) throw new Error("Failed to fetch data change logs");
      return res.json();
    },
  });

  const loginTotalPages = Math.ceil((loginLogsData?.total || 0) / limit);
  const dataChangeTotalPages = Math.ceil((dataChangeLogsData?.total || 0) / limit);

  return (
    <DashboardLayout title="시스템 로그">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">시스템 로그 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">로그인 로그</TabsTrigger>
                <TabsTrigger value="data-change">데이터 변경 로그</TabsTrigger>
              </TabsList>

              {/* 로그인 로그 탭 */}
              <TabsContent value="login" className="mt-4">
                {isLoadingLogin ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">시간</TableHead>
                            <TableHead className="w-[80px]">이름</TableHead>
                            <TableHead>이메일</TableHead>
                            <TableHead className="w-[100px]">액션</TableHead>
                            <TableHead className="w-[120px]">IP</TableHead>
                            <TableHead className="w-[80px]">브라우저</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loginLogsData?.logs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                로그 데이터가 없습니다
                              </TableCell>
                            </TableRow>
                          ) : (
                            loginLogsData?.logs.map((log) => {
                              const Icon = actionIcons[log.action];
                              return (
                                <TableRow key={log.id}>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(log.createdAt), "MM/dd HH:mm:ss", { locale: ko })}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {log.userName || "-"}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {log.userEmail || log.userId}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${actionColors[log.action]} gap-1`}>
                                      <Icon className="h-3 w-3" />
                                      {actionLabels[log.action]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {log.ipAddress || "-"}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatUserAgent(log.userAgent)}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* 페이지네이션 */}
                    {loginTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          총 {loginLogsData?.total}건 중 {((loginPage - 1) * limit) + 1}-{Math.min(loginPage * limit, loginLogsData?.total || 0)}건
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLoginPage(p => Math.max(1, p - 1))}
                            disabled={loginPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            {loginPage} / {loginTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLoginPage(p => Math.min(loginTotalPages, p + 1))}
                            disabled={loginPage === loginTotalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* 데이터 변경 로그 탭 */}
              <TabsContent value="data-change" className="mt-4">
                {/* 필터 */}
                <div className="flex items-center gap-4 mb-4">
                  <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="대상 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="student">학생</SelectItem>
                      <SelectItem value="teacher">교사</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingDataChange ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">시간</TableHead>
                            <TableHead className="w-[120px]">수행자</TableHead>
                            <TableHead className="w-[80px]">액션</TableHead>
                            <TableHead className="w-[60px]">대상</TableHead>
                            <TableHead className="w-[100px]">이름</TableHead>
                            <TableHead>변경 내용</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dataChangeLogsData?.logs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                로그 데이터가 없습니다
                              </TableCell>
                            </TableRow>
                          ) : (
                            dataChangeLogsData?.logs.map((log) => {
                              const Icon = actionIcons[log.action];
                              return (
                                <TableRow key={log.id}>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(log.createdAt), "MM/dd HH:mm:ss", { locale: ko })}
                                  </TableCell>
                                  <TableCell className="font-medium text-sm">
                                    {log.userEmail || log.userId}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${actionColors[log.action]} gap-1`}>
                                      <Icon className="h-3 w-3" />
                                      {actionLabels[log.action]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {targetTypeLabels[log.targetType]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {log.targetName || "-"}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                                    {formatChanges(log.changes)}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* 페이지네이션 */}
                    {dataChangeTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          총 {dataChangeLogsData?.total}건 중 {((dataChangePage - 1) * limit) + 1}-{Math.min(dataChangePage * limit, dataChangeLogsData?.total || 0)}건
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDataChangePage(p => Math.max(1, p - 1))}
                            disabled={dataChangePage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            {dataChangePage} / {dataChangeTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDataChangePage(p => Math.min(dataChangeTotalPages, p + 1))}
                            disabled={dataChangePage === dataChangeTotalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
