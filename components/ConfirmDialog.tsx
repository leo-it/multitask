'use client'

import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmButtonClassName?: string
  cancelButtonClassName?: string
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClassName = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition',
  cancelButtonClassName = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || ''}
      footer={
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleConfirm}
            className={confirmButtonClassName}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cancelButtonClassName}
          >
            {cancelText}
          </button>
        </div>
      }
      maxWidth="sm"
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  )
}
