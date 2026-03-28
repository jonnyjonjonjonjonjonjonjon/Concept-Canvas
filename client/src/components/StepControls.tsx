import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useStore } from '../stores/useStore.ts'
import { getStepTiming } from '../lib/cameraFocus.ts'

export function StepControls() {
  const currentStep = useStore((s) => s.currentStep)
  const maxStep = useStore((s) => s.maxStep)
  const isPlaying = useStore((s) => s.isPlaying)
  const diagram = useStore((s) => s.diagram)
  const stepForward = useStore((s) => s.stepForward)
  const stepBack = useStore((s) => s.stepBack)
  const togglePlay = useStore((s) => s.togglePlay)
  const setCurrentStep = useStore((s) => s.setCurrentStep)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isPlaying || !diagram) return

    const timing = getStepTiming(diagram, currentStep)
    timerRef.current = setTimeout(() => {
      stepForward()
    }, timing.total)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, currentStep, diagram, stepForward])

  if (!diagram) return null

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-canvas-surface/80 backdrop-blur-sm border-t border-canvas-border">
      <button
        onClick={() => setCurrentStep(0)}
        disabled={currentStep <= 0}
        className="p-1.5 rounded text-canvas-muted hover:text-canvas-text disabled:opacity-30 transition-colors"
        title="Go to start"
      >
        <SkipBack size={16} />
      </button>

      <button
        onClick={stepBack}
        disabled={currentStep <= 0}
        className="p-1.5 rounded text-canvas-muted hover:text-canvas-text disabled:opacity-30 transition-colors"
        title="Previous step"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        onClick={togglePlay}
        className="p-2 rounded-lg bg-canvas-accent/20 text-canvas-accent hover:bg-canvas-accent/30 transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <button
        onClick={stepForward}
        disabled={currentStep >= maxStep}
        className="p-1.5 rounded text-canvas-muted hover:text-canvas-text disabled:opacity-30 transition-colors"
        title="Next step"
      >
        <ChevronRight size={18} />
      </button>

      <button
        onClick={() => setCurrentStep(maxStep)}
        disabled={currentStep >= maxStep}
        className="p-1.5 rounded text-canvas-muted hover:text-canvas-text disabled:opacity-30 transition-colors"
        title="Go to end"
      >
        <SkipForward size={16} />
      </button>

      <div className="flex items-center gap-1.5 ml-3">
        {Array.from({ length: maxStep + 1 }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i <= currentStep
                ? 'bg-canvas-accent scale-100'
                : 'bg-canvas-border scale-75'
            } ${i === currentStep ? 'ring-2 ring-canvas-accent/30' : ''}`}
          />
        ))}
      </div>

      <span className="text-xs text-canvas-muted ml-2">
        {currentStep}/{maxStep}
      </span>
    </div>
  )
}
