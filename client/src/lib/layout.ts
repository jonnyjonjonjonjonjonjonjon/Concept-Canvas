import type { DiagramSpec, StructuralMode, Entity, SpatialHint } from '../../../shared/types.ts'
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

  const edges: Edge[] = diagram.relationships.map((rel, i) => {
    const sourcePos = positions.get(rel.source)
    const targetPos = positions.get(rel.target)
    const handles = sourcePos && targetPos
      ? getBestHandles(sourcePos, targetPos)
      : { sourceHandle: 'right', targetHandle: 'left' }

    return {
      id: `edge-${i}`,
      source: rel.source,
      target: rel.target,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      type: 'concept',
      data: {
        relationship: rel,
        isVisible: rel.reveal_order <= currentStep,
      },
    }
  })

  return { nodes, edges }
}

/** Determine which handle sides to use based on relative node positions */
function getBestHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  const dx = targetPos.x - sourcePos.x
  const dy = targetPos.y - sourcePos.y
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  // Diagonal: when both axes have significant movement (within 2x of each other)
  const isDiagonal = absDx > 0 && absDy > 0 && absDx / absDy < 2 && absDy / absDx < 2
  if (isDiagonal) {
    if (dx > 0 && dy < 0) return { sourceHandle: 'top', targetHandle: 'left' }      // above-right
    if (dx < 0 && dy < 0) return { sourceHandle: 'top', targetHandle: 'right' }     // above-left
    if (dx > 0 && dy > 0) return { sourceHandle: 'bottom', targetHandle: 'left' }   // below-right
    if (dx < 0 && dy > 0) return { sourceHandle: 'bottom', targetHandle: 'right' }  // below-left
  }

  if (absDx > absDy) {
    // Horizontal dominant
    return dx > 0
      ? { sourceHandle: 'right', targetHandle: 'left' }
      : { sourceHandle: 'left', targetHandle: 'right' }
  } else {
    // Vertical dominant
    return dy > 0
      ? { sourceHandle: 'bottom', targetHandle: 'top' }
      : { sourceHandle: 'top', targetHandle: 'bottom' }
  }
}

function computePositions(
  diagram: DiagramSpec,
  mode: StructuralMode
): Map<string, { x: number; y: number }> {
  // Use spatial layout if any entity has spatial hints
  const hasSpatialHints = diagram.entities.some(e => e.spatial_hint)
  if (hasSpatialHints) {
    return layoutSpatial(diagram)
  }

  // Fallback to mode-specific layouts (for old saved canvases)
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

// ── Spatial Layout ──────────────────────────────────────────────

const DIRECTION_OFFSETS: Record<string, { dx: number; dy: number }> = {
  'above':       { dx: 0,      dy: -GAP_Y },
  'below':       { dx: 0,      dy: GAP_Y },
  'left':        { dx: -GAP_X, dy: 0 },
  'right':       { dx: GAP_X,  dy: 0 },
  'above-left':  { dx: -GAP_X * 1.3, dy: -GAP_Y * 1.3 },
  'above-right': { dx: GAP_X * 1.3,  dy: -GAP_Y * 1.3 },
  'below-left':  { dx: -GAP_X * 1.3, dy: GAP_Y * 1.3 },
  'below-right': { dx: GAP_X * 1.3,  dy: GAP_Y * 1.3 },
}

function layoutSpatial(diagram: DiagramSpec): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const entityMap = new Map<string, Entity>()
  for (const e of diagram.entities) entityMap.set(e.id, e)

  // Phase 1: Build placement order
  const { ordered, fallbacks } = buildPlacementOrder(diagram.entities)

  // Phase 2: Place entities
  for (const entity of ordered) {
    const hint = entity.spatial_hint as SpatialHint
    if ('anchor' in hint) {
      positions.set(entity.id, { x: 0, y: 0 })
    } else if ('between' in hint) {
      const [idA, idB] = hint.between
      const posA = positions.get(idA)
      const posB = positions.get(idB)
      if (posA && posB) {
        const candidate = { x: (posA.x + posB.x) / 2, y: (posA.y + posB.y) / 2 }
        positions.set(entity.id, deconflictPoint(candidate, positions))
      } else {
        fallbacks.push(entity)
      }
    } else if ('relative_to' in hint) {
      const refPos = positions.get(hint.relative_to)
      if (refPos) {
        const offset = DIRECTION_OFFSETS[hint.direction] ?? { dx: GAP_X, dy: 0 }
        const candidate = { x: refPos.x + offset.dx, y: refPos.y + offset.dy }
        positions.set(entity.id, deconflictPoint(candidate, positions))
      } else {
        fallbacks.push(entity)
      }
    }
  }

  // Place fallback entities to the right of everything
  if (fallbacks.length > 0) {
    let maxX = 0
    for (const pos of positions.values()) {
      if (pos.x > maxX) maxX = pos.x
    }
    fallbacks.forEach((entity, i) => {
      if (!positions.has(entity.id)) {
        positions.set(entity.id, { x: maxX + GAP_X * 1.5, y: i * GAP_Y })
      }
    })
  }

  // Phase 2.5: Cycle closure — override with circular layout
  if (diagram.detected_mode === 'cycle') {
    closeCycle(diagram, positions)
  }

  // Phase 3: Global deconflict pass
  globalDeconflict(positions)

  return positions
}

/** For cycle diagrams, redistribute chain entities around a circle */
function closeCycle(
  diagram: DiagramSpec,
  positions: Map<string, { x: number; y: number }>
) {
  const chain = orderByChain(diagram)
  if (chain.length < 3) return

  const n = chain.length
  const radius = Math.max(200, n * 55)
  const centerX = 0
  const centerY = 0

  chain.forEach((entity, i) => {
    // Start at bottom-center, go clockwise
    // In screen coords: y increases downward, so bottom = positive y
    // angle 0 = right, π/2 = down (screen), π = left, 3π/2 = up (screen)
    const angle = Math.PI / 2 + (2 * Math.PI * i) / n
    positions.set(entity.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    })
  })
}

function buildPlacementOrder(entities: Entity[]): { ordered: Entity[]; fallbacks: Entity[] } {
  const ordered: Entity[] = []
  const fallbacks: Entity[] = []
  const placed = new Set<string>()
  const remaining = [...entities]

  // Find anchor first
  const anchorIdx = remaining.findIndex(e => e.spatial_hint && 'anchor' in e.spatial_hint)
  if (anchorIdx >= 0) {
    const [anchor] = remaining.splice(anchorIdx, 1)
    ordered.push(anchor)
    placed.add(anchor.id)
  } else if (remaining.length > 0) {
    // No anchor — treat first entity as anchor
    const [first] = remaining.splice(0, 1)
    ordered.push(first)
    placed.add(first.id)
  }

  // Iteratively place entities whose references are already placed
  let progress = true
  while (progress && remaining.length > 0) {
    progress = false
    for (let i = remaining.length - 1; i >= 0; i--) {
      const entity = remaining[i]
      const hint = entity.spatial_hint
      if (!hint) {
        remaining.splice(i, 1)
        fallbacks.push(entity)
        progress = true
        continue
      }

      let canPlace = false
      if ('anchor' in hint) {
        // Extra anchor — treat as fallback
        remaining.splice(i, 1)
        fallbacks.push(entity)
        progress = true
        continue
      } else if ('relative_to' in hint) {
        canPlace = placed.has(hint.relative_to)
      } else if ('between' in hint) {
        canPlace = placed.has(hint.between[0]) && placed.has(hint.between[1])
      }

      if (canPlace) {
        remaining.splice(i, 1)
        ordered.push(entity)
        placed.add(entity.id)
        progress = true
      }
    }
  }

  // Anything still remaining has unresolvable references
  for (const entity of remaining) {
    fallbacks.push(entity)
  }

  return { ordered, fallbacks }
}

const MIN_DIST_X = GAP_X * 0.7
const MIN_DIST_Y = GAP_Y * 0.7

function deconflictPoint(
  candidate: { x: number; y: number },
  positions: Map<string, { x: number; y: number }>
): { x: number; y: number } {
  for (let attempt = 0; attempt < 4; attempt++) {
    let conflict = false
    for (const pos of positions.values()) {
      if (Math.abs(candidate.x - pos.x) < MIN_DIST_X && Math.abs(candidate.y - pos.y) < MIN_DIST_Y) {
        conflict = true
        break
      }
    }
    if (!conflict) return candidate
    // Nudge: try shifting right, then down, then right+down
    const nudges = [
      { x: GAP_X * 0.5, y: 0 },
      { x: 0, y: GAP_Y * 0.5 },
      { x: GAP_X * 0.5, y: GAP_Y * 0.5 },
      { x: -GAP_X * 0.5, y: 0 },
    ]
    const nudge = nudges[attempt]
    candidate = { x: candidate.x + nudge.x, y: candidate.y + nudge.y }
  }
  return candidate
}

function globalDeconflict(positions: Map<string, { x: number; y: number }>) {
  const ids = [...positions.keys()]
  for (let pass = 0; pass < 10; pass++) {
    let hadConflict = false
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const posA = positions.get(ids[i])!
        const posB = positions.get(ids[j])!
        if (Math.abs(posA.x - posB.x) < MIN_DIST_X && Math.abs(posA.y - posB.y) < MIN_DIST_Y) {
          const dx = posB.x - posA.x
          const dy = posB.y - posA.y
          // Push both apart symmetrically for better distribution
          const pushX = dx === 0 ? GAP_X * 0.5 : 0
          const pushY = dy === 0 ? GAP_Y * 0.5 : 0
          if (Math.abs(dx) <= Math.abs(dy)) {
            // Separate horizontally
            const shift = pushX || GAP_X * 0.5
            positions.set(ids[i], { x: posA.x - shift, y: posA.y })
            positions.set(ids[j], { x: posB.x + shift, y: posB.y })
          } else {
            // Separate vertically
            const shift = pushY || GAP_Y * 0.5
            positions.set(ids[i], { x: posA.x, y: posA.y - shift })
            positions.set(ids[j], { x: posB.x, y: posB.y + shift })
          }
          hadConflict = true
        }
      }
    }
    if (!hadConflict) break
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
