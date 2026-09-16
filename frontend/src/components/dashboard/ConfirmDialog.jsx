import Modal from './Modal';
import { GhostButton, DangerButton } from './ui';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, description }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || 'Delete this item?'}
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <DangerButton
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </DangerButton>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
        </div>
        <p className="text-sm text-ink/60 leading-relaxed">
          {description || 'This action cannot be undone. Are you sure you want to continue?'}
        </p>
      </div>
    </Modal>
  );
}
