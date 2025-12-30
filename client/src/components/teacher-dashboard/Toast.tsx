import React from 'react';

interface ToastProps {
  showToast: boolean;
  toastMessage: string;
}

export const Toast = ({ showToast, toastMessage }: ToastProps) => (
  <div
    className="toast-message"
    style={{
      opacity: showToast ? 1 : 0,
      transform: showToast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(16px)',
      pointerEvents: showToast ? 'auto' : 'none',
    }}
  >
    {toastMessage}
  </div>
);
