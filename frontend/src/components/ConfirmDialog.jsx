import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Modal from './Modal.jsx'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  danger = true,
}) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    try {
      setLoading(true)
      await onConfirm()
      onClose()
    } catch {
      // Error is handled by AppContext toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} width="max-w-sm">
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-rose-50 text-rose-600' : 'bg-accent-50 text-accent-600'
          }`}
        >
          <AlertTriangle size={20} />
        </div>
        <p className="text-sm text-ink-700">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="focus-ring rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`focus-ring flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-80 ${
            danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-accent-600 hover:bg-accent-700'
          }`}
        >
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}