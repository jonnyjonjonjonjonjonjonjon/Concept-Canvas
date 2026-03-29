import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useStore } from '../stores/useStore.ts'

const ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES = {
  error: 'border-red-500/40 bg-red-950/80 text-red-200',
  warning: 'border-amber-500/40 bg-amber-950/80 text-amber-200',
  info: 'border-blue-500/40 bg-blue-950/80 text-blue-200',
}

const ICON_STYLES = {
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
}

export function Toast() {
  const toast = useStore((s) => s.toast)
  const clearToast = useStore((s) => s.clearToast)

  if (!toast) return null

  const Icon = ICONS[toast.type]

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg shadow-black/30 max-w-md ${STYLES[toast.type]}`}>
        <Icon size={16} className={`flex-shrink-0 ${ICON_STYLES[toast.type]}`} />
        <p className="text-sm leading-relaxed">{toast.message}</p>
        <button
          onClick={clearToast}
          className="flex-shrink-0 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
