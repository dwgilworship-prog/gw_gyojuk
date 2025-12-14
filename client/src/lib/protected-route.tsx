import { useAuth } from "@/hooks/use-auth";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: "admin" | "teacher";
}) {
  const { user, isLoading } = useAuth();

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

  return (
    <Route path={path}>
      <ChangePasswordModal />
      <Component />
    </Route>
  );
}
