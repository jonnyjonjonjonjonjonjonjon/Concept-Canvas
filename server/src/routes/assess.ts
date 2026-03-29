import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { AssessRequest, LayoutAssessment } from '../../../shared/types.ts'
import { categoriseError } from './interpret.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOGS_DIR = resolve(__dirname, '../../logs')
mkdirSync(LOGS_DIR, { recursive: true })

let _client: Anthropic | null = null
function getClient() {
  if (!_client) _client = new Anthropic()
  return _client
}

const ASSESS_PROMPT = `You are a layout quality assessor for Concept Canvas, a speech-to-diagram app.

You will receive a diagram specification (DiagramSpec) with entities, relationships, and spatial_hints that determine where each entity is positioned on a 2D canvas.

## Your Task

1. **Identify the domain** this diagram represents
2. **Adopt the persona** of an expert in that domain
3. **Evaluate the layout** from that expert's perspective
4. **Score 5 criteria** (1-10 each) with brief notes
5. **If any criterion scores below 7**, provide revised_hints for the ENTIRE diagram that fix the issues

## Spatial Hint System

Each entity has a spatial_hint that describes its position:
- { "anchor": true } — the central/starting entity placed at origin
- { "relative_to": "e1", "direction": "above" } — positioned relative to another entity
- { "between": ["e1", "e3"] } — midpoint between two entities

Directions: above, below, left, right, above-left, above-right, below-left, below-right

## What Good Layout Looks Like

### Shape must match the concept
- **Cycles** form a VISUAL CIRCLE — entities arranged clockwise, last entity adjacent to anchor, completing the loop. The eye should be able to trace the circle.
- **Processes** form a HORIZONTAL BAND — left to right, wrapping serpentine if long.
- **Cause/effect** forms an UPWARD TREE — root causes at bottom, effects branching above.
- **Systems** form a RADIAL STAR — central hub with components radiating outward.
- **Problems** form a CROSS/DIAMOND — causes below, symptoms above, solutions right, constraints left.
- **Timelines** form a HORIZONTAL LINE — past left, future right.

### Design principles
- **Minimise edge crossings** — connections should not criss-cross each other
- **Flow follows a consistent direction** — the eye should move smoothly, never backtracking
- **Spread entities across the canvas** — avoid vertical stacking or cramming into one quadrant
- **Use diagonals to create flow** — above-right and below-left create natural reading arcs
- **Adjacent entities in the flow should be adjacent spatially** — no long-distance jumps
- **The last entity in a cycle MUST be near the anchor** to close the visual loop
- **Related entities cluster together** — atmospheric processes near each other, ground processes near each other

### When writing revised_hints
- Provide hints for ALL entities (not just changed ones) so the layout is coherent as a whole
- Exactly one entity must have { "anchor": true }
- Think about the OVERALL SHAPE first, then place individual entities to achieve that shape
- Trace the flow path mentally: can you follow connections from start to finish without the eye jumping randomly?
- Every "relative_to" must reference an entity with a LOWER id

## Understanding Computed Positions
You will also receive the actual pixel positions computed from the spatial hints. In this coordinate system:
- x increases to the RIGHT, y increases DOWNWARD (screen coordinates)
- So "above" means LOWER y value, "below" means HIGHER y value
- Each direction offset is roughly 280px horizontal, 180px vertical (234px for diagonals)
- Use these positions to check if entities actually form the intended shape (circle, line, tree, etc.)
- If two entities have very similar x,y they will overlap — this is bad

## Assessment Criteria

1. **spatial_coherence** — Do positions reflect real-world spatial relationships? (sky above ground, causes below effects, time left-to-right)

2. **flow_readability** — Can a newcomer follow the logical flow? Do connections lead the eye naturally, or criss-cross?

3. **grouping** — Are related entities clustered? Are distinct groups separated?

4. **balance** — Is the diagram spread evenly, or cramped in one area?

5. **expert_intuition** — As a domain expert drawing this on a whiteboard, would you arrange it this way?

## Output Format

Return ONLY valid JSON (no markdown, no explanation):

{
  "expert_persona": "short role name",
  "verdict": "1-2 sentence overall assessment",
  "criteria": {
    "spatial_coherence": { "score": 8, "note": "brief explanation" },
    "flow_readability": { "score": 7, "note": "brief explanation" },
    "grouping": { "score": 9, "note": "brief explanation" },
    "balance": { "score": 6, "note": "brief explanation" },
    "expert_intuition": { "score": 7, "note": "brief explanation" }
  },
  "revised_hints": {
    "e1": { "anchor": true },
    "e2": { "relative_to": "e1", "direction": "above" },
    "e3": { "relative_to": "e2", "direction": "above-right" }
  }
}

## Rules
1. revised_hints is ONLY included if any criterion scores below 7
2. When included, provide hints for ALL entities — not just changed ones
3. Exactly one entity must be the anchor
4. Be specific in notes — reference actual entity labels
5. Score honestly — a perfect layout is rare
6. Return ONLY the JSON — no commentary`

const GAP_X = 280
const GAP_Y = 180
const DIAG = 1.3
const OFFSETS: Record<string, { dx: number; dy: number }> = {
  'above': { dx: 0, dy: -GAP_Y },
  'below': { dx: 0, dy: GAP_Y },
  'left': { dx: -GAP_X, dy: 0 },
  'right': { dx: GAP_X, dy: 0 },
  'above-left': { dx: -GAP_X * DIAG, dy: -GAP_Y * DIAG },
  'above-right': { dx: GAP_X * DIAG, dy: -GAP_Y * DIAG },
  'below-left': { dx: -GAP_X * DIAG, dy: GAP_Y * DIAG },
  'below-right': { dx: GAP_X * DIAG, dy: GAP_Y * DIAG },
}

function computePositionSummary(diagram: { entities: Array<{ id: string; label: string; spatial_hint?: Record<string, unknown> }> }): string {
  const positions: Record<string, { x: number; y: number }> = {}

  // Find anchor
  for (const e of diagram.entities) {
    const h = e.spatial_hint
    if (h && 'anchor' in h) { positions[e.id] = { x: 0, y: 0 }; break }
  }
  if (Object.keys(positions).length === 0 && diagram.entities.length > 0) {
    positions[diagram.entities[0].id] = { x: 0, y: 0 }
  }

  // Iteratively place
  const remaining = diagram.entities.filter(e => !(e.id in positions))
  for (let iter = 0; iter < 20 && remaining.length > 0; iter++) {
    for (let i = remaining.length - 1; i >= 0; i--) {
      const e = remaining[i]
      const h = e.spatial_hint as Record<string, unknown> | undefined
      if (!h) { remaining.splice(i, 1); continue }
      if ('relative_to' in h && typeof h.relative_to === 'string' && h.relative_to in positions) {
        const ref = positions[h.relative_to]
        const off = OFFSETS[h.direction as string] ?? { dx: GAP_X, dy: 0 }
        positions[e.id] = { x: ref.x + off.dx, y: ref.y + off.dy }
        remaining.splice(i, 1)
      } else if ('between' in h && Array.isArray(h.between)) {
        const [a, b] = h.between as string[]
        if (a in positions && b in positions) {
          positions[e.id] = { x: (positions[a].x + positions[b].x) / 2, y: (positions[a].y + positions[b].y) / 2 }
          remaining.splice(i, 1)
        }
      }
    }
  }

  const lines = diagram.entities.map(e => {
    const p = positions[e.id]
    return p ? `${e.id} "${e.label}" → x=${Math.round(p.x)}, y=${Math.round(p.y)}` : `${e.id} "${e.label}" → unplaced`
  })
  return lines.join('\n')
}

export async function assessRoute(req: Request, res: Response) {
  const { diagram } = req.body as AssessRequest

  if (!diagram || !diagram.entities) {
    res.status(400).json({ error: 'diagram is required' })
    return
  }

  try {
    const diagramJson = JSON.stringify(diagram, null, 2)

    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: ASSESS_PROMPT,
      messages: [{ role: 'user', content: `Assess this diagram layout:\n\n${diagramJson}\n\n## Computed Positions\nHere are the actual pixel positions each entity lands at (computed from the spatial hints):\n${computePositionSummary(diagram)}` }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text response from Claude' })
      return
    }

    const assessment: LayoutAssessment = JSON.parse(textBlock.text)

    if (!assessment.criteria || !assessment.verdict) {
      res.status(500).json({ error: 'Invalid assessment structure from Claude' })
      return
    }

    // Log assessment for debugging
    const logEntry = {
      timestamp: new Date().toISOString(),
      title: diagram.title,
      mode: diagram.detected_mode,
      entityCount: diagram.entities.length,
      hints_before: Object.fromEntries(
        diagram.entities.map(e => [e.id, { label: e.label, hint: e.spatial_hint }])
      ),
      scores: Object.fromEntries(
        Object.entries(assessment.criteria).map(([k, v]) => [k, v.score])
      ),
      verdict: assessment.verdict,
      has_revisions: !!assessment.revised_hints,
      revised_hints: assessment.revised_hints ?? null,
    }
    const logFile = resolve(LOGS_DIR, `assess-${Date.now()}.json`)
    writeFileSync(logFile, JSON.stringify(logEntry, null, 2))
    console.log(`[assess] Logged to ${logFile}`)

    res.json({ assessment })
  } catch (error) {
    console.error('[assess] Error:', error)
    const { status, message, code } = categoriseError(error)
    res.status(status).json({ error: message, code })
  }
}
