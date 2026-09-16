import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-none">
      <div 
        className="fixed inset-0" 
        onClick={!isLoading ? onCancel : undefined} 
      />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-lg shrink-0 ${isDestructive ? 'bg-status-danger/10 text-status-danger border border-status-danger/20' : 'bg-status-warning/10 text-status-warning border border-status-warning/20'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base font-semibold text-text">{title}</h3>
              <p className="mt-1.5 text-xs text-text-muted leading-relaxed">{description}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-text-dim hover:text-text p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-surface-raised border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-medium text-text-muted hover:text-text bg-surface border border-border rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-50 ${
              isDestructive 
                ? 'bg-status-danger hover:bg-red-600' 
                : 'bg-primary text-primary-foreground hover:bg-primaryHover'
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
