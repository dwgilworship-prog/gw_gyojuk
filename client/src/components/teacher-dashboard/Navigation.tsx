import React, { useEffect, useRef } from 'react';
import { styles } from './styles';

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  triggerHaptic: (duration?: number) => void;
}

export const Navigation = ({
  currentView,
  setCurrentView,
  triggerHaptic,
}: NavigationProps) => {
  const navRef = useRef<HTMLElement>(null);

  // 구형 브라우저 대비: touchmove에서 preventDefault
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    nav.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      nav.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <nav ref={navRef} style={styles.nav} className="nav-bar">
      <button
        style={currentView === 'home' ? styles.navBtnActive : styles.navBtn}
        onClick={() => { triggerHaptic(); setCurrentView('home'); }}
      >
        <span style={{ fontSize: 21 }}>🏠</span>
        <span style={styles.navLabel}>홈</span>
      </button>
      <button
        style={currentView === 'attendance' ? styles.navBtnActive : styles.navBtn}
        onClick={() => { triggerHaptic(); setCurrentView('attendance'); }}
      >
        <span style={{ fontSize: 21 }}>✅</span>
        <span style={styles.navLabel}>출석</span>
      </button>
      <button
        style={currentView === 'students' ? styles.navBtnActive : styles.navBtn}
        onClick={() => { triggerHaptic(); setCurrentView('students'); }}
      >
        <span style={{ fontSize: 21 }}>👥</span>
        <span style={styles.navLabel}>학생</span>
      </button>
      <button
        style={currentView === 'settings' ? styles.navBtnActive : styles.navBtn}
        onClick={() => { triggerHaptic(); setCurrentView('settings'); }}
      >
        <span style={{ fontSize: 21 }}>⚙️</span>
        <span style={styles.navLabel}>설정</span>
      </button>
    </nav>
  );
};
