import { useAuth } from "@/hooks/use-auth";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { Loader2, ShieldAlert, Clock, LogOut, RefreshCw } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: "admin" | "teacher";
}) {
  const { user, isLoading, logoutMutation } = useAuth();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground text-sm">로딩중...</span>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // 역할 기반 권한 체크
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>접근 권한이 없습니다</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                이 페이지는 관리자만 접근할 수 있습니다.
              </p>
              <Link href="/">
                <Button className="w-full">대시보드로 돌아가기</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Route>
    );
  }

  // 승인대기 상태 체크
  if (user.teacher && user.teacher.status === "pending") {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>승인 대기 중</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                회원가입이 완료되었습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                관리자의 승인이 완료되면 서비스를 이용하실 수 있습니다.
              </p>
              <div className="p-4 bg-muted rounded-lg text-left">
                <p className="text-sm font-medium mb-2">신청 정보</p>
                <p className="text-xs text-muted-foreground">이름: {user.teacher.name}</p>
                {user.teacher.phone && (
                  <p className="text-xs text-muted-foreground">연락처: {user.teacher.phone}</p>
                )}
                <p className="text-xs text-muted-foreground">이메일: {user.email}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                승인 관련 문의는 관리자에게 연락해주세요.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      <ChangePasswordModal />
      <Component />
    </Route>
  );
}
