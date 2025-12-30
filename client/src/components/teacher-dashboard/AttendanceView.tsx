import React from 'react';
import { styles } from './styles';
import { Confetti } from './Confetti';
import { SkeletonCard } from './Skeleton';
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
  // 특이사항 관련
  onOpenObservation?: (student: UIStudent) => void;
  hasObservation?: (studentId: string) => boolean;
  // 목장 메모 관련
  reportContent?: string;
  setReportContent?: (content: string) => void;
  reportPrayerRequest?: string;
  setReportPrayerRequest?: (prayerRequest: string) => void;
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
  onOpenObservation,
  hasObservation,
  reportContent,
  setReportContent,
}: AttendanceViewProps) => (
  <div className="view-container hide-scrollbar">
    <Confetti active={showConfetti} />

    <header className="att-header">
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
                  <span style={styles.studentSub}>{student.grade}</span>
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
                {onOpenObservation && (
                  <button
                    style={{
                      ...styles.attBtn,
                      background: hasObservation?.(student.id) ? '#FFF4E6' : '#F5F6F8',
                      color: hasObservation?.(student.id) ? '#FF6B00' : '#8B95A1',
                      position: 'relative',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      onOpenObservation(student);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {hasObservation?.(student.id) && (
                      <span style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#FF6B00',
                      }} />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>

    {/* 목장 메모 입력 영역 */}
    {setReportContent && (
      <div style={{
        margin: '16px 20px 100px',
        padding: '16px',
        background: '#f8f5ff',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>📝 이번주 목장 특이사항</span>
        </div>
        <textarea
          value={reportContent || ''}
          onChange={(e) => setReportContent(e.target.value)}
          placeholder="이번 주 목장 특이사항을 입력하세요"
          style={{
            width: '100%',
            minHeight: 80,
            padding: 12,
            border: '1px solid #E5E8EB',
            borderRadius: 12,
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit',
            background: '#FFFFFF',
            color: '#191F28',
            WebkitTextFillColor: '#191F28',
            opacity: 1,
          }}
          onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
          onBlur={(e) => e.target.style.borderColor = '#E5E8EB'}
        />
      </div>
    )}

    {/* 저장 버튼 */}
    <div className="save-btn-fixed">
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
