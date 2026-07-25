import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import Button from './Button';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Record',
  itemType = 'record',
  itemInfo = {},
  isDeleting = false,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (isDeleting) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isDeleting) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-150 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-6">
          <p className="text-slate-700 font-medium mb-2">
            Are you sure you want to delete this {itemType}?
          </p>
          <p className="text-slate-500 text-sm">
            This action cannot be undone.
          </p>
        </div>

        {/* Item Information Card */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
          {Object.entries(itemInfo).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {key}
              </span>
              <span className="text-sm font-medium text-slate-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 py-2.5 text-sm font-semibold text-slate-700 border-slate-300 hover:bg-slate-50"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 border-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Trash2 size={16} />
                Yes, Delete
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
