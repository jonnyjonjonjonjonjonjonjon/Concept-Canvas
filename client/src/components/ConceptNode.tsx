import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { Entity } from '../../../shared/types.ts'

const TYPE_STYLES: Record<string, { bg: string; border: string; accent: string; glow: string }> = {
  actor:       { bg: 'bg-blue-950/80',   border: 'border-blue-500/40',   accent: 'text-blue-400',   glow: 'shadow-blue-500/20' },
  object:      { bg: 'bg-emerald-950/80', border: 'border-emerald-500/40', accent: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  process:     { bg: 'bg-amber-950/80',   border: 'border-amber-500/40',   accent: 'text-amber-400',   glow: 'shadow-amber-500/20' },
  concept:     { bg: 'bg-purple-950/80',  border: 'border-purple-500/40',  accent: 'text-purple-400',  glow: 'shadow-purple-500/20' },
  environment: { bg: 'bg-cyan-950/80',    border: 'border-cyan-500/40',    accent: 'text-cyan-400',    glow: 'shadow-cyan-500/20' },
  event:       { bg: 'bg-rose-950/80',    border: 'border-rose-500/40',    accent: 'text-rose-400',    glow: 'shadow-rose-500/20' },
}

const TYPE_LABELS: Record<string, string> = {
  actor: 'Actor',
  object: 'Object',
  process: 'Process',
  concept: 'Concept',
  environment: 'Environment',
  event: 'Event',
}

interface ConceptNodeData {
  entity: Entity
  isVisible: boolean
  [key: string]: unknown
}

function ConceptNodeComponent({ data }: NodeProps) {
  const { entity, isVisible } = data as ConceptNodeData
  const [expanded, setExpanded] = useState(false)
  const style = TYPE_STYLES[entity.type] ?? TYPE_STYLES.concept

  return (
    <div
      className={`
        relative group cursor-pointer select-none
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
      `}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Handles on all 4 sides for flexible edge routing */}
      <Handle id="top" type="source" position={Position.Top} className="!bg-canvas-border !border-canvas-border !w-2 !h-2 !opacity-0" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!bg-canvas-border !border-canvas-border !w-2 !h-2 !opacity-0" />
      <Handle id="left" type="source" position={Position.Left} className="!bg-canvas-border !border-canvas-border !w-2 !h-2 !opacity-0" />
      <Handle id="right" type="source" position={Position.Right} className="!bg-canvas-border !border-canvas-border !w-2 !h-2 !opacity-0" />
      <Handle id="top" type="target" position={Position.Top} className="!bg-canvas-border !border-canvas-border !w-2 !h-2 !opacity-0" />
      <Handle id="bottom" type="target" position={Position.Bottom} className="!bg-canvas-border !border-canvas-border !w-2 !h-2 !opacity-0" />
      <Handle id="left" type="target" position={Position.Left} className="!bg-canvas-border !border-canvas-border !w-2 !h-2 !opacity-0" />
      <Handle id="right" type="target" position={Position.Right} className="!bg-canvas-border !border-canvas-border !w-2 !h-2 !opacity-0" />

      {/* Main card */}
      <div className={`
        rounded-xl border backdrop-blur-sm px-4 py-3 min-w-[140px] max-w-[220px]
        ${style.bg} ${style.border}
        shadow-lg ${style.glow}
        hover:shadow-xl hover:scale-[1.03] transition-all duration-200
        ${entity.is_gap ? 'border-dashed' : ''}
      `}>
        {/* Type badge */}
        <div className={`text-[10px] font-medium uppercase tracking-wider ${style.accent} opacity-70 mb-1.5`}>
          {entity.role ?? TYPE_LABELS[entity.type]}
        </div>

        {/* Icon + Label */}
        <div className="flex items-center gap-2.5">
          <div className={`flex-shrink-0 ${style.accent}`}>
            <DynamicIcon name={entity.icon_name as never} size={20} fallback={() => <span className="block w-5 h-5" />} />
          </div>
          <span className="text-sm font-semibold text-canvas-text leading-tight">
            {entity.label}
          </span>
        </div>

        {/* Expanded description */}
        {expanded && entity.description && (
          <p className="mt-2 pt-2 border-t border-white/10 text-xs text-canvas-muted leading-relaxed">
            {entity.description}
          </p>
        )}
      </div>
    </div>
  )
}

export const ConceptNode = memo(ConceptNodeComponent)
