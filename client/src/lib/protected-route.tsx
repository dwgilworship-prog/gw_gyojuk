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
        <div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #4c1d95 100%)'
          }}
        >
          {/* 로고 컨테이너 */}
          <div
            className="w-[100px] h-[100px] rounded-[28px] flex items-center justify-center animate-pulse"
            style={{
              background: 'rgba(255,255,255,0.15)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <img
              src="/favicon_gw_final.png"
              alt="GIL Worship"
              className="w-[70px] h-[70px] rounded-[16px]"
            />
          </div>

          {/* 앱 이름 */}
          <h1 className="mt-6 text-2xl font-bold text-white tracking-tight">
            GIL Worship
          </h1>
          <p className="mt-2 text-sm text-white/70">
            청소년부 사역 관리
          </p>

          {/* 로딩 도트 */}
          <div className="mt-10 flex gap-2">
            <span className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <span className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
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
