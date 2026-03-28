import { X, Wrench, User } from 'lucide-react'
import { useStore } from '../stores/useStore.ts'
import type { CriterionScore } from '../../../shared/types.ts'

const CRITERIA_LABELS: Record<string, string> = {
  spatial_coherence: 'Spatial Coherence',
  flow_readability: 'Flow Readability',
  grouping: 'Grouping',
  balance: 'Balance',
  expert_intuition: 'Expert Intuition',
}

function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 6) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 8) return 'bg-emerald-500/20'
  if (score >= 6) return 'bg-amber-500/20'
  return 'bg-red-500/20'
}

export function AssessmentPanel() {
  const assessment = useStore((s) => s.assessment)
  const setAssessment = useStore((s) => s.setAssessment)
  const applyRevisedHints = useStore((s) => s.applyRevisedHints)

  if (!assessment) return null

  const criteria = assessment.criteria
  const hasRevisions = !!assessment.revised_hints && Object.keys(assessment.revised_hints).length > 0

  return (
    <div className="absolute top-16 right-4 z-30 w-80 animate-fade-in">
      <div className="rounded-xl bg-canvas-surface/95 border border-canvas-border backdrop-blur-md shadow-xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-border">
          <div className="flex items-center gap-2">
            <User size={14} className="text-canvas-accent" />
            <span className="text-xs font-medium text-canvas-accent">{assessment.expert_persona}</span>
          </div>
          <button
            onClick={() => setAssessment(null)}
            className="p-1 rounded text-canvas-muted hover:text-canvas-text transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Verdict */}
        <div className="px-4 py-3 border-b border-canvas-border">
          <p className="text-xs text-canvas-text leading-relaxed">{assessment.verdict}</p>
        </div>

        {/* Criteria */}
        <div className="px-4 py-2">
          {(Object.entries(criteria) as [string, CriterionScore][]).map(([key, criterion]) => (
            <div key={key} className="py-2 border-b border-canvas-border/50 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-canvas-muted">
                  {CRITERIA_LABELS[key] ?? key}
                </span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${scoreBg(criterion.score)} ${scoreColor(criterion.score)}`}>
                  {criterion.score}/10
                </span>
              </div>
              <p className="text-[11px] text-canvas-muted/70 leading-relaxed">{criterion.note}</p>
            </div>
          ))}
        </div>

        {/* Fix button */}
        {hasRevisions && (
          <div className="px-4 py-3 border-t border-canvas-border">
            <button
              onClick={applyRevisedHints}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-canvas-accent text-white text-sm font-medium hover:bg-canvas-accent-hover transition-colors"
            >
              <Wrench size={14} />
              Fix Layout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
