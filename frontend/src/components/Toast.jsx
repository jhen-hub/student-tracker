import { CheckCircle2, XCircle, X } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in flex items-start gap-2.5 rounded-xl bg-navy-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          {t.type === 'danger' ? (
            <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
          )}
          <p className="flex-1">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} className="text-white/60 hover:text-white">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
