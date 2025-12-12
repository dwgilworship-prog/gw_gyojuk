export const APP_NAME = "GIL WORSHIP";
export const APP_DESCRIPTION = "청소년부 사역 관리 플랫폼";

export const STUDENT_STATUS = {
  ACTIVE: { label: "재적", color: "success" },
  REST: { label: "휴식", color: "warning" },
  GRADUATED: { label: "졸업", color: "muted" },
} as const;

export const ATTENDANCE_STATUS = {
  ATTENDED: { label: "출석", color: "success", bgClass: "bg-green-500/20", textClass: "text-green-400", borderClass: "border-green-500/30" },
  LATE: { label: "지각", color: "warning", bgClass: "bg-amber-500/20", textClass: "text-amber-400", borderClass: "border-amber-500/30" },
  ABSENT: { label: "결석", color: "destructive", bgClass: "bg-red-500/20", textClass: "text-red-400", borderClass: "border-red-500/30" },
  EXCUSED: { label: "사유결석", color: "info", bgClass: "bg-blue-500/20", textClass: "text-blue-400", borderClass: "border-blue-500/30" },
} as const;

export const USER_ROLE = {
  admin: { label: "관리자", color: "primary" },
  teacher: { label: "교사", color: "secondary" },
} as const;

export const ADMIN_MENU_ITEMS = [
  { label: "대시보드", href: "/", icon: "LayoutDashboard" },
  { label: "학생 관리", href: "/students", icon: "Users" },
  { label: "교사 관리", href: "/teachers", icon: "GraduationCap" },
  { label: "목장 관리", href: "/mokjangs", icon: "Home" },
  { label: "출석 체크", href: "/attendance", icon: "CheckCircle" },
  { label: "보고서", href: "/reports", icon: "FileText" },
] as const;

export const TEACHER_MENU_ITEMS = [
  { label: "대시보드", href: "/", icon: "LayoutDashboard" },
  { label: "출석 체크", href: "/attendance", icon: "CheckCircle" },
  { label: "보고서", href: "/reports", icon: "FileText" },
] as const;

export const MOBILE_TAB_ITEMS = [
  { label: "홈", href: "/", icon: "Home" },
  { label: "출석", href: "/attendance", icon: "CheckCircle" },
  { label: "보고서", href: "/reports", icon: "FileText" },
  { label: "메뉴", href: "/menu", icon: "Menu" },
] as const;

export const GRADES = [
  "중1",
  "중2",
  "중3",
  "고1",
  "고2",
  "고3",
] as const;
