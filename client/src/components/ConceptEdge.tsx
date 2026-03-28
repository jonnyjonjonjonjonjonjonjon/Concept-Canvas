import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import type { Relationship } from '../../../shared/types.ts'

const TYPE_COLORS: Record<string, string> = {
  flows_into:      '#64748b',
  causes:          '#f59e0b',
  contains:        '#6366f1',
  interacts_with:  '#3b82f6',
  transforms_into: '#8b5cf6',
  opposes:         '#ef4444',
}

const TYPE_DASH: Record<string, string> = {
  flows_into:      '',
  causes:          '8 4',
  contains:        '4 4',
  interacts_with:  '',
  transforms_into: '12 4',
  opposes:         '6 3',
}

interface ConceptEdgeData {
  relationship: Relationship
  isVisible: boolean
  [key: string]: unknown
}

function ConceptEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const { relationship, isVisible } = (data ?? {}) as ConceptEdgeData
  const relType = relationship?.type ?? 'flows_into'
  const color = TYPE_COLORS[relType] ?? TYPE_COLORS.flows_into
  const dash = TYPE_DASH[relType] ?? ''

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const markerEnd = relType === 'interacts_with' ? undefined : `url(#arrow-${relType})`

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: relType === 'opposes' ? 2.5 : 2,
          strokeDasharray: dash,
          opacity: isVisible ? 0.8 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
        markerEnd={markerEnd}
      />
      {relationship?.label && isVisible && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-canvas-surface/90 border border-canvas-border text-canvas-muted"
          >
            {relationship.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const ConceptEdge = memo(ConceptEdgeComponent)

/** SVG marker definitions — render once at top level */
export function EdgeMarkers() {
  return (
    <svg className="absolute w-0 h-0">
      <defs>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 2 2 L 10 6 L 2 10 z" fill={color} />
          </marker>
        ))}
      </defs>
    </svg>
  )
}
