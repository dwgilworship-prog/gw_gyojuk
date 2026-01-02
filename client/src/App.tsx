import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineBanner } from "@/components/OfflineBanner";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Teachers from "@/pages/teachers";
import Mokjangs from "@/pages/mokjangs";
import Attendance from "@/pages/attendance";
import AttendanceDashboard from "@/pages/attendance-dashboard";
import LongAbsence from "@/pages/long-absence";
import Stats from "@/pages/stats";
import Ministries from "@/pages/ministries";
import SmsPage from "@/pages/sms-page";
import ReportDashboard from "@/pages/report-dashboard";
import AdminLogs from "@/pages/admin-logs";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* 모든 사용자 접근 가능 */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/students" component={Students} />
      <ProtectedRoute path="/attendance" component={Attendance} />

      {/* 관리자만 접근 가능 */}
      <ProtectedRoute path="/teachers" component={Teachers} requiredRole="admin" />
      <ProtectedRoute path="/mokjangs" component={Mokjangs} requiredRole="admin" />
      <ProtectedRoute path="/attendance-dashboard" component={AttendanceDashboard} requiredRole="admin" />
      <ProtectedRoute path="/long-absence" component={LongAbsence} requiredRole="admin" />
      <ProtectedRoute path="/stats" component={Stats} requiredRole="admin" />
      <ProtectedRoute path="/ministries" component={Ministries} requiredRole="admin" />
      <ProtectedRoute path="/sms" component={SmsPage} requiredRole="admin" />
      <ProtectedRoute path="/report-dashboard" component={ReportDashboard} requiredRole="admin" />

      {/* 히든 관리자 메뉴 (UI에서 링크 없음, URL 직접 접근만 가능) */}
      <ProtectedRoute path="/admin/logs" component={AdminLogs} requiredRole="admin" />

      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <OfflineBanner />
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
