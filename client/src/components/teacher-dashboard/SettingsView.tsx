import React from 'react';
import { styles } from './styles';
import type { UIStudent } from './types';

interface SettingsViewProps {
  isLoaded: boolean;
  teacherInfo: { name: string; group: string };
  user: { email?: string } | null;
  myGroupStudents: UIStudent[];
  streakStudents: UIStudent[];
  warningStudents: UIStudent[];
  calculateMonthlyAttendance: () => number;
  triggerHaptic: (duration?: number) => void;
  handleLogout: () => void;
  isLogoutPending: boolean;
}

export const SettingsView = ({
  isLoaded,
  teacherInfo,
  user,
  myGroupStudents,
  streakStudents,
  warningStudents,
  calculateMonthlyAttendance,
  handleLogout,
  isLogoutPending,
}: SettingsViewProps) => (
  <div style={styles.container} className="hide-scrollbar">
    <header className="settings-header">
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
        disabled={isLogoutPending}
      >
        {isLogoutPending ? '로그아웃 중...' : '로그아웃'}
      </button>
      <p style={styles.versionText}>버전 1.0.3</p>
    </section>
  </div>
);
