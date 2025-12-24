import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Teacher, Mokjang, Student as DbStudent, AttendanceLog, Ministry, MinistryStudent } from '@shared/schema';

// 분리된 컴포넌트들 import
import {
  UIStudent,
  convertToUIStudent,
  convertToDbStatus,
  styles,
  globalStyles,
  HomeView,
  AttendanceView,
  StudentListView,
  SettingsView,
  BottomSheet,
  Navigation,
  Toast,
} from '@/components/teacher-dashboard';

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

  // 로컬 출석 상태
  const [localAttendance, setLocalAttendance] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isDataLoading = isStudentsLoading;

  // 선택된 날짜 (기본: 이번 주 주일)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - dayOfWeek);

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

  // 선택된 날짜의 출석 상태 가져오기
  const getAttendanceForDate = useCallback((student: UIStudent) => {
    const localKey = `${student.id}_${selectedDate}`;
    if (localKey in localAttendance) {
      return localAttendance[localKey];
    }
    return student.attendanceHistory[selectedDate] || null;
  }, [localAttendance, selectedDate]);

  const checkedCount = filteredStudents.filter(s => getAttendanceForDate(s) !== null).length;
  const presentCount = filteredStudents.filter(s => getAttendanceForDate(s) === 'present').length;
  const absentCount = filteredStudents.filter(s => getAttendanceForDate(s) === 'absent').length;
  const totalCount = filteredStudents.length;
  const progress = totalCount === 0 ? 0 : (checkedCount / totalCount) * 100;

  const groups = Array.from(new Set(students.map(s => s.group)));

  // 이번달 생일자
  const birthdayStudents = myGroupStudents.filter(s => s.birthday.startsWith(todayMonth));
  const todayBirthdayStudents = myGroupStudents.filter(s => s.birthday === `${todayMonth}-${todayDay}`);

  // 장기결석자
  const warningStudents = students.filter(s => s.isWarning && s.group === teacherInfo.group);

  // 4주 연속 출석 학생
  const streakStudents = myGroupStudents.filter(s => s.streak >= 4);

  // 출석률 계산
  const calculateMonthlyAttendance = useCallback(() => {
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
  }, [myGroupStudents, todayMonth]);

  // 학생 검색 및 필터
  const getFilteredStudentList = useCallback(() => {
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
  }, [myGroupStudents, searchQuery, studentFilter]);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  // 메모 debounce를 위한 ref
  const memoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 메모 저장 mutation
  const memoMutation = useMutation({
    mutationFn: async (data: { studentId: string; memo: string }) => {
      const res = await apiRequest('PATCH', `/api/students/${data.studentId}`, { memo: data.memo });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/students", { mokjangIds: myMokjangs?.map(m => m.id) }]
      });
      showToastMessage('메모가 저장되었어요');
    },
    onError: () => {
      showToastMessage('메모 저장에 실패했어요');
    },
  });

  const handleAttendance = useCallback((e: React.MouseEvent, studentId: string, status: string) => {
    e.stopPropagation();
    triggerHaptic(15);

    const localKey = `${studentId}_${selectedDate}`;
    const student = students.find(s => s.id === studentId);
    const currentDisplayStatus = localKey in localAttendance
      ? localAttendance[localKey]
      : student?.attendanceHistory[selectedDate] || null;

    if (currentDisplayStatus === status) {
      setLocalAttendance(prev => ({
        ...prev,
        [localKey]: null,
      }));
      return;
    }

    setLocalAttendance(prev => ({
      ...prev,
      [localKey]: status,
    }));
  }, [localAttendance, selectedDate, students, triggerHaptic]);

  const hasChanges = useMemo(() => {
    return Object.keys(localAttendance).length > 0;
  }, [localAttendance]);

  const handleSave = useCallback(async () => {
    triggerHaptic(30);

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

    setIsSaving(true);
    const attendanceToSave: Array<{ studentId: string; date: string; status: 'ATTENDED' | 'ABSENT' }> = [];
    const attendanceToDelete: Array<{ studentId: string; date: string }> = [];

    for (const [key, status] of Object.entries(localAttendance)) {
      const [studentId, date] = key.split('_');
      const student = students.find(s => s.id === studentId);
      const originalStatus = student?.attendanceHistory[date] || null;

      if (status === null) {
        if (originalStatus !== null) {
          attendanceToDelete.push({ studentId, date });
        }
      } else {
        attendanceToSave.push({
          studentId,
          date,
          status: convertToDbStatus(status),
        });
      }
    }

    try {
      for (const item of attendanceToDelete) {
        await apiRequest('DELETE', '/api/attendance', item);
      }

      if (attendanceToSave.length > 0) {
        await apiRequest('POST', '/api/attendance', attendanceToSave);
      }

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
      showToastMessage('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, checkedCount, totalCount, localAttendance, students, triggerHaptic, showToastMessage]);

  const handleCopyReport = useCallback(() => {
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
  }, [filteredStudents, getAttendanceForDate, selectedGroup, selectedDateDisplay, presentCount, absentCount, triggerHaptic, showToastMessage]);

  const handleMemoChange = useCallback((id: string, text: string) => {
    if (selectedStudent && selectedStudent.id === id) {
      setSelectedStudent(prev => prev ? { ...prev, memo: text } : null);
    }

    if (memoTimeoutRef.current) {
      clearTimeout(memoTimeoutRef.current);
    }

    memoTimeoutRef.current = setTimeout(() => {
      memoMutation.mutate({ studentId: id, memo: text });
    }, 1000);
  }, [selectedStudent, memoMutation]);

  const closeSheet = useCallback(() => {
    setSheetClosing(true);
    setTimeout(() => {
      setSelectedStudent(null);
      setSheetClosing(false);
    }, 250);
  }, []);

  const handleCopyPhone = useCallback((phone: string) => {
    triggerHaptic();
    navigator.clipboard.writeText(phone.replace(/-/g, ''));
    showToastMessage('번호가 복사되었어요');
  }, [triggerHaptic, showToastMessage]);

  const handleLogout = useCallback(() => {
    triggerHaptic(20);
    logoutMutation.mutate();
  }, [triggerHaptic, logoutMutation]);

  return (
    <div style={styles.wrapper} className="teacher-dashboard-wrapper">
      <style>{globalStyles}</style>
      <div style={styles.device} className="teacher-dashboard-device">
        {currentView === 'home' && (
          <HomeView
            isLoaded={isLoaded}
            todayDate={todayDate}
            teacherInfo={teacherInfo}
            todayBirthdayStudents={todayBirthdayStudents}
            warningStudents={warningStudents}
            birthdayStudents={birthdayStudents}
            myGroupStudents={myGroupStudents}
            streakStudents={streakStudents}
            todayMonth={todayMonth}
            todayDay={todayDay}
            calculateMonthlyAttendance={calculateMonthlyAttendance}
            triggerHaptic={triggerHaptic}
            setCurrentView={setCurrentView}
            setSelectedStudent={setSelectedStudent}
          />
        )}
        {currentView === 'attendance' && (
          <AttendanceView
            isLoaded={isLoaded}
            showConfetti={showConfetti}
            selectedDateDisplay={selectedDateDisplay}
            selectedDate={selectedDate}
            showCalendar={showCalendar}
            setShowCalendar={setShowCalendar}
            setSelectedDate={setSelectedDate}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            groups={groups}
            filteredStudents={filteredStudents}
            students={students}
            isDataLoading={isDataLoading}
            checkedCount={checkedCount}
            presentCount={presentCount}
            absentCount={absentCount}
            totalCount={totalCount}
            progress={progress}
            hasChanges={hasChanges}
            isSaving={isSaving}
            triggerHaptic={triggerHaptic}
            setCurrentView={setCurrentView}
            setSelectedStudent={setSelectedStudent}
            getAttendanceForDate={getAttendanceForDate}
            handleAttendance={handleAttendance}
            handleSave={handleSave}
            handleCopyReport={handleCopyReport}
          />
        )}
        {currentView === 'students' && (
          <StudentListView
            isLoaded={isLoaded}
            isDataLoading={isDataLoading}
            teacherInfo={teacherInfo}
            myGroupStudents={myGroupStudents}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            studentFilter={studentFilter}
            setStudentFilter={setStudentFilter}
            getFilteredStudentList={getFilteredStudentList}
            triggerHaptic={triggerHaptic}
            setSelectedStudent={setSelectedStudent}
          />
        )}
        {currentView === 'settings' && (
          <SettingsView
            isLoaded={isLoaded}
            teacherInfo={teacherInfo}
            user={user}
            myGroupStudents={myGroupStudents}
            streakStudents={streakStudents}
            warningStudents={warningStudents}
            calculateMonthlyAttendance={calculateMonthlyAttendance}
            triggerHaptic={triggerHaptic}
            handleLogout={handleLogout}
            isLogoutPending={logoutMutation.isPending}
          />
        )}
        <Navigation
          currentView={currentView}
          setCurrentView={setCurrentView}
          triggerHaptic={triggerHaptic}
        />
        <BottomSheet
          selectedStudent={selectedStudent}
          sheetClosing={sheetClosing}
          closeSheet={closeSheet}
          handleMemoChange={handleMemoChange}
          handleCopyPhone={handleCopyPhone}
          getStudentMinistries={getStudentMinistries}
        />
        <Toast showToast={showToast} toastMessage={toastMessage} />
      </div>
    </div>
  );
}
