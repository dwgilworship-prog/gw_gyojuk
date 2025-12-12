import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

const adminTabItems = [
  { title: "홈", url: "/", icon: LayoutDashboard },
  { title: "학생", url: "/students", icon: Users },
  { title: "목장", url: "/mokjangs", icon: BookOpen },
  { title: "출석", url: "/attendance", icon: UserCheck },
  { title: "결석", url: "/long-absence", icon: AlertTriangle },
];

const teacherTabItems = [
  { title: "홈", url: "/", icon: LayoutDashboard },
  { title: "학생", url: "/students", icon: Users },
  { title: "출석", url: "/attendance", icon: UserCheck },
];

export function MobileTabBar() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const tabItems = user.role === "admin" ? adminTabItems : teacherTabItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              data-testid={`tab-${item.url.replace("/", "") || "home"}`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
