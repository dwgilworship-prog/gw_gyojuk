import React, { useState } from 'react';
import { styles } from './styles';
import type { UIStudent } from './types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  students: UIStudent[];
  selectedGroup: string;
}

export const CalendarModal = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  students,
  selectedGroup
}: CalendarModalProps) => {
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
