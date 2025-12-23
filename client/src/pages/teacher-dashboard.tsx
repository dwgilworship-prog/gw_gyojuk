import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Teacher, Mokjang, Student as DbStudent, AttendanceLog, Ministry, MinistryStudent } from '@shared/schema';

// ==================== 타입 정의 ====================
// UI용 학생 타입
interface UIStudent {
  id: string;
  name: string;
  grade: string;
  group: string;
  phone: string;
  parentPhone: string;
  streak: number;
  lastSeen: string;
  birthday: string;
  memo: string;
  joinDate: string;
  school: string;
  isWarning: boolean;
  attendanceHistory: Record<string, string>;
}

// 출석 상태 변환 (DB → UI)
function convertAttendanceStatus(status: string): string {
  switch (status) {
    case 'ATTENDED': return 'present';
    case 'LATE': return 'present'; // 지각도 출석으로 처리
    case 'ABSENT': return 'absent';
    case 'EXCUSED': return 'absent'; // 사유결석도 결석으로 처리
    default: return 'absent';
  }
}

// 출석 상태 변환 (UI → DB)
function convertToDbStatus(status: string): 'ATTENDED' | 'ABSENT' {
  return status === 'present' ? 'ATTENDED' : 'ABSENT';
}

// DB 학생을 UI용 학생으로 변환
function convertToUIStudent(
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
    memo: dbStudent.memo || '',
    joinDate,
    school: dbStudent.school || '',
    isWarning,
    attendanceHistory,
  };
}

// ==================== Confetti 컴포넌트 ====================
const Confetti = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 390;
    canvas.height = 844;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedY: number;
      speedX: number;
      rotation: number;
      rotationSpeed: number;
      shape: string;
    }> = [];
    const colors = ['#7c3aed', '#00C471', '#FF6B00', '#F04452', '#FFD700', '#4f46e5'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const timeout = setTimeout(() => {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 3000);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(timeout);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
};

// ==================== 도넛 차트 컴포넌트 ====================
const AttendanceDonut = ({ percentage, size = 80, strokeWidth = 8, color = '#7c3aed' }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E8EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <span style={{
        position: 'absolute',
        fontWeight: 800,
        fontSize: size * 0.2,
        color: color,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif',
      }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

// ==================== 스켈레톤 컴포넌트 ====================
const Skeleton = ({ width, height, borderRadius = 12, style = {} }: {
  width: string | number;
  height: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }}
  />
);

const SkeletonCard = () => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', gap: 14 }}>
    <Skeleton width={46} height={46} borderRadius={16} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={12} />
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <Skeleton width={48} height={48} borderRadius={14} />
      <Skeleton width={48} height={48} borderRadius={14} />
    </div>
  </div>
);

// ==================== 캘린더 컴포넌트 ====================
const CalendarModal = ({ isOpen, onClose, selectedDate, onSelectDate, students, selectedGroup }: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  students: UIStudent[];
  selectedGroup: string;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!isOpen) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const formatDateKey = (day: number | null) => {
    if (!day) return null;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getAttendanceStats = (dateKey: string | null) => {
    if (!dateKey) return null;
    const groupStudents = students.filter(s => s.group === selectedGroup);
    let present = 0, absent = 0;
    groupStudents.forEach(s => {
      if (s.attendanceHistory[dateKey] === 'present') present++;
      if (s.attendanceHistory[dateKey] === 'absent') absent++;
    });
    if (present === 0 && absent === 0) return null;
    return { present, absent, total: groupStudents.length };
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div style={styles.calendarOverlay} onClick={onClose}>
      <div style={styles.calendarModal} onClick={e => e.stopPropagation()}>
        <div style={styles.calendarHeader}>
          <button style={styles.calendarNavBtn} onClick={() => setCurrentMonth(new Date(year, month - 1))}>
            ←
          </button>
          <h3 style={styles.calendarTitle}>{year}년 {monthNames[month]}</h3>
          <button style={styles.calendarNavBtn} onClick={() => setCurrentMonth(new Date(year, month + 1))}>
            →
          </button>
        </div>

        <div style={styles.calendarDays}>
          {dayNames.map(day => (
            <div key={day} style={styles.calendarDayName}>{day}</div>
          ))}
        </div>

        <div style={styles.calendarGrid}>
          {days.map((day, idx) => {
            const dateKey = formatDateKey(day);
            const stats = getAttendanceStats(dateKey);
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;
            const isSunday = idx % 7 === 0;
            const isFuture = dateKey ? dateKey > todayKey : false;
            const isSelectable = isSunday && !isFuture;

            return (
              <div
                key={idx}
                style={{
                  ...styles.calendarCell,
                  cursor: day && isSelectable ? 'pointer' : 'default',
                  background: isSelected ? '#7c3aed' : isToday && isSunday ? '#ede9fe' : 'transparent',
                  color: isSelected ? '#FFF' : isFuture ? '#D1D6DB' : isSunday ? '#F04452' : '#D1D6DB',
                  opacity: day && (!isSunday || isFuture) ? 0.4 : 1,
                }}
                onClick={() => day && isSelectable && onSelectDate(dateKey!)}
              >
                {day && (
                  <>
                    <span style={{ fontSize: 15, fontWeight: isToday || isSelected ? 700 : 500 }}>{day}</span>
                    {stats && (
                      <div style={{
                        ...styles.calendarDot,
                        background: stats.present === stats.total ? '#00C471' : stats.absent > 0 ? '#FFB800' : '#E5E8EB',
                      }} />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={styles.calendarLegend}>
          <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#00C471' }} />전원출석</span>
          <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#FFB800' }} />결석있음</span>
          <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#E5E8EB' }} />기록없음</span>
        </div>

        <button style={styles.calendarCloseBtn} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

// ==================== 메인 컴포넌트 ====================
export default function TeacherDashboard() {
  const { user, logoutMutation } = useAuth();

  // 교사 정보 가져오기
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: myTeacher } = useQuery<Teacher | null>({
    queryKey: ["/api/teachers", "me"],
    queryFn: async () => {
      if (!teachers) return null;
      return teachers.find((t) => t.userId === user?.id) || null;
    },
    enabled: !!teachers && !!user,
  });

  // 내 목장 정보 가져오기
  const { data: myMokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/teachers", myTeacher?.id, "mokjangs"],
    queryFn: async () => {
      if (!myTeacher) return [];
      const res = await fetch(`/api/teachers/${myTeacher.id}/mokjangs`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!myTeacher,
  });

  // 내 목장의 학생 목록 가져오기
  const { data: dbStudents, isLoading: isStudentsLoading } = useQuery<DbStudent[]>({
    queryKey: ["/api/students", { mokjangIds: myMokjangs?.map(m => m.id) }],
    queryFn: async () => {
      if (!myMokjangs || myMokjangs.length === 0) return [];
      // 모든 목장의 학생을 가져옴
      const allStudents: DbStudent[] = [];
      for (const mokjang of myMokjangs) {
        const res = await fetch(`/api/students?mokjangId=${mokjang.id}`);
        if (res.ok) {
          const students = await res.json();
          allStudents.push(...students);
        }
      }
      return allStudents;
    },
    enabled: !!myMokjangs && myMokjangs.length > 0,
  });

  // 최근 3개월 출석 기록 가져오기
  const { data: attendanceLogs } = useQuery<AttendanceLog[]>({
    queryKey: ["/api/attendance", { mokjangIds: myMokjangs?.map(m => m.id) }],
    queryFn: async () => {
      if (!myMokjangs || myMokjangs.length === 0) return [];
      // 3개월 전부터 오늘까지
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const res = await fetch(`/api/attendance?startDate=${startStr}&endDate=${endStr}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!myMokjangs && myMokjangs.length > 0,
  });

  // 사역부서 정보 가져오기
  const { data: ministries } = useQuery<Ministry[]>({
    queryKey: ["/api/ministries"],
  });

  const { data: ministryMembers } = useQuery<{ students: MinistryStudent[] }>({
    queryKey: ["/api/ministry-members"],
  });

  // 학생의 사역부서 목록 가져오기
  const getStudentMinistries = useCallback((studentId: string) => {
    if (!ministryMembers || !ministries) return [];
    const assignedIds = ministryMembers.students
      .filter(ms => ms.studentId === studentId)
      .map(ms => ms.ministryId);
    return ministries.filter(m => assignedIds.includes(m.id)).map(m => m.name);
  }, [ministryMembers, ministries]);

  // DB 학생을 UI용으로 변환 (출석 기록 포함)
  const students: UIStudent[] = useMemo(() => {
    if (!dbStudents || !myMokjangs) return [];
    const logs = attendanceLogs || [];
    return dbStudents.map(s => {
      const mokjang = myMokjangs.find(m => m.id === s.mokjangId);
      return convertToUIStudent(s, mokjang?.name || '', logs);
    });
  }, [dbStudents, myMokjangs, attendanceLogs]);

  // teacherInfo 동적 생성
  const teacherInfo = {
    name: myTeacher?.name || '',
    group: myMokjangs?.[0]?.name || '',
  };

  const [currentView, setCurrentView] = useState('home');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<UIStudent | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [sheetClosing, setSheetClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // 로컬 출석 상태 (저장 버튼 누를 때까지 서버와 동기화하지 않음)
  // key: "studentId_date", value: 'present' | 'absent' | null (null은 삭제 의미)
  const [localAttendance, setLocalAttendance] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 데이터 로딩 상태 (실제 API 로딩 상태 사용)
  const isDataLoading = isStudentsLoading;

  // 선택된 날짜 (기본: 이번 주 주일)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - dayOfWeek); // 이번 주 일요일로 설정

  const [selectedDate, setSelectedDate] = useState(
    `${thisSunday.getFullYear()}-${String(thisSunday.getMonth() + 1).padStart(2, '0')}-${String(thisSunday.getDate()).padStart(2, '0')}`
  );

  // 목장 정보 로드되면 기본 선택
  useEffect(() => {
    if (myMokjangs && myMokjangs.length > 0 && !selectedGroup) {
      setSelectedGroup(myMokjangs[0].name);
    }
  }, [myMokjangs, selectedGroup]);

  // 선택된 날짜 또는 목장이 변경되면 로컬 출석 상태 초기화
  useEffect(() => {
    setLocalAttendance({});
  }, [selectedDate, selectedGroup]);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // 햅틱 피드백
  const triggerHaptic = useCallback((duration = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }, []);

  const todayDate = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const selectedDateDisplay = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const todayMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const todayDay = String(new Date().getDate()).padStart(2, '0');

  const myGroupStudents = students.filter(s => s.group === teacherInfo.group);
  const filteredStudents = students.filter(s => s.group === selectedGroup);

  // 선택된 날짜의 출석 상태 가져오기 (로컬 상태 우선)
  const getAttendanceForDate = (student: UIStudent) => {
    const localKey = `${student.id}_${selectedDate}`;
    // 로컬 상태에 해당 학생의 출석 정보가 있으면 그것을 사용
    if (localKey in localAttendance) {
      return localAttendance[localKey]; // null이면 '미체크' 상태
    }
    // 로컬 상태에 없으면 서버 데이터 사용
    return student.attendanceHistory[selectedDate] || null;
  };

  const checkedCount = filteredStudents.filter(s => getAttendanceForDate(s) !== null).length;
  const presentCount = filteredStudents.filter(s => getAttendanceForDate(s) === 'present').length;
  const absentCount = filteredStudents.filter(s => getAttendanceForDate(s) === 'absent').length;
  const totalCount = filteredStudents.length;
  const progress = totalCount === 0 ? 0 : (checkedCount / totalCount) * 100;

  const groups = Array.from(new Set(students.map(s => s.group)));

  // 이번달 생일자
  const birthdayStudents = myGroupStudents.filter(s => s.birthday.startsWith(todayMonth));

  // 오늘 생일자
  const todayBirthdayStudents = myGroupStudents.filter(s => s.birthday === `${todayMonth}-${todayDay}`);

  // 장기결석자
  const warningStudents = students.filter(s => s.isWarning && s.group === teacherInfo.group);

  // 4주 연속 출석 학생
  const streakStudents = myGroupStudents.filter(s => s.streak >= 4);

  // 출석률 계산 (이번달)
  const calculateMonthlyAttendance = () => {
    let totalPresent = 0;
    let totalRecords = 0;

    myGroupStudents.forEach(student => {
      Object.entries(student.attendanceHistory).forEach(([date, status]) => {
        if (date.startsWith(`${today.getFullYear()}-${todayMonth}`)) {
          totalRecords++;
          if (status === 'present') totalPresent++;
        }
      });
    });

    return totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
  };

  // 학생 검색 및 필터
  const getFilteredStudentList = () => {
    let list = myGroupStudents;

    if (searchQuery) {
      list = list.filter(s =>
        s.name.includes(searchQuery) ||
        s.phone.includes(searchQuery) ||
        s.grade.includes(searchQuery)
      );
    }

    if (studentFilter === 'warning') {
      list = list.filter(s => s.isWarning);
    } else if (studentFilter === 'streak') {
      list = list.filter(s => s.streak >= 4);
    }

    return list;
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // 출석 저장 mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: { studentId: string; date: string; status: 'ATTENDED' | 'ABSENT' }) => {
      const res = await apiRequest('POST', '/api/attendance', [data]);
      return res.json();
    },
    onSuccess: () => {
      // 출석 기록 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
  });

  // 출석 삭제 mutation
  const deleteAttendanceMutation = useMutation({
    mutationFn: async (data: { studentId: string; date: string }) => {
      console.log('출석 삭제 요청:', data);
      const res = await apiRequest('DELETE', '/api/attendance', data);
      console.log('출석 삭제 응답:', res.status);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      showToastMessage('출석이 취소되었어요');
    },
    onError: (error) => {
      console.error('출석 삭제 에러:', error);
      showToastMessage('출석 취소에 실패했어요');
    },
  });

  // 메모 저장 mutation
  const memoMutation = useMutation({
    mutationFn: async (data: { studentId: string; memo: string }) => {
      console.log('메모 저장 요청:', data);
      const res = await apiRequest('PATCH', `/api/students/${data.studentId}`, { memo: data.memo });
      const result = await res.json();
      console.log('메모 저장 응답:', result);
      return result;
    },
    onSuccess: () => {
      // 내 목장 학생 데이터만 새로고침
      queryClient.invalidateQueries({
        queryKey: ["/api/students", { mokjangIds: myMokjangs?.map(m => m.id) }]
      });
      showToastMessage('메모가 저장되었어요');
    },
    onError: (error) => {
      console.error('메모 저장 에러:', error);
      showToastMessage('메모 저장에 실패했어요');
    },
  });

  // 메모 debounce를 위한 ref
  const memoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAttendance = (e: React.MouseEvent, studentId: string, status: string) => {
    e.stopPropagation();
    triggerHaptic(15);

    const localKey = `${studentId}_${selectedDate}`;

    // 현재 표시 중인 출석 상태 확인 (로컬 상태 우선)
    const student = students.find(s => s.id === studentId);
    const currentDisplayStatus = localKey in localAttendance
      ? localAttendance[localKey]
      : student?.attendanceHistory[selectedDate] || null;

    console.log('handleAttendance:', { studentId, status, currentDisplayStatus, selectedDate });

    // 같은 상태를 다시 클릭하면 출석 취소 (로컬에서만)
    if (currentDisplayStatus === status) {
      console.log('같은 상태 클릭 - 로컬 상태에서 삭제');
      setLocalAttendance(prev => ({
        ...prev,
        [localKey]: null,  // null = 미체크 상태
      }));
      return;
    }

    // 다른 상태를 클릭하면 해당 상태로 로컬 변경
    console.log('로컬 상태 업데이트:', status);
    setLocalAttendance(prev => ({
      ...prev,
      [localKey]: status,
    }));
  };

  // 변경사항 있는지 확인
  const hasChanges = useMemo(() => {
    return Object.keys(localAttendance).length > 0;
  }, [localAttendance]);

  const handleSave = async () => {
    triggerHaptic(30);

    // 변경사항이 없으면 바로 완료 처리
    if (!hasChanges) {
      if (checkedCount === totalCount) {
        setShowConfetti(true);
        showToastMessage('출석 완료! 수고하셨어요!');
        setTimeout(() => setShowConfetti(false), 3500);
      } else {
        showToastMessage('변경사항이 없어요');
      }
      return;
    }

    // 변경사항을 서버에 저장
    setIsSaving(true);
    const attendanceToSave: Array<{ studentId: string; date: string; status: 'ATTENDED' | 'ABSENT' }> = [];
    const attendanceToDelete: Array<{ studentId: string; date: string }> = [];

    for (const [key, status] of Object.entries(localAttendance)) {
      const [studentId, date] = key.split('_');
      const student = students.find(s => s.id === studentId);
      const originalStatus = student?.attendanceHistory[date] || null;

      if (status === null) {
        // null이면 삭제 (원래 데이터가 있었던 경우에만)
        if (originalStatus !== null) {
          attendanceToDelete.push({ studentId, date });
        }
      } else {
        // 출석/결석 저장
        attendanceToSave.push({
          studentId,
          date,
          status: convertToDbStatus(status),
        });
      }
    }

    try {
      // 삭제 요청
      for (const item of attendanceToDelete) {
        await apiRequest('DELETE', '/api/attendance', item);
      }

      // 저장 요청 (배치로 한 번에)
      if (attendanceToSave.length > 0) {
        await apiRequest('POST', '/api/attendance', attendanceToSave);
      }

      // 성공 시 로컬 상태 초기화 및 서버 데이터 새로고침
      setLocalAttendance({});
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });

      if (checkedCount === totalCount) {
        setShowConfetti(true);
        showToastMessage('출석 완료! 수고하셨어요!');
        setTimeout(() => setShowConfetti(false), 3500);
      } else {
        showToastMessage('출석이 저장되었어요');
      }
    } catch (error) {
      console.error('출석 저장 에러:', error);
      showToastMessage('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyReport = () => {
    triggerHaptic();
    const presentList = filteredStudents.filter(s => getAttendanceForDate(s) === 'present').map(s => s.name).join(', ');
    const absentList = filteredStudents.filter(s => getAttendanceForDate(s) === 'absent').map(s => s.name).join(', ');
    const uncheckedList = filteredStudents.filter(s => getAttendanceForDate(s) === null).map(s => s.name).join(', ');

    let reportText = `${selectedGroup} 출석 보고\n${selectedDateDisplay}\n\n`;
    reportText += `출석 ${presentCount}명\n${presentList || '(없음)'}\n\n`;
    reportText += `결석 ${absentCount}명\n${absentList || '(없음)'}`;
    if (uncheckedList) {
      reportText += `\n\n미확인 ${filteredStudents.filter(s => getAttendanceForDate(s) === null).length}명\n${uncheckedList}`;
    }

    navigator.clipboard.writeText(reportText);
    showToastMessage('클립보드에 복사했어요');
  };

  const handleMemoChange = (id: string, text: string) => {
    console.log('handleMemoChange 호출:', { id, text });

    // 로컬 상태 즉시 업데이트 (UI 반응성)
    if (selectedStudent && selectedStudent.id === id) {
      setSelectedStudent(prev => prev ? { ...prev, memo: text } : null);
    }

    // 기존 타이머 취소
    if (memoTimeoutRef.current) {
      clearTimeout(memoTimeoutRef.current);
    }

    // 1초 후 API 호출 (debounce)
    memoTimeoutRef.current = setTimeout(() => {
      console.log('debounce 완료, API 호출:', { id, text });
      memoMutation.mutate({ studentId: id, memo: text });
    }, 1000);
  };

  const closeSheet = () => {
    setSheetClosing(true);
    setTimeout(() => {
      setSelectedStudent(null);
      setSheetClosing(false);
    }, 250);
  };

  const handleCopyPhone = (phone: string) => {
    triggerHaptic();
    navigator.clipboard.writeText(phone.replace(/-/g, ''));
    showToastMessage('번호가 복사되었어요');
  };

  // ==================== 렌더링 ====================

  // 홈 화면
  const renderHome = () => (
    <div style={styles.container}>
      <header style={styles.homeHeader}>
        <div style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <p style={styles.dateChip}>{todayDate}</p>
          <h1 style={styles.mainGreeting}>
            {teacherInfo.name} 선생님,
            <br />
            <span style={styles.greetingSub}>
              {todayBirthdayStudents.length > 0
                ? `오늘 ${todayBirthdayStudents[0].name} 생일이에요`
                : '오늘도 함께해요'}
            </span>
          </h1>
        </div>
      </header>

      {/* 출석 CTA */}
      <section style={{
        ...styles.ctaSection,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
      }}>
        <div style={styles.ctaCard} onClick={() => { triggerHaptic(); setCurrentView('attendance'); }}>
          <div style={styles.ctaLeft}>
            <div style={styles.ctaIconWrap}>
              <span style={styles.ctaIcon}>✓</span>
            </div>
            <div>
              <p style={styles.ctaTitle}>출석 체크</p>
              <p style={styles.ctaDesc}>{teacherInfo.group} · {myGroupStudents.length}명</p>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* 관심 필요 학생 */}
      {warningStudents.length > 0 && (
        <section style={{
          ...styles.section,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
        }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitleInline}>관심이 필요해요</h2>
            <span style={styles.badge}>{warningStudents.length}</span>
          </div>
          <div style={styles.cardList}>
            {warningStudents.map(student => (
              <div key={student.id} style={styles.alertCard} onClick={() => setSelectedStudent(student)}>
                <div style={styles.alertAvatar}>{student.name.charAt(0)}</div>
                <div style={styles.alertInfo}>
                  <p style={styles.alertName}>{student.name}</p>
                  <p style={styles.alertMeta}>{student.lastSeen} 이후 결석</p>
                </div>
                <a href={`tel:${student.phone}`} style={styles.callBtn} onClick={e => e.stopPropagation()}>
                  📞
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 이번 달 생일 */}
      {birthdayStudents.length > 0 && (
        <section style={{
          ...styles.section,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
        }}>
          <h2 style={styles.sectionTitle}>이번 달 생일</h2>
          <div style={styles.cardList}>
            {birthdayStudents.map(student => {
              const [month, day] = student.birthday.split('-');
              const isToday = student.birthday === `${todayMonth}-${todayDay}`;
              return (
                <div key={student.id} style={{
                  ...styles.birthdayCard,
                  background: isToday ? 'linear-gradient(135deg, #FFF9E6 0%, #FFF3CD 100%)' : '#FFFFFF',
                  border: isToday ? '1px solid #FFE69C' : '1px solid #F2F4F6',
                }}>
                  <div style={styles.birthdayLeft}>
                    <span style={styles.birthdayEmoji}>{isToday ? '🎉' : '🎂'}</span>
                    <div>
                      <p style={styles.birthdayName}>{student.name}</p>
                      <p style={styles.birthdayDate}>{parseInt(month)}월 {parseInt(day)}일{isToday && ' (오늘!)'}</p>
                    </div>
                  </div>
                  <a href={`sms:${student.phone}`} style={styles.miniBtn}>축하 💌</a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 우리 목장 현황 - 도넛 차트 포함 */}
      <section style={{
        ...styles.section,
        paddingBottom: 120,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
      }}>
        <h2 style={styles.sectionTitle}>우리 목장</h2>

        {/* 도넛 차트 통계 */}
        <div style={styles.donutStatsWrap}>
          <div style={styles.donutSection}>
            <AttendanceDonut
              percentage={calculateMonthlyAttendance()}
              size={90}
              strokeWidth={10}
              color="#7c3aed"
            />
            <p style={styles.donutLabel}>이번달 출석률</p>
          </div>
          <div style={styles.donutDivider} />
          <div style={styles.miniStats}>
            <div style={styles.miniStatRow}>
              <span style={styles.miniStatIcon}>👥</span>
              <span style={styles.miniStatLabel}>전체</span>
              <span style={styles.miniStatValue}>{myGroupStudents.length}명</span>
            </div>
            <div style={styles.miniStatRow}>
              <span style={styles.miniStatIcon}>🔥</span>
              <span style={styles.miniStatLabel}>4주 연속</span>
              <span style={{ ...styles.miniStatValue, color: '#FF6B00' }}>{streakStudents.length}명</span>
            </div>
            <div style={styles.miniStatRow}>
              <span style={styles.miniStatIcon}>⚠️</span>
              <span style={styles.miniStatLabel}>장기결석</span>
              <span style={{ ...styles.miniStatValue, color: '#F04452' }}>{warningStudents.length}명</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // 출석 화면
  const renderAttendance = () => (
    <div style={styles.container}>
      <Confetti active={showConfetti} />

      <header style={styles.attHeader}>
        <button style={styles.backBtn} onClick={() => setCurrentView('home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={styles.attHeaderCenter}>
          <h1 style={styles.attTitle}>출석 체크</h1>
          <button
            style={styles.datePickerBtn}
            onClick={() => setShowCalendar(true)}
          >
            {selectedDateDisplay}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 4 }}>
              <path d="M4 6l4 4 4-4" stroke="#8B95A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <button style={styles.headerBtn} onClick={handleCopyReport} disabled={checkedCount === 0}>
          📋
        </button>
      </header>

      {/* 목장 탭 */}
      <div style={styles.tabWrap}>
        {groups.map(group => (
          <button
            key={group}
            style={selectedGroup === group ? styles.tabActive : styles.tab}
            onClick={() => { triggerHaptic(); setSelectedGroup(group); }}
          >
            {group}
          </button>
        ))}
      </div>

      {/* 진행 상황 */}
      <div style={styles.progressWrap}>
        <div style={styles.progressInfo}>
          <span style={styles.progressLabel}>
            <strong style={{ color: '#7c3aed' }}>{checkedCount}</strong> / {totalCount}명 완료
          </span>
          <span style={styles.progressSummary}>
            출석 {presentCount} · 결석 {absentCount}
          </span>
        </div>
        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressBar,
            width: `${progress}%`,
            background: progress === 100 ? '#00C471' : '#7c3aed',
          }} />
        </div>
      </div>

      {/* 학생 목록 */}
      <div style={styles.studentList}>
        {isDataLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          filteredStudents.map((student, i) => {
            const attendance = getAttendanceForDate(student);
            return (
              <div
                key={student.id}
                style={{
                  ...styles.studentCard,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateX(0)' : 'translateX(-12px)',
                  transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.03}s`,
                }}
                onClick={() => setSelectedStudent(student)}
              >
                <div style={styles.studentLeft}>
                  <div style={{
                    ...styles.studentAvatar,
                    background: attendance === 'present'
                      ? '#ede9fe'
                      : attendance === 'absent'
                        ? '#FFEFEF'
                        : '#F5F6F8',
                    color: attendance === 'present'
                      ? '#7c3aed'
                      : attendance === 'absent'
                        ? '#F04452'
                        : '#8B95A1',
                  }}>
                    {student.name.charAt(0)}
                  </div>
                  <div style={styles.studentInfo}>
                    <div style={styles.studentNameWrap}>
                      <span style={styles.studentName}>{student.name}</span>
                      {student.streak >= 4 && <span style={styles.streakBadge}>🔥{student.streak}</span>}
                      {student.isWarning && <span style={styles.warnBadge}>⚠️</span>}
                    </div>
                    <span style={styles.studentSub}>{student.grade} · {student.phone}</span>
                  </div>
                </div>
                <div style={styles.attendBtns}>
                  <button
                    style={{
                      ...styles.attBtn,
                      background: attendance === 'present' ? '#ede9fe' : '#F5F6F8',
                      transform: attendance === 'present' ? 'scale(1.05)' : 'scale(1)',
                      color: attendance === 'present' ? '#7c3aed' : '#8B95A1',
                    }}
                    onClick={(e) => handleAttendance(e, student.id, 'present')}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600 }}>출석</span>
                  </button>
                  <button
                    style={{
                      ...styles.attBtn,
                      background: attendance === 'absent' ? '#FFEFEF' : '#F5F6F8',
                      transform: attendance === 'absent' ? 'scale(1.05)' : 'scale(1)',
                      color: attendance === 'absent' ? '#F04452' : '#8B95A1',
                    }}
                    onClick={(e) => handleAttendance(e, student.id, 'absent')}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600 }}>결석</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 저장 버튼 */}
      <div style={styles.bottomFixed}>
        <button
          style={{
            ...styles.saveBtn,
            background: checkedCount === totalCount
              ? (hasChanges ? '#7c3aed' : '#00C471')
              : '#ADB5BD',
            transform: checkedCount === totalCount ? 'scale(1)' : 'scale(0.98)',
            opacity: isSaving ? 0.7 : 1,
            cursor: (isSaving || checkedCount !== totalCount) ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSave}
          disabled={isSaving || checkedCount !== totalCount}
        >
          {isSaving
            ? '저장 중...'
            : checkedCount !== totalCount
              ? `${totalCount - checkedCount}명 남음`
              : hasChanges
                ? '저장하기'
                : '저장 완료 ✓'}
        </button>
      </div>

      {/* 캘린더 모달 */}
      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setShowCalendar(false);
          triggerHaptic();
        }}
        students={students}
        selectedGroup={selectedGroup}
      />
    </div>
  );

  // 학생 목록 화면
  const renderStudentList = () => {
    const studentList = getFilteredStudentList();

    return (
      <div style={styles.container}>
        <header style={styles.studentListHeader}>
          <h1 style={styles.studentListTitle}>내 학생</h1>
          <p style={styles.studentListSub}>{teacherInfo.group} · {myGroupStudents.length}명</p>
        </header>

        {/* 검색바 */}
        <div style={styles.searchWrap}>
          <div style={styles.searchBox}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="9" cy="9" r="6" stroke="#8B95A1" strokeWidth="2" />
              <path d="M13.5 13.5L17 17" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="이름, 연락처로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button style={styles.clearBtn} onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 필터 칩 */}
        <div style={styles.filterChips}>
          <button
            style={studentFilter === 'all' ? styles.chipActive : styles.chip}
            onClick={() => { triggerHaptic(); setStudentFilter('all'); }}
          >
            전체 {myGroupStudents.length}
          </button>
          <button
            style={studentFilter === 'streak' ? styles.chipActive : styles.chip}
            onClick={() => { triggerHaptic(); setStudentFilter('streak'); }}
          >
            🔥 4주 연속 {myGroupStudents.filter(s => s.streak >= 4).length}
          </button>
          <button
            style={studentFilter === 'warning' ? styles.chipActive : styles.chip}
            onClick={() => { triggerHaptic(); setStudentFilter('warning'); }}
          >
            ⚠️ 장기결석 {myGroupStudents.filter(s => s.isWarning).length}
          </button>
        </div>

        {/* 학생 목록 */}
        <div style={styles.studentListWrap}>
          {isDataLoading ? (
            <>
              <div style={{ padding: '16px', background: '#FFF', borderRadius: 18, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <Skeleton width={50} height={50} borderRadius={18} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="50%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="30%" height={12} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px', background: '#FFF', borderRadius: 18, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <Skeleton width={50} height={50} borderRadius={18} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="35%" height={12} />
                  </div>
                </div>
              </div>
            </>
          ) : studentList.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>🔍</span>
              <p style={styles.emptyText}>검색 결과가 없어요</p>
            </div>
          ) : (
            studentList.map((student, i) => (
              <div
                key={student.id}
                style={{
                  ...styles.studentListCard,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(12px)',
                  transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s`,
                }}
                onClick={() => setSelectedStudent(student)}
              >
                <div style={styles.studentListLeft}>
                  <div style={{
                    ...styles.studentListAvatar,
                    background: student.isWarning
                      ? '#FFEFEF'
                      : student.streak >= 4
                        ? '#ede9fe'
                        : '#F5F6F8',
                    color: student.isWarning
                      ? '#F04452'
                      : student.streak >= 4
                        ? '#7c3aed'
                        : '#6B7684',
                  }}>
                    {student.name.charAt(0)}
                  </div>
                  <div style={styles.studentListInfo}>
                    <div style={styles.studentListNameRow}>
                      <span style={styles.studentListName}>{student.name}</span>
                      {student.streak >= 4 && <span style={styles.streakBadge}>🔥{student.streak}주</span>}
                      {student.isWarning && <span style={styles.warnTag}>장기결석</span>}
                    </div>
                    <span style={styles.studentListMeta}>{student.grade} · {student.phone}</span>
                    {student.memo && (
                      <p style={styles.studentListMemo}>📝 {student.memo}</p>
                    )}
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4l6 6-6 6" stroke="#D1D6DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))
          )}
        </div>

        <div style={{ height: 100 }} />
      </div>
    );
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    triggerHaptic(20);
    logoutMutation.mutate();
  };

  // 설정 화면
  const renderSettings = () => (
    <div style={styles.container}>
      <header style={styles.settingsHeader}>
        <h1 style={styles.settingsTitle}>내 정보</h1>
      </header>

      {/* 프로필 섹션 */}
      <section style={{
        ...styles.settingsSection,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
      }}>
        <div style={styles.profileCard}>
          <div style={styles.profileAvatar}>
            {teacherInfo.name.charAt(0) || '?'}
          </div>
          <div style={styles.profileInfo}>
            <h2 style={styles.profileName}>{teacherInfo.name} 선생님</h2>
            <p style={styles.profileMeta}>{teacherInfo.group || '목장 미배정'}</p>
          </div>
        </div>
      </section>

      {/* 계정 정보 */}
      <section style={{
        ...styles.settingsSection,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
      }}>
        <h3 style={styles.settingsSectionTitle}>계정 정보</h3>
        <div style={styles.settingsCard}>
          <div style={styles.settingsRow}>
            <span style={styles.settingsLabel}>이메일</span>
            <span style={styles.settingsValue}>{user?.email || '-'}</span>
          </div>
          <div style={styles.settingsDivider} />
          <div style={styles.settingsRow}>
            <span style={styles.settingsLabel}>담당 목장</span>
            <span style={styles.settingsValue}>{teacherInfo.group || '-'}</span>
          </div>
          <div style={styles.settingsDivider} />
          <div style={styles.settingsRow}>
            <span style={styles.settingsLabel}>담당 학생</span>
            <span style={styles.settingsValue}>{myGroupStudents.length}명</span>
          </div>
        </div>
      </section>

      {/* 통계 정보 */}
      <section style={{
        ...styles.settingsSection,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
      }}>
        <h3 style={styles.settingsSectionTitle}>이번 달 현황</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <span style={styles.statIcon}>📊</span>
            <span style={styles.statValue}>{Math.round(calculateMonthlyAttendance())}%</span>
            <span style={styles.statLabel}>출석률</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statIcon}>🔥</span>
            <span style={styles.statValue}>{streakStudents.length}</span>
            <span style={styles.statLabel}>4주 연속</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statIcon}>⚠️</span>
            <span style={styles.statValue}>{warningStudents.length}</span>
            <span style={styles.statLabel}>장기결석</span>
          </div>
        </div>
      </section>

      {/* 로그아웃 버튼 */}
      <section style={{
        ...styles.settingsSection,
        paddingBottom: 120,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
      }}>
        <button
          style={styles.logoutBtn}
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
        </button>
        <p style={styles.versionText}>버전 1.0.0</p>
      </section>
    </div>
  );

  // 바텀시트
  const renderBottomSheet = () => {
    if (!selectedStudent) return null;

    const [month, day] = selectedStudent.birthday.split('-');

    // 최근 출석 기록
    const recentAttendance = Object.entries(selectedStudent.attendanceHistory)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 4);

    return (
      <div
        style={{
          ...styles.overlay,
          opacity: sheetClosing ? 0 : 1,
        }}
        onClick={closeSheet}
      >
        <div
          style={{
            ...styles.sheet,
            transform: sheetClosing ? 'translateY(100%)' : 'translateY(0)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={styles.sheetHandle} />

          {/* 프로필 */}
          <div style={styles.sheetProfile}>
            <div style={{
              ...styles.sheetAvatar,
              background: selectedStudent.isWarning
                ? 'linear-gradient(135deg, #FFEFEF 0%, #FFE0E0 100%)'
                : 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
              color: selectedStudent.isWarning ? '#F04452' : '#7c3aed',
            }}>
              {selectedStudent.name.charAt(0)}
            </div>
            <h2 style={styles.sheetName}>{selectedStudent.name}</h2>
            <p style={styles.sheetMeta}>{selectedStudent.grade} · {selectedStudent.group}</p>
            <div style={styles.sheetBadges}>
              {selectedStudent.streak >= 4 && (
                <span style={styles.sheetStreak}>🔥 {selectedStudent.streak}주 연속 출석</span>
              )}
              {selectedStudent.isWarning && (
                <span style={styles.sheetWarning}>⚠️ {selectedStudent.lastSeen} 이후 결석</span>
              )}
            </div>
          </div>

          {/* 최근 출석 기록 */}
          {recentAttendance.length > 0 && (
            <div style={styles.recentAttendanceWrap}>
              <p style={styles.recentAttendanceTitle}>최근 출석</p>
              <div style={styles.recentAttendanceList}>
                {recentAttendance.map(([date, status]) => {
                  const d = new Date(date + 'T00:00:00');
                  return (
                    <div key={date} style={styles.recentAttendanceItem}>
                      <span style={styles.recentAttendanceDate}>
                        {d.getMonth() + 1}/{d.getDate()}
                      </span>
                      <span style={{
                        ...styles.recentAttendanceStatus,
                        background: status === 'present' ? '#ede9fe' : '#FFEFEF',
                        color: status === 'present' ? '#7c3aed' : '#F04452',
                      }}>
                        {status === 'present' ? '출석' : '결석'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 정보 카드 */}
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>생년월일</span>
              <span style={styles.infoValue}>{parseInt(month)}월 {parseInt(day)}일</span>
            </div>
            {selectedStudent.school && (
              <>
                <div style={styles.infoDivider} />
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>학교</span>
                  <span style={styles.infoValue}>{selectedStudent.school}</span>
                </div>
              </>
            )}
            <div style={styles.infoDivider} />
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>등록일</span>
              <span style={styles.infoValue}>{selectedStudent.joinDate}</span>
            </div>
            {getStudentMinistries(selectedStudent.id).length > 0 && (
              <>
                <div style={styles.infoDivider} />
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>사역부서</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {getStudentMinistries(selectedStudent.id).map((name, i) => (
                      <span key={i} style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: '#ede9fe',
                        color: '#7c3aed',
                      }}>{name}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 액션 버튼 */}
          <div style={styles.sheetActions}>
            <a href={`tel:${selectedStudent.phone}`} style={styles.sheetActionBtn}>
              <span style={styles.sheetActionIcon}>📞</span>
              <span style={styles.sheetActionLabel}>전화</span>
              <span style={styles.sheetActionSub}>학생</span>
            </a>
            <a href={`sms:${selectedStudent.phone}`} style={styles.sheetActionBtn}>
              <span style={styles.sheetActionIcon}>💬</span>
              <span style={styles.sheetActionLabel}>문자</span>
              <span style={styles.sheetActionSub}>학생</span>
            </a>
            <a href={`tel:${selectedStudent.parentPhone}`} style={styles.sheetActionBtn}>
              <span style={styles.sheetActionIcon}>👨‍👩‍👧</span>
              <span style={styles.sheetActionLabel}>전화</span>
              <span style={styles.sheetActionSub}>학부모</span>
            </a>
            <div style={styles.sheetActionBtn} onClick={() => handleCopyPhone(selectedStudent.phone)}>
              <span style={styles.sheetActionIcon}>📋</span>
              <span style={styles.sheetActionLabel}>복사</span>
              <span style={styles.sheetActionSub}>번호</span>
            </div>
          </div>

          {/* 메모 */}
          <div style={styles.sheetMemoWrap}>
            <label style={styles.sheetMemoLabel}>메모 / 기도제목</label>
            <textarea
              style={styles.sheetMemoInput}
              placeholder="이 학생을 위한 기도제목이나 특이사항을 적어주세요"
              value={selectedStudent.memo || ''}
              onChange={(e) => handleMemoChange(selectedStudent.id, e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  };

  // 네비게이션
  const renderNav = () => (
    <nav style={styles.nav}>
      <button
        style={currentView === 'home' ? styles.navBtnActive : styles.navBtn}
        onClick={() => { triggerHaptic(); setCurrentView('home'); }}
      >
        <span style={{ fontSize: 22 }}>🏠</span>
        <span style={styles.navLabel}>홈</span>
      </button>
      <button
        style={currentView === 'attendance' ? styles.navBtnActive : styles.navBtn}
        onClick={() => { triggerHaptic(); setCurrentView('attendance'); }}
      >
        <span style={{ fontSize: 22 }}>✅</span>
        <span style={styles.navLabel}>출석</span>
      </button>
      <button
        style={currentView === 'students' ? styles.navBtnActive : styles.navBtn}
        onClick={() => { triggerHaptic(); setCurrentView('students'); }}
      >
        <span style={{ fontSize: 22 }}>👥</span>
        <span style={styles.navLabel}>학생</span>
      </button>
      <button
        style={currentView === 'settings' ? styles.navBtnActive : styles.navBtn}
        onClick={() => { triggerHaptic(); setCurrentView('settings'); }}
      >
        <span style={{ fontSize: 22 }}>⚙️</span>
        <span style={styles.navLabel}>설정</span>
      </button>
    </nav>
  );

  // 토스트
  const renderToast = () => (
    <div style={{
      ...styles.toast,
      opacity: showToast ? 1 : 0,
      transform: showToast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(16px)',
      pointerEvents: showToast ? 'auto' : 'none',
    }}>
      {toastMessage}
    </div>
  );

  return (
    <div style={styles.wrapper} className="teacher-dashboard-wrapper">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* 모바일에서 전체 화면 사용 */
        @media (max-width: 430px) {
          .teacher-dashboard-wrapper {
            padding: 0 !important;
            background: #FFFFFF !important;
          }
          .teacher-dashboard-device {
            max-width: 100% !important;
            height: 100vh !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding-top: env(safe-area-inset-top) !important;
            padding-bottom: env(safe-area-inset-bottom) !important;
            padding-left: env(safe-area-inset-left) !important;
            padding-right: env(safe-area-inset-right) !important;
          }
        }

        /* 태블릿 */
        @media (min-width: 431px) and (max-width: 768px) {
          .teacher-dashboard-wrapper {
            padding: 16px !important;
          }
          .teacher-dashboard-device {
            max-width: 100% !important;
            height: calc(100vh - 32px) !important;
            border-radius: 32px !important;
          }
        }
      `}</style>
      <div style={styles.device} className="teacher-dashboard-device">
        {currentView === 'home' && renderHome()}
        {currentView === 'attendance' && renderAttendance()}
        {currentView === 'students' && renderStudentList()}
        {currentView === 'settings' && renderSettings()}
        {renderNav()}
        {renderBottomSheet()}
        {renderToast()}
      </div>
    </div>
  );
}

// ==================== 스타일 ====================
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #E8ECF1 0%, #D5DBE3 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif',
  },
  device: {
    width: '100%',
    maxWidth: 390,
    height: 844,
    background: '#FFFFFF',
    borderRadius: 48,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 24px 80px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.08)',
  },
  container: {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: 100,
  },

  // ===== 홈 =====
  homeHeader: {
    padding: '64px 24px 28px',
  },
  dateChip: {
    display: 'inline-block',
    padding: '8px 14px',
    background: '#F2F4F6',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: '#6B7684',
    marginBottom: 16,
  },
  mainGreeting: {
    fontSize: 28,
    fontWeight: 800,
    color: '#191F28',
    lineHeight: 1.35,
    margin: 0,
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontWeight: 500,
    color: '#6B7684',
    fontSize: 22,
  },

  // CTA
  ctaSection: {
    padding: '0 20px 28px',
  },
  ctaCard: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    borderRadius: 24,
    padding: '22px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    boxShadow: '0 12px 28px rgba(124, 58, 237, 0.28)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  ctaLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: {
    fontSize: 22,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#FFFFFF',
    margin: '0 0 4px',
  },
  ctaDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    margin: 0,
  },

  // 섹션
  section: {
    padding: '0 20px 28px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#191F28',
    margin: '0 0 16px',
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: 700,
    color: '#191F28',
    margin: 0,
  },
  badge: {
    background: '#F04452',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 12,
  },

  // 카드
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  alertCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    background: '#FFF8F8',
    borderRadius: 18,
    border: '1px solid #FFE8E8',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  alertAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    background: '#FFDFDF',
    color: '#F04452',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    marginRight: 14,
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#191F28',
    margin: '0 0 3px',
  },
  alertMeta: {
    fontSize: 13,
    color: '#F04452',
    margin: 0,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: '#FFF',
    border: '1px solid #FFE8E8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    textDecoration: 'none',
  },

  // 생일
  birthdayCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: '#FFFFFF',
    borderRadius: 18,
    transition: 'transform 0.2s',
  },
  birthdayLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  birthdayEmoji: {
    fontSize: 24,
  },
  birthdayName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#191F28',
    margin: '0 0 2px',
  },
  birthdayDate: {
    fontSize: 13,
    color: '#6B7684',
    margin: 0,
  },
  miniBtn: {
    padding: '8px 14px',
    background: '#F2F4F6',
    border: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#4E5968',
    textDecoration: 'none',
  },

  // 도넛 통계
  donutStatsWrap: {
    display: 'flex',
    alignItems: 'center',
    background: '#F9FAFB',
    borderRadius: 24,
    padding: '24px 20px',
    gap: 20,
  },
  donutSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  donutLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#6B7684',
    margin: 0,
  },
  donutDivider: {
    width: 1,
    height: 80,
    background: '#E5E8EB',
  },
  miniStats: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  miniStatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  miniStatIcon: {
    fontSize: 16,
  },
  miniStatLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7684',
  },
  miniStatValue: {
    fontSize: 15,
    fontWeight: 700,
    color: '#191F28',
  },

  // ===== 출석 =====
  attHeader: {
    padding: '56px 16px 12px',
    display: 'flex',
    alignItems: 'center',
    background: '#FFFFFF',
  },
  backBtn: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 14,
  },
  attHeaderCenter: {
    flex: 1,
    textAlign: 'center',
  },
  attTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#191F28',
    margin: 0,
  },
  datePickerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    color: '#8B95A1',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    margin: '4px 0 0',
    borderRadius: 8,
    transition: 'background 0.2s',
  },
  headerBtn: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    borderRadius: 14,
  },

  // 탭
  tabWrap: {
    display: 'flex',
    gap: 8,
    padding: '8px 20px 16px',
    overflowX: 'auto',
  },
  tab: {
    padding: '10px 18px',
    background: '#F2F4F6',
    border: 'none',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    color: '#6B7684',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  tabActive: {
    padding: '10px 18px',
    background: '#191F28',
    border: 'none',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },

  // 진행바
  progressWrap: {
    padding: '0 20px 16px',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7684',
  },
  progressSummary: {
    fontSize: 13,
    color: '#8B95A1',
  },
  progressTrack: {
    height: 6,
    background: '#F2F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s',
  },

  // 학생 카드 (출석)
  studentList: {
    padding: '0 20px',
  },
  studentCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid #F5F6F8',
    cursor: 'pointer',
  },
  studentLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  studentAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 17,
    fontWeight: 700,
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  studentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  studentNameWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#191F28',
  },
  streakBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#FF6B00',
    background: '#FFF4E6',
    padding: '2px 6px',
    borderRadius: 6,
  },
  warnBadge: {
    fontSize: 12,
  },
  warnTag: {
    fontSize: 11,
    fontWeight: 600,
    color: '#F04452',
    background: '#FFEFEF',
    padding: '2px 8px',
    borderRadius: 6,
  },
  memoDot: {
    fontSize: 12,
    color: '#7c3aed',
  },
  studentSub: {
    fontSize: 13,
    color: '#8B95A1',
  },
  attendBtns: {
    display: 'flex',
    gap: 8,
  },
  attBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // 저장
  bottomFixed: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  saveBtn: {
    width: '100%',
    padding: '18px',
    border: 'none',
    borderRadius: 18,
    fontSize: 16,
    fontWeight: 700,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(124, 58, 237, 0.25)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // ===== 캘린더 =====
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 20,
  },
  calendarModal: {
    width: '100%',
    maxWidth: 340,
    background: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: '#F5F6F8',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#191F28',
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#191F28',
    margin: 0,
  },
  calendarDays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
    marginBottom: 8,
  },
  calendarDayName: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#8B95A1',
    padding: '8px 0',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  calendarCell: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    transition: 'background 0.2s',
    gap: 2,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
  },
  calendarLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #F2F4F6',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#8B95A1',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  calendarCloseBtn: {
    width: '100%',
    padding: '14px',
    marginTop: 16,
    background: '#191F28',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    color: '#FFFFFF',
    cursor: 'pointer',
  },

  // ===== 학생 목록 =====
  studentListHeader: {
    padding: '64px 24px 20px',
  },
  studentListTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#191F28',
    margin: '0 0 6px',
    letterSpacing: -0.5,
  },
  studentListSub: {
    fontSize: 15,
    color: '#8B95A1',
    margin: 0,
  },

  // 검색
  searchWrap: {
    padding: '0 20px 12px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 18px',
    background: '#F5F6F8',
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 15,
    color: '#191F28',
    outline: 'none',
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    background: '#D1D6DB',
    border: 'none',
    color: '#FFF',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 필터 칩
  filterChips: {
    display: 'flex',
    gap: 8,
    padding: '0 20px 16px',
    overflowX: 'auto',
  },
  chip: {
    padding: '10px 16px',
    background: '#F5F6F8',
    border: 'none',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: '#6B7684',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  chipActive: {
    padding: '10px 16px',
    background: '#191F28',
    border: 'none',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: '#FFFFFF',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },

  // 학생 목록 카드
  studentListWrap: {
    padding: '0 20px',
  },
  studentListCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 10,
    border: '1px solid #F2F4F6',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  studentListLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    flex: 1,
  },
  studentListAvatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
  },
  studentListInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentListNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  studentListName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#191F28',
  },
  studentListMeta: {
    fontSize: 13,
    color: '#8B95A1',
  },
  studentListMemo: {
    fontSize: 13,
    color: '#6B7684',
    margin: '8px 0 0',
    padding: '8px 12px',
    background: '#F9FAFB',
    borderRadius: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // 빈 상태
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#8B95A1',
  },

  // ===== 네비 =====
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
    background: '#FFFFFF',
    borderTop: '1px solid #F2F4F6',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#B0B8C1',
    cursor: 'pointer',
    padding: '0 20px',
    transition: 'color 0.2s',
  },
  navBtnActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#191F28',
    cursor: 'pointer',
    padding: '0 20px',
    transition: 'color 0.2s',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: 600,
  },

  // ===== 바텀시트 =====
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 100,
    transition: 'opacity 0.25s',
  },
  sheet: {
    width: '100%',
    maxHeight: '85%',
    overflowY: 'auto',
    background: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: '12px 24px 44px',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  sheetHandle: {
    width: 40,
    height: 5,
    background: '#E5E8EB',
    borderRadius: 3,
    margin: '0 auto 24px',
  },
  sheetProfile: {
    textAlign: 'center',
    marginBottom: 20,
  },
  sheetAvatar: {
    width: 72,
    height: 72,
    borderRadius: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    margin: '0 auto 16px',
  },
  sheetName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#191F28',
    margin: '0 0 6px',
  },
  sheetMeta: {
    fontSize: 15,
    color: '#6B7684',
    margin: '0 0 12px',
  },
  sheetBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  sheetStreak: {
    display: 'inline-block',
    fontSize: 13,
    fontWeight: 600,
    color: '#FF6B00',
    background: '#FFF4E6',
    padding: '6px 12px',
    borderRadius: 10,
  },
  sheetWarning: {
    display: 'inline-block',
    fontSize: 13,
    fontWeight: 600,
    color: '#F04452',
    background: '#FFEFEF',
    padding: '6px 12px',
    borderRadius: 10,
  },

  // 최근 출석
  recentAttendanceWrap: {
    background: '#F9FAFB',
    borderRadius: 16,
    padding: '16px 20px',
    marginBottom: 16,
  },
  recentAttendanceTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#6B7684',
    margin: '0 0 12px',
  },
  recentAttendanceList: {
    display: 'flex',
    gap: 8,
  },
  recentAttendanceItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  recentAttendanceDate: {
    fontSize: 12,
    color: '#8B95A1',
  },
  recentAttendanceStatus: {
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 8,
  },

  // 정보 카드
  infoCard: {
    background: '#F9FAFB',
    borderRadius: 16,
    padding: '16px 20px',
    marginBottom: 20,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8B95A1',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#191F28',
  },
  infoDivider: {
    height: 1,
    background: '#ECEEF0',
    margin: '12px 0',
  },

  // 액션
  sheetActions: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
  },
  sheetActionBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '16px 8px',
    background: '#F9FAFB',
    borderRadius: 16,
    textDecoration: 'none',
    color: '#191F28',
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.2s',
  },
  sheetActionIcon: {
    fontSize: 24,
  },
  sheetActionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#191F28',
  },
  sheetActionSub: {
    fontSize: 11,
    color: '#8B95A1',
  },

  // 메모
  sheetMemoWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sheetMemoLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: '#191F28',
  },
  sheetMemoInput: {
    width: '100%',
    height: 100,
    padding: 16,
    borderRadius: 16,
    border: '1px solid #E5E8EB',
    background: '#F9FAFB',
    fontSize: 15,
    lineHeight: 1.5,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    color: '#191F28',
  },

  // ===== 토스트 =====
  toast: {
    position: 'absolute',
    bottom: 110,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(25, 31, 40, 0.95)',
    backdropFilter: 'blur(12px)',
    color: '#FFFFFF',
    padding: '14px 24px',
    borderRadius: 50,
    fontSize: 15,
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    zIndex: 200,
    whiteSpace: 'nowrap',
  },

  // ===== 설정 화면 =====
  settingsHeader: {
    padding: '64px 24px 20px',
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#191F28',
    margin: 0,
    letterSpacing: -0.5,
  },
  settingsSection: {
    padding: '0 20px 24px',
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#8B95A1',
    margin: '0 0 12px',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    padding: '24px',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    borderRadius: 24,
    border: '1px solid #E2E8F0',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#191F28',
    margin: '0 0 6px',
  },
  profileMeta: {
    fontSize: 15,
    color: '#6B7684',
    margin: 0,
  },
  settingsCard: {
    background: '#FFFFFF',
    borderRadius: 20,
    padding: '4px 0',
    border: '1px solid #F2F4F6',
  },
  settingsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
  },
  settingsLabel: {
    fontSize: 15,
    color: '#6B7684',
  },
  settingsValue: {
    fontSize: 15,
    fontWeight: 600,
    color: '#191F28',
  },
  settingsDivider: {
    height: 1,
    background: '#F5F6F8',
    margin: '0 20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '20px 12px',
    background: '#FFFFFF',
    borderRadius: 20,
    border: '1px solid #F2F4F6',
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 800,
    color: '#191F28',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#8B95A1',
  },
  logoutBtn: {
    width: '100%',
    padding: '18px',
    background: '#F04452',
    border: 'none',
    borderRadius: 18,
    fontSize: 16,
    fontWeight: 700,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(240, 68, 82, 0.25)',
    transition: 'all 0.2s',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#B0B8C1',
    marginTop: 16,
  },
};
