import React, { useState, useEffect } from 'react';
import { styles } from './styles';
import type { UIStudent } from './types';
import type { StudentObservation } from '@shared/schema';

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UIStudent | null;
  selectedDate: string;
  observations: StudentObservation[];
  onAddObservation: (content: string) => void;
  onDeleteObservation: (id: string) => void;
  isLoading?: boolean;
}

export const ObservationModal = ({
  isOpen,
  onClose,
  student,
  selectedDate,
  observations,
  onAddObservation,
  onDeleteObservation,
  isLoading = false,
}: ObservationModalProps) => {
  const [content, setContent] = useState('');

  // 모달이 닫힐 때 입력값 초기화
  useEffect(() => {
    if (!isOpen) {
      setContent('');
    }
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const selectedDateDisplay = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });

  const handleSubmit = () => {
    if (content.trim()) {
      onAddObservation(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="calendar-modal-overlay"
      style={styles.calendarOverlay}
      onClick={onClose}
    >
      <div
        style={{
          ...styles.calendarModal,
          maxWidth: 360,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: '#ede9fe',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
            }}>
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#191F28', margin: 0 }}>
                {student.name}
              </h3>
              <p style={{ fontSize: 13, color: '#8B95A1', margin: 0 }}>
                {selectedDateDisplay} 특이사항
              </p>
            </div>
          </div>
        </div>

        {/* 기존 특이사항 목록 */}
        <div style={{ marginBottom: 16 }}>
          {isLoading ? (
            <div style={styles.observationEmpty}>불러오는 중...</div>
          ) : observations.length > 0 ? (
            <div style={{ ...styles.observationList, maxHeight: 150, overflowY: 'auto' }}>
              {observations.map((obs) => (
                <div key={obs.id} style={styles.observationItem}>
                  <span style={styles.observationContent}>{obs.content}</span>
                  <button
                    style={styles.observationDeleteBtn}
                    onClick={() => onDeleteObservation(obs.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.observationEmpty}>
              기록된 특이사항이 없습니다
            </div>
          )}
        </div>

        {/* 새 특이사항 입력 */}
        <div style={{ marginBottom: 16 }}>
          <textarea
            style={{
              width: '100%',
              height: 80,
              padding: 14,
              borderRadius: 12,
              border: '1px solid #E5E8EB',
              background: '#FFFFFF',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'none',
              boxSizing: 'border-box',
              color: '#191F28',
            }}
            placeholder="특이사항을 입력하세요 (Enter로 저장)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              padding: 14,
              background: '#F5F6F8',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              color: '#6B7684',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            닫기
          </button>
          <button
            style={{
              flex: 1,
              padding: 14,
              background: content.trim() ? '#7c3aed' : '#E5E8EB',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              color: content.trim() ? '#FFFFFF' : '#B0B8C1',
              cursor: content.trim() ? 'pointer' : 'not-allowed',
            }}
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};
