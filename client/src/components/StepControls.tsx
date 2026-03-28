import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { useStore } from '../stores/useStore.ts'

export function StepControls() {
  const currentStep = useStore((s) => s.currentStep)
  const maxStep = useStore((s) => s.maxStep)
  const isPlaying = useStore((s) => s.isPlaying)
  const diagram = useStore((s) => s.diagram)
  const stepForward = useStore((s) => s.stepForward)
  const stepBack = useStore((s) => s.stepBack)
  const togglePlay = useStore((s) => s.togglePlay)

  if (!diagram) return null

  return (
    <div className="flex items-center justify-center gap-3 py-2 px-4 bg-canvas-surface/80 backdrop-blur-sm border-t border-canvas-border">
      <button
        onClick={stepBack}
        disabled={currentStep <= 0}
        className="p-1.5 rounded text-canvas-muted hover:text-canvas-text disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        onClick={togglePlay}
        className="p-1.5 rounded text-canvas-muted hover:text-canvas-text transition-colors"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <button
        onClick={stepForward}
        disabled={currentStep >= maxStep}
        className="p-1.5 rounded text-canvas-muted hover:text-canvas-text disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={18} />
      </button>

      <span className="text-xs text-canvas-muted ml-2">
        Step {currentStep} of {maxStep}
      </span>
    </div>
  )
}
