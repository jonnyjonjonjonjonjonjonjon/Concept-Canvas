import type { DiagramSpec, StructuralMode } from '../../../shared/types.ts'
import type { Node, Edge } from '@xyflow/react'

const GAP_X = 280
const GAP_Y = 180

/**
 * Converts a DiagramSpec into React Flow nodes and edges,
 * using layout logic matched to the structural mode.
 */
export function diagramToFlow(
  diagram: DiagramSpec,
  currentStep: number
): { nodes: Node[]; edges: Edge[] } {
  const mode = diagram.detected_mode
  const positions = computePositions(diagram, mode)

  const nodes: Node[] = diagram.entities.map((entity) => ({
    id: entity.id,
    type: 'concept',
    position: positions.get(entity.id) ?? { x: 0, y: 0 },
    data: {
      entity,
      isVisible: entity.reveal_order <= currentStep,
    },
  }))

  const edges: Edge[] = diagram.relationships.map((rel, i) => ({
    id: `edge-${i}`,
    source: rel.source,
    target: rel.target,
    type: 'concept',
    data: {
      relationship: rel,
      isVisible: rel.reveal_order <= currentStep,
    },
  }))

  return { nodes, edges }
}

function computePositions(
  diagram: DiagramSpec,
  mode: StructuralMode
): Map<string, { x: number; y: number }> {
  switch (mode) {
    case 'process':
    case 'timeline':
      return layoutChain(diagram)
    case 'cycle':
      return layoutCycle(diagram)
    case 'cause_effect':
      return layoutCauseEffect(diagram)
    case 'containment':
      return layoutContainment(diagram)
    case 'problem':
      return layoutProblem(diagram)
    case 'system':
    case 'auto':
    default:
      return layoutSystem(diagram)
  }
}

/** Process / Timeline: left-to-right chain following flows_into edges */
function layoutChain(diagram: DiagramSpec): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const placed = new Set<string>()

  const next = new Map<string, string>()
  const hasIncoming = new Set<string>()
  for (const rel of diagram.relationships) {
    if (rel.type === 'flows_into') {
      next.set(rel.source, rel.target)
      hasIncoming.add(rel.target)
    }
  }

  const starts = diagram.entities.filter(e => !hasIncoming.has(e.id))
  if (starts.length === 0 && diagram.entities.length > 0) {
    starts.push(diagram.entities[0])
  }

  let row = 0
  for (const start of starts) {
    let col = 0
    let current: string | undefined = start.id
    while (current && !placed.has(current)) {
      positions.set(current, { x: col * GAP_X, y: row * GAP_Y })
      placed.add(current)
      col++
      current = next.get(current)
    }
    row++
  }

  for (const entity of diagram.entities) {
    if (!placed.has(entity.id)) {
      positions.set(entity.id, { x: 0, y: row * GAP_Y })
      row++
    }
  }

  return positions
}

/** Cycle: arrange in a circle */
function layoutCycle(diagram: DiagramSpec): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const n = diagram.entities.length
  const radius = Math.max(150, n * 50)

  const ordered = orderByChain(diagram)

  ordered.forEach((entity, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    positions.set(entity.id, {
      x: Math.cos(angle) * radius + radius,
      y: Math.sin(angle) * radius + radius,
    })
  })

  return positions
}

/** Cause & Effect: tree layout, causes flow top-to-bottom */
function layoutCauseEffect(diagram: DiagramSpec): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  const children = new Map<string, string[]>()
  const hasParent = new Set<string>()
  for (const rel of diagram.relationships) {
    if (rel.type === 'causes') {
      const list = children.get(rel.source) ?? []
      list.push(rel.target)
      children.set(rel.source, list)
      hasParent.add(rel.target)
    }
  }

  const roots = diagram.entities.filter(e => !hasParent.has(e.id))
  if (roots.length === 0 && diagram.entities.length > 0) {
    roots.push(diagram.entities[0])
  }

  const placed = new Set<string>()
  let globalCol = 0

  function placeTree(nodeId: string, depth: number) {
    if (placed.has(nodeId)) return
    placed.add(nodeId)
    const kids = children.get(nodeId) ?? []
    if (kids.length === 0) {
      positions.set(nodeId, { x: globalCol * GAP_X, y: depth * GAP_Y })
      globalCol++
    } else {
      const startCol = globalCol
      for (const kid of kids) {
        placeTree(kid, depth + 1)
      }
      const midX = ((startCol + globalCol - 1) / 2) * GAP_X
      positions.set(nodeId, { x: midX, y: depth * GAP_Y })
    }
  }

  for (const root of roots) {
    placeTree(root.id, 0)
  }

  for (const entity of diagram.entities) {
    if (!placed.has(entity.id)) {
      positions.set(entity.id, { x: globalCol * GAP_X, y: 0 })
      globalCol++
    }
  }

  return positions
}

/** Containment: container entities at top, children indented below */
function layoutContainment(diagram: DiagramSpec): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const children = new Map<string, string[]>()
  const isChild = new Set<string>()

  for (const rel of diagram.relationships) {
    if (rel.type === 'contains') {
      const list = children.get(rel.source) ?? []
      list.push(rel.target)
      children.set(rel.source, list)
      isChild.add(rel.target)
    }
  }

  let col = 0
  for (const entity of diagram.entities) {
    if (!isChild.has(entity.id)) {
      positions.set(entity.id, { x: col * GAP_X * 1.5, y: 0 })
      const kids = children.get(entity.id) ?? []
      kids.forEach((kid, i) => {
        positions.set(kid, {
          x: col * GAP_X * 1.5 + (i % 2) * GAP_X * 0.8,
          y: GAP_Y + Math.floor(i / 2) * GAP_Y,
        })
      })
      col++
    }
  }

  for (const entity of diagram.entities) {
    if (!positions.has(entity.id)) {
      positions.set(entity.id, { x: col * GAP_X, y: 0 })
      col++
    }
  }

  return positions
}

/** Problem mode: group by role in columns */
function layoutProblem(diagram: DiagramSpec): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const roleOrder = ['ude', 'root_cause', 'core_driver', 'contributing_factor', 'constraint', 'gap', 'solution']
  const groups = new Map<string, string[]>()

  for (const entity of diagram.entities) {
    const role = entity.role ?? 'ude'
    const list = groups.get(role) ?? []
    list.push(entity.id)
    groups.set(role, list)
  }

  let col = 0
  for (const role of roleOrder) {
    const members = groups.get(role) ?? []
    members.forEach((id, row) => {
      positions.set(id, { x: col * GAP_X, y: row * GAP_Y })
    })
    if (members.length > 0) col++
  }

  for (const entity of diagram.entities) {
    if (!positions.has(entity.id)) {
      positions.set(entity.id, { x: col * GAP_X, y: 0 })
      col++
    }
  }

  return positions
}

/** System / Auto: spiral layout, most-connected at center */
function layoutSystem(diagram: DiagramSpec): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const n = diagram.entities.length
  if (n === 0) return positions

  const cols = Math.ceil(Math.sqrt(n))
  const connectionCount = new Map<string, number>()
  for (const entity of diagram.entities) {
    connectionCount.set(entity.id, 0)
  }
  for (const rel of diagram.relationships) {
    connectionCount.set(rel.source, (connectionCount.get(rel.source) ?? 0) + 1)
    connectionCount.set(rel.target, (connectionCount.get(rel.target) ?? 0) + 1)
  }

  const sorted = [...diagram.entities].sort((a, b) =>
    (connectionCount.get(b.id) ?? 0) - (connectionCount.get(a.id) ?? 0)
  )

  const centerX = (cols * GAP_X) / 2
  const centerY = (Math.ceil(n / cols) * GAP_Y) / 2

  sorted.forEach((entity, i) => {
    if (i === 0) {
      positions.set(entity.id, { x: centerX, y: centerY })
    } else {
      const ring = Math.ceil(Math.sqrt(i))
      const angleStep = (2 * Math.PI) / Math.max(1, ring * 6)
      const angle = i * angleStep
      const r = ring * Math.min(GAP_X, GAP_Y) * 0.7
      positions.set(entity.id, {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
      })
    }
  })

  return positions
}

/** Helper: order entities following flows_into chain */
function orderByChain(diagram: DiagramSpec) {
  const next = new Map<string, string>()
  const hasIncoming = new Set<string>()
  for (const rel of diagram.relationships) {
    if (rel.type === 'flows_into') {
      next.set(rel.source, rel.target)
      hasIncoming.add(rel.target)
    }
  }

  const start = diagram.entities.find(e => !hasIncoming.has(e.id)) ?? diagram.entities[0]
  const ordered = []
  const visited = new Set<string>()
  let current: string | undefined = start?.id

  while (current && !visited.has(current)) {
    const entity = diagram.entities.find(e => e.id === current)
    if (entity) ordered.push(entity)
    visited.add(current)
    current = next.get(current)
  }

  for (const entity of diagram.entities) {
    if (!visited.has(entity.id)) {
      ordered.push(entity)
    }
  }

  return ordered
}
