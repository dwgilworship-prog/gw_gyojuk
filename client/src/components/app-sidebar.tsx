import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Settings,
  PieChart,
  ClipboardCheck,
  Building,
  AlertTriangle,
  Mail,
  BookOpen,
  UserCheck,
  BarChart3,
  LogOut,
  UserCog,
} from "lucide-react";

const adminMenuItems = [
  { title: "대시보드", url: "/", icon: LayoutDashboard },
  { title: "학생 관리", url: "/students", icon: Users },
  { title: "목장 관리", url: "/mokjangs", icon: BookOpen },
  { title: "출석 체크", url: "/attendance", icon: UserCheck },
  { title: "장기결석자", url: "/long-absence", icon: AlertTriangle },
  { title: "사역부서", url: "/ministries", icon: Users },
  { title: "통계/리포트", url: "/stats", icon: BarChart3 },
  { title: "문자 발송", url: "/sms", icon: Mail },
];

const teacherMenuItems = [
  { title: "대시보드", url: "/", icon: LayoutDashboard },
  { title: "내 목장 학생", url: "/students", icon: Users },
  { title: "출석 체크", url: "/attendance", icon: UserCheck },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const menuItems = user?.role === "admin" ? adminMenuItems : teacherMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-violet-indigo flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">GW</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">GIL WORSHIP</span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.role === "admin" ? "관리자" : "교사"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground truncate px-2">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-sidebar-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
