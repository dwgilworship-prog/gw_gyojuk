import React from 'react';

interface SkeletonProps {
  width: string | number;
  height: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export const Skeleton = ({
  width,
  height,
  borderRadius = 12,
  style = {}
}: SkeletonProps) => (
  <div
    style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }}
  />
);

export const SkeletonCard = () => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', gap: 14 }}>
    <Skeleton width={46} height={46} borderRadius={16} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={12} />
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <Skeleton width={48} height={48} borderRadius={14} />
      <Skeleton width={48} height={48} borderRadius={14} />
    </div>
  </div>
);
