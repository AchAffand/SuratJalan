import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number; // ms
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 2500 }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;
  const color = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-800';

  return (
    <div className={`fixed bottom-6 right-6 z-50 text-white px-4 py-3 rounded-lg shadow-lg ${color} animate-[fadeIn_.2s_ease-out]`}>
      {message}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export default Toast;



