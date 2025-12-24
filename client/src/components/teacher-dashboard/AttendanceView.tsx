import React from 'react';
import { styles } from './styles';
import { Confetti } from './Confetti';
import { Skeleton, SkeletonCard } from './Skeleton';
import { CalendarModal } from './CalendarModal';
import type { UIStudent } from './types';

interface AttendanceViewProps {
  isLoaded: boolean;
  showConfetti: boolean;
  selectedDateDisplay: string;
  selectedDate: string;
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  setSelectedDate: (date: string) => void;
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
  groups: string[];
  filteredStudents: UIStudent[];
  students: UIStudent[];
  isDataLoading: boolean;
  checkedCount: number;
  presentCount: number;
  absentCount: number;
  totalCount: number;
  progress: number;
  hasChanges: boolean;
  isSaving: boolean;
  triggerHaptic: (duration?: number) => void;
  setCurrentView: (view: string) => void;
  setSelectedStudent: (student: UIStudent | null) => void;
  getAttendanceForDate: (student: UIStudent) => string | null;
  handleAttendance: (e: React.MouseEvent, studentId: string, status: string) => void;
  handleSave: () => void;
  handleCopyReport: () => void;
}

export const AttendanceView = ({
  isLoaded,
  showConfetti,
  selectedDateDisplay,
  selectedDate,
  showCalendar,
  setShowCalendar,
  setSelectedDate,
  selectedGroup,
  setSelectedGroup,
  groups,
  filteredStudents,
  students,
  isDataLoading,
  checkedCount,
  presentCount,
  absentCount,
  totalCount,
  progress,
  hasChanges,
  isSaving,
  triggerHaptic,
  setCurrentView,
  setSelectedStudent,
  getAttendanceForDate,
  handleAttendance,
  handleSave,
  handleCopyReport,
}: AttendanceViewProps) => (
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
    <div style={styles.bottomFixed} className="save-btn-fixed">
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
