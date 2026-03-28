import type { DiagramSpec } from '../../../shared/types.ts'
import type { Node, Edge } from '@xyflow/react'

const SPACING_X = 250
const SPACING_Y = 200

/**
 * Converts a DiagramSpec into React Flow nodes and edges.
 * Placeholder implementation — uses simple left-to-right positioning.
 * Will be replaced with relationship-relative layout engine.
 */
export function diagramToFlow(diagram: DiagramSpec): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = diagram.entities.map((entity, i) => ({
    id: entity.id,
    type: 'concept',
    position: { x: i * SPACING_X, y: Math.floor(i / 5) * SPACING_Y },
    data: { entity },
  }))

  const edges: Edge[] = diagram.relationships.map((rel, i) => ({
    id: `edge-${i}`,
    source: rel.source,
    target: rel.target,
    type: 'default',
    label: rel.label ?? undefined,
    data: { relationship: rel },
  }))

  return { nodes, edges }
}
