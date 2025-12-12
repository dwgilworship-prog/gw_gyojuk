import { format, startOfWeek, endOfWeek, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";

export function formatDate(date: Date | string, formatStr: string = "yyyy-MM-dd"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, formatStr, { locale: ko });
}

export function formatKoreanDate(date: Date | string): string {
  return formatDate(date, "yyyy년 M월 d일");
}

export function formatShortDate(date: Date | string): string {
  return formatDate(date, "M/d");
}

export function formatWeekday(date: Date | string): string {
  return formatDate(date, "EEEE");
}

export function getThisSunday(): Date {
  const today = new Date();
  const sunday = startOfWeek(today, { weekStartsOn: 0 });
  return sunday;
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 0 }),
    end: endOfWeek(date, { weekStartsOn: 0 }),
  };
}

export function getWeekLabel(date: Date): string {
  const { start, end } = getWeekRange(date);
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === "string" ? parseISO(birthDate) : birthDate;
  if (!isValid(birth)) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
