import type { Student as DbStudent, AttendanceLog } from '@shared/schema';

// UI용 학생 타입
export interface UIStudent {
  id: string;
  name: string;
  grade: string;
  group: string;
  phone: string;
  parentPhone: string;
  streak: number;
  lastSeen: string;
  birthday: string;
  joinDate: string;
  school: string;
  isWarning: boolean;
  attendanceHistory: Record<string, string>;
}

// 출석 상태 변환 (DB → UI)
export function convertAttendanceStatus(status: string): string {
  switch (status) {
    case 'ATTENDED': return 'present';
    case 'LATE': return 'present'; // 지각도 출석으로 처리
    case 'ABSENT': return 'absent';
    case 'EXCUSED': return 'absent'; // 사유결석도 결석으로 처리
    default: return 'absent';
  }
}

// 출석 상태 변환 (UI → DB)
export function convertToDbStatus(status: string): 'ATTENDED' | 'ABSENT' {
  return status === 'present' ? 'ATTENDED' : 'ABSENT';
}

// DB 학생을 UI용 학생으로 변환
export function convertToUIStudent(
  dbStudent: DbStudent,
  mokjangName: string,
  attendanceLogs: AttendanceLog[]
): UIStudent {
  const birthDate = dbStudent.birth ? new Date(dbStudent.birth) : null;
  const birthday = birthDate
    ? `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`
    : '';

  const createdAt = dbStudent.createdAt ? new Date(dbStudent.createdAt) : null;
  const joinDate = createdAt
    ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
    : '';

  // 학생의 출석 기록 필터링 및 변환
  const studentLogs = attendanceLogs.filter(log => log.studentId === dbStudent.id);
  const attendanceHistory: Record<string, string> = {};
  studentLogs.forEach(log => {
    if (log.date) {
      attendanceHistory[log.date] = convertAttendanceStatus(log.status);
    }
  });

  // 연속 출석(streak) 계산 - 최근 일요일부터 역순으로
  let streak = 0;
  const sortedDates = Object.keys(attendanceHistory).sort((a, b) => b.localeCompare(a));
  for (const date of sortedDates) {
    if (attendanceHistory[date] === 'present') {
      streak++;
    } else {
      break;
    }
  }

  // 마지막 출석일 계산
  const lastPresentDate = sortedDates.find(date => attendanceHistory[date] === 'present');
  let lastSeen = '';
  if (lastPresentDate) {
    const lastDate = new Date(lastPresentDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      lastSeen = '지난주';
    } else if (diffDays <= 14) {
      lastSeen = '2주 전';
    } else if (diffDays <= 21) {
      lastSeen = '3주 전';
    } else {
      lastSeen = `${Math.floor(diffDays / 7)}주 전`;
    }
  }

  // 장기결석 여부 (3주 이상 연속 결석)
  let consecutiveAbsent = 0;
  for (const date of sortedDates) {
    if (attendanceHistory[date] === 'absent') {
      consecutiveAbsent++;
    } else {
      break;
    }
  }
  const isWarning = consecutiveAbsent >= 3;

  return {
    id: dbStudent.id,
    name: dbStudent.name,
    grade: dbStudent.grade || '',
    group: mokjangName,
    phone: dbStudent.phone || '',
    parentPhone: dbStudent.parentPhone || '',
    streak,
    lastSeen,
    birthday,
    joinDate,
    school: dbStudent.school || '',
    isWarning,
    attendanceHistory,
  };
}
