import type { DiagramSpec } from '../../../shared/types.ts'

const ANIM_DURATION = 700
const MS_PER_CHAR = 25
const MS_PER_EXTRA_ELEMENT = 200
const MIN_HOLD = 500

/**
 * Returns the node IDs the camera should focus on for a given step.
 * Includes newly-appearing entities AND the endpoints of newly-appearing relationships.
 * NOT cumulative — only includes earlier entities if they're directly connected at this step.
 */
export function getFocusNodeIds(diagram: DiagramSpec, step: number): string[] {
  if (step <= 0) return []

  const ids = new Set<string>()

  // Entities appearing at this step
  for (const entity of diagram.entities) {
    if (entity.reveal_order === step) {
      ids.add(entity.id)
    }
  }

  // Relationships appearing at this step — include both endpoints
  for (const rel of diagram.relationships) {
    if (rel.reveal_order === step) {
      ids.add(rel.source)
      ids.add(rel.target)
    }
  }

  // Filter out any entity not yet visible (reveal_order > step)
  const visibleIds = new Set(
    diagram.entities.filter(e => e.reveal_order <= step).map(e => e.id)
  )

  return [...ids].filter(id => visibleIds.has(id))
}

/**
 * Computes dynamic timing for a given step based on annotation length and complexity.
 */
export function getStepTiming(
  diagram: DiagramSpec,
  step: number
): { total: number; animDuration: number; holdDuration: number } {
  if (step <= 0) {
    return { total: 100, animDuration: 0, holdDuration: 100 }
  }

  const annotation = diagram.step_annotations?.[step] ?? ''
  const readingTime = annotation.length * MS_PER_CHAR

  const newEntities = diagram.entities.filter(e => e.reveal_order === step).length
  const newRels = diagram.relationships.filter(r => r.reveal_order === step).length
  const totalNew = newEntities + newRels
  const complexityTime = Math.max(0, (totalNew - 1) * MS_PER_EXTRA_ELEMENT)

  const holdDuration = Math.max(MIN_HOLD, readingTime + complexityTime)

  return {
    total: ANIM_DURATION + holdDuration,
    animDuration: ANIM_DURATION,
    holdDuration,
  }
}
