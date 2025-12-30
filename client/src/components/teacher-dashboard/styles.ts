import React from 'react';

export const styles: Record<string, React.CSSProperties> = {
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
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: 100,
    WebkitOverflowScrolling: 'touch',
  },

  // ===== 홈 =====
  homeHeader: {
    padding: '32px 24px 28px',
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
    padding: '24px 16px 12px',
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
    padding: '32px 24px 20px',
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
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    background: '#FFFFFF',
    borderTop: '1px solid #F2F4F6',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 12,
    touchAction: 'none',
    zIndex: 9999,
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
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
    gap: 3,
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

  // 특이사항
  observationSection: {
    marginBottom: 20,
  },
  observationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  observationTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#191F28',
    margin: 0,
  },
  observationDate: {
    fontSize: 12,
    color: '#8B95A1',
  },
  observationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  observationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '12px 14px',
    background: '#F9FAFB',
    borderRadius: 12,
    gap: 10,
  },
  observationContent: {
    flex: 1,
    fontSize: 14,
    color: '#191F28',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  observationDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    background: '#FFEFEF',
    border: 'none',
    color: '#F04452',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  observationInputWrap: {
    display: 'flex',
    gap: 8,
  },
  observationInput: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #E5E8EB',
    background: '#FFFFFF',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    color: '#191F28',
  },
  observationAddBtn: {
    padding: '12px 16px',
    background: '#7c3aed',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s',
  },
  observationEmpty: {
    padding: '16px',
    textAlign: 'center',
    fontSize: 13,
    color: '#8B95A1',
    background: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
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
    padding: '32px 24px 20px',
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

// CSS 애니메이션 스타일
export const globalStyles = `
  html, body {
    margin: 0;
    padding: 0;
    overscroll-behavior: none;
    overscroll-behavior-y: none;
    -webkit-overflow-scrolling: touch;
  }

  .nav-bar {
    touch-action: none;
    -webkit-touch-callout: none;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* 스크롤바 숨김 - 기능은 유지하되 시각적으로 숨김 */
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE, Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
  }

  /* 모바일에서 전체 화면 사용 */
  @media (max-width: 430px) {
    .teacher-dashboard-wrapper {
      padding: 0 !important;
      background: #FFFFFF !important;
      min-height: 100vh !important;
      min-height: 100dvh !important;
      min-height: 100svh !important;
    }
    .teacher-dashboard-device {
      max-width: 100% !important;
      min-height: 100vh !important;
      min-height: 100dvh !important;
      min-height: 100svh !important;
      height: auto !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      /* padding-top은 각 헤더 컴포넌트에서 직접 처리 */
      padding-left: env(safe-area-inset-left, 0px) !important;
      padding-right: env(safe-area-inset-right, 0px) !important;
      padding-bottom: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
  }

  /* iOS PWA Safe Area - 헤더에 노치 영역 padding 적용 */
  @media all and (display-mode: standalone) {
    /* 홈 헤더 - 배경색이 노치까지 확장 + 상단 고정 */
    .home-header {
      position: sticky !important;
      top: 0 !important;
      z-index: 100 !important;
      padding-top: calc(32px + env(safe-area-inset-top, 0px)) !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
    }

    /* 출석 헤더 - 상단 고정 */
    .att-header {
      position: sticky !important;
      top: 0 !important;
      z-index: 100 !important;
      padding-top: calc(24px + env(safe-area-inset-top, 0px)) !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
    }

    /* 학생목록 헤더 - 상단 고정 */
    .student-list-header {
      position: sticky !important;
      top: 0 !important;
      z-index: 100 !important;
      padding-top: calc(32px + env(safe-area-inset-top, 0px)) !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
    }

    /* 설정 헤더 - 상단 고정 */
    .settings-header {
      position: sticky !important;
      top: 0 !important;
      z-index: 100 !important;
      padding-top: calc(32px + env(safe-area-inset-top, 0px)) !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
    }

    /* 하단 네비게이션 바 - fixed로 변경하여 브라우저 UI 위에 표시 */
    .nav-bar {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
      padding-bottom: env(safe-area-inset-bottom, 0px) !important;
      background: #FFFFFF !important;
      z-index: 9999 !important;
    }

    /* 컨텐츠 영역이 nav 뒤에 가려지지 않도록 여유 공간 확보 */
    .teacher-dashboard-device > div:first-child {
      padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px)) !important;
    }

    /* 저장 버튼 플로팅 - nav 바로 위에 고정 */
    .save-btn-fixed {
      position: fixed !important;
      bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 12px) !important;
      left: 20px !important;
      right: 20px !important;
      z-index: 9998 !important;
    }

    /* 바텀시트 오버레이 - fixed로 전체 화면 덮기 */
    .bottom-sheet-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 10000 !important;
    }

    /* 토스트 메시지 - 항상 최상단에 표시 */
    .toast-message {
      position: fixed !important;
      bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 80px) !important;
      z-index: 99999 !important;
    }

    /* 캘린더 모달 - 뷰포트 기준 중앙 배치 & 최상위 계층 */
    .calendar-modal-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 100000 !important;
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
      height: calc(100dvh - 32px) !important;
      border-radius: 32px !important;
    }
  }
`;
