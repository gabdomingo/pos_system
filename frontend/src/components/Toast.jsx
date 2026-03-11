import React, { useEffect } from 'react';

export default function Toast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <div className="toast-inner">
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={() => onClose && onClose()} aria-label="Close">✕</button>
      </div>
    </div>
  );
}
