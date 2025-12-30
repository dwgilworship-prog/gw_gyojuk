import React from 'react';
import { styles } from './styles';
import { AttendanceDonut } from './AttendanceDonut';
import { TypingGreeting } from './TypingGreeting';
import type { UIStudent } from './types';

interface HomeViewProps {
  isLoaded: boolean;
  todayDate: string;
  teacherInfo: { name: string; group: string };
  todayBirthdayStudents: UIStudent[];
  warningStudents: UIStudent[];
  birthdayStudents: UIStudent[];
  myGroupStudents: UIStudent[];
  streakStudents: UIStudent[];
  todayMonth: string;
  todayDay: string;
  calculateMonthlyAttendance: () => number;
  triggerHaptic: (duration?: number) => void;
  setCurrentView: (view: string) => void;
  setSelectedStudent: (student: UIStudent | null) => void;
}

export const HomeView = ({
  isLoaded,
  todayDate,
  teacherInfo,
  warningStudents,
  birthdayStudents,
  myGroupStudents,
  streakStudents,
  todayMonth,
  todayDay,
  calculateMonthlyAttendance,
  triggerHaptic,
  setCurrentView,
  setSelectedStudent,
}: HomeViewProps) => (
  <div className="view-container hide-scrollbar">
    <header className="home-header">
      <div style={{
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <p style={styles.dateChip}>{todayDate}</p>
        <TypingGreeting teacherName={teacherInfo.name} />
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
