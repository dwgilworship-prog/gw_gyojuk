import React from 'react';
import { styles } from './styles';
import type { UIStudent } from './types';
import { MemoList } from '@/components/student-memos';

interface BottomSheetProps {
  selectedStudent: UIStudent | null;
  sheetClosing: boolean;
  closeSheet: () => void;
  handleCopyPhone: (phone: string) => void;
  getStudentMinistries: (studentId: string) => string[];
  showToastMessage: (message: string) => void;
}

export const BottomSheet = ({
  selectedStudent,
  sheetClosing,
  closeSheet,
  handleCopyPhone,
  getStudentMinistries,
  showToastMessage,
}: BottomSheetProps) => {
  if (!selectedStudent) return null;

  const [month, day] = selectedStudent.birthday.split('-');

  // 최근 출석 기록
  const recentAttendance = Object.entries(selectedStudent.attendanceHistory)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 4);

  return (
    <div
      className="bottom-sheet-overlay"
      style={{
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
          <MemoList
            studentId={selectedStudent.id}
            studentName={selectedStudent.name}
            showToastMessage={showToastMessage}
          />
        </div>
      </div>
    </div>
  );
};
