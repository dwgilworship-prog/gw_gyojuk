import React from 'react';
import { styles } from './styles';
import { Skeleton } from './Skeleton';
import type { UIStudent } from './types';

interface StudentListViewProps {
  isLoaded: boolean;
  isDataLoading: boolean;
  teacherInfo: { name: string; group: string };
  myGroupStudents: UIStudent[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  studentFilter: string;
  setStudentFilter: (filter: string) => void;
  getFilteredStudentList: () => UIStudent[];
  triggerHaptic: (duration?: number) => void;
  setSelectedStudent: (student: UIStudent | null) => void;
}

export const StudentListView = ({
  isLoaded,
  isDataLoading,
  teacherInfo,
  myGroupStudents,
  searchQuery,
  setSearchQuery,
  studentFilter,
  setStudentFilter,
  getFilteredStudentList,
  triggerHaptic,
  setSelectedStudent,
}: StudentListViewProps) => {
  const studentList = getFilteredStudentList();

  return (
    <div style={styles.container} className="hide-scrollbar">
      <header style={styles.studentListHeader} className="student-list-header">
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
