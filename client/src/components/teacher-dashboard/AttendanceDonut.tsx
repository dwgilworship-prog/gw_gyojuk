import React, { useState, useEffect } from 'react';

interface AttendanceDonutProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const AttendanceDonut = ({
  percentage,
  size = 80,
  strokeWidth = 8,
  color = '#7c3aed'
}: AttendanceDonutProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E8EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <span style={{
        position: 'absolute',
        fontWeight: 800,
        fontSize: size * 0.2,
        color: color,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif',
      }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
};
