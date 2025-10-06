import React, { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Konfirmasi',
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onCancel}
      />
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200 transform transition-all duration-200 ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
      >
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>}
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;


