import { useStore } from '../stores/useStore.ts'
import type { StructuralMode } from '../../../shared/types.ts'

const MODES: { value: StructuralMode; label: string; desc: string }[] = [
  { value: 'auto', label: 'Auto', desc: 'Let AI decide the best layout' },
  { value: 'process', label: 'Process', desc: 'Step-by-step workflow' },
  { value: 'cycle', label: 'Cycle', desc: 'Repeating loop' },
  { value: 'cause_effect', label: 'Cause & Effect', desc: 'Causal chains' },
  { value: 'system', label: 'System', desc: 'Interconnected parts' },
  { value: 'timeline', label: 'Timeline', desc: 'Chronological events' },
  { value: 'containment', label: 'Containment', desc: 'Nested structures' },
  { value: 'problem', label: 'Problem', desc: 'Root cause analysis' },
]

export function ModeSelector() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          title={m.desc}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            mode === m.value
              ? 'bg-canvas-accent text-white'
              : 'bg-canvas-surface border border-canvas-border text-canvas-muted hover:text-canvas-text hover:border-canvas-muted/40'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
