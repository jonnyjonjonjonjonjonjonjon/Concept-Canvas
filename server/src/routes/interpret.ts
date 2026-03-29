import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import type { InterpretRequest, DiagramSpec } from '../../../shared/types.ts'
import { getMockDiagram } from '../mocks.ts'

let _client: Anthropic | null = null
function getClient() {
  if (!_client) _client = new Anthropic()
  return _client
}

const SYSTEM_PROMPT = `You are a semantic interpretation engine for Concept Canvas, a speech-to-diagram app.

Your job: take a spoken transcript and extract the conceptual structure as a diagram specification. You identify entities, their types, and how they relate to each other.

## Output Format
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "title": "Short title for the diagram",
  "summary": "1-2 sentence summary of what was explained",
  "detected_mode": "<one of: auto, process, cycle, cause_effect, system, timeline, containment, problem>",
  "entities": [
    {
      "id": "e1",
      "label": "Short label",
      "type": "<one of: actor, object, process, concept, environment, event>",
      "icon_name": "<lucide icon name like 'coffee', 'flame', 'user', 'cog'>",
      "description": "Brief description of this entity from the transcript",
      "is_gap": false,
      "reveal_order": 1,
      "role": null,
      "spatial_hint": { "anchor": true }
    }
  ],
  "relationships": [
    {
      "source": "e1",
      "target": "e2",
      "type": "<one of: flows_into, causes, contains, interacts_with, transforms_into, opposes>",
      "label": "optional edge label",
      "reveal_order": 1
    }
  ],
  "step_annotations": {
    "1": "Brief narration of what appears at step 1",
    "2": "Brief narration of what appears at step 2"
  }
}

## Entity Types
- actor: Things that DO (people, organisations, machines, agents)
- object: Things that ARE (physical items, data, materials, resources)
- process: Things that HAPPEN (actions, steps, transformations, activities)
- concept: Abstract forces (ideas, pressures, qualities, principles)
- environment: Where things happen (places, contexts, containers, systems)
- event: Moments that change things (triggers, transitions, milestones)

## Relationship Types
- flows_into: Sequential flow ("then", "next", "leads to" in a process)
- causes: Causal link ("because", "results in", "leads to" causally)
- contains: Nesting ("within", "inside", "part of")
- interacts_with: Bidirectional ("works with", "affects each other")
- transforms_into: Metamorphosis ("becomes", "turns into", "evolves to")
- opposes: Tension ("blocks", "prevents", "conflicts with")

## Structural Modes
Detect the best mode from the transcript, or use the user-specified mode:
- process: Linear steps or workflow → use flows_into chains
- cycle: Repeating loop → use flows_into in a circle, last connects to first
- cause_effect: Causal chains → use causes relationships
- system: Interconnected parts → use interacts_with, contains
- timeline: Chronological events → use flows_into with event entities
- containment: Nested structures → use contains relationships
- problem: Problem analysis → assign roles (ude, root_cause, core_driver, contributing_factor, constraint, solution, gap)
- auto: You decide the best fit

## Icon Names
Use common Lucide icon names. Examples: user, users, cog, flame, coffee, arrow-right, cloud, database, server, heart, star, zap, shield, target, flag, clock, map-pin, truck, factory, lightbulb, brain, eye, lock, unlock, trending-up, trending-down, alert-triangle, check-circle, x-circle, package, box, layers, git-branch, workflow, repeat, shuffle, filter, search, settings, tool, wrench, hammer, paintbrush, pen, file, folder, globe, building, home, store, shopping-cart, dollar-sign, credit-card, bar-chart, pie-chart, activity, thermometer, droplet, sun, moon, wind, leaf, tree, mountain, waves

## Reveal Order
Assign reveal_order starting from 1. This controls the step-by-step build animation:
- Entities and relationships with the same reveal_order appear together
- Usually: introduce an entity, then show its outgoing relationships in the next step
- For processes: reveal in sequence (entity1=1, rel1=2, entity2=3, rel2=4...)
- For systems: reveal core entities first, then connections

## Step Annotations
For each reveal_order step (1 through the maximum), provide a short annotation in step_annotations.
Each annotation should be a single sentence (max ~15 words) that narrates what is appearing at that step and why it matters.
Write from the perspective of a teacher walking the viewer through the concept.
Examples:
- "Water evaporates from oceans and lakes into the atmosphere"
- "Rising moisture cools and condenses into cloud formations"
- "Gravity pulls precipitation back to Earth as rain or snow"

## Spatial Hints
Every entity MUST have a spatial_hint that describes where it belongs relative to other entities.
This captures real-world or conceptual spatial relationships — where things would naturally appear
if you were looking at the real scene or drawing the concept on a whiteboard.

Exactly one entity should be the anchor — this is the central or starting entity:
  "spatial_hint": { "anchor": true }

All other entities describe their position relative to an already-defined entity:
  "spatial_hint": { "relative_to": "e1", "direction": "above" }

For entities that logically sit between two others:
  "spatial_hint": { "between": ["e1", "e3"] }

Directions: above, below, left, right, above-left, above-right, below-left, below-right

### Universal Layout Rules
Follow these for EVERY diagram regardless of mode:
1. ONE dominant flow direction — pick horizontal (left-to-right) or vertical (top-to-bottom) and be consistent. Don't mix.
2. Connected entities MUST be spatial neighbours — if A flows_into B, place B directly adjacent to A, not separated by other entities.
3. NO backtracking — edges should never flow opposite to the dominant direction. In a left-to-right flow, nothing should point leftward.
4. Edge length uniformity — all connections should span roughly the same distance. Avoid some entities tightly packed while others are far apart.
5. Entry point at top-left — the anchor or first entity goes at the top-left (for horizontal flow) or top-center (for radial/vertical layouts).
6. Group related entities — same type or same phase should cluster spatially. Inter-group gaps should be larger than intra-group gaps.
7. Landscape orientation — the overall layout should be wider than tall to match screen shape. Prefer spreading horizontally over stacking vertically.
8. Minimize edge crossings — arrange entities so connections don't cross each other. This is the #1 factor in diagram readability.
9. Max 7 entities per row — if a sequence exceeds 7, wrap to a new row.

### Layout recipes by mode
These describe the SHAPE the diagram should form:

**process**: Anchor the first step at top-left. Each subsequent step goes "right". After 7 steps, serpentine wrap: step 8 goes "below" step 7, then steps 9+ continue "left" (second row reads right-to-left). The overall shape is a horizontal band, wider than tall.

**cycle**: The layout engine will arrange cycle entities in a circle automatically. Assign spatial hints that reflect the real-world clockwise progression. Anchor the starting entity. Each step proceeds in a natural clockwise direction relative to its predecessor. The overall shape is circular.

**cause_effect**: Anchor the deepest root cause at top-left. Effects branch to the right and below. If a cause has multiple effects, spread them using "right" and "below-right". Parent entities should be to the left of their child effects. Max 3 levels deep — group intermediate causes if deeper. The overall shape is a tree growing LEFT-TO-RIGHT.

**timeline**: Anchor the earliest event at top-left. Each subsequent event goes "right". Concurrent events stack "above"/"below" at the same horizontal position. Max 7 per row, then serpentine. The overall shape is a horizontal timeline.

**containment**: Anchor the outermost container at top-left. Children go "right" and "below". Nested children go further right of their parent. The overall shape is a hierarchy tree, wider than tall.

**system**: Anchor the most-connected entity at center. Primary subsystems radiate outward matching their real-world position. Secondary components go adjacent to their primary. The overall shape is a radial star.

**problem**: Anchor the core problem at left. Root causes go "below" and "below-right". Symptoms go "above" and "above-right". Solutions go "right". Constraints go "below-left". The overall shape is wider than tall.

**auto**: Choose the best recipe above based on the transcript content.

### Abstract topic spatial metaphors
Even abstract topics should use spatial metaphors:
- Hierarchy: authority/importance top-to-bottom (CEO above, employees below)
- Causation: causes below, effects above (foundation at bottom)
- Time: past on left, future on right
- Opposition: opposing forces on left vs right
- Scope: broad/general above, specific/detailed below
- Input/Output: inputs left, outputs right
- Positive/Negative: positive above or right, negative below or left

### Rules for spatial_hint
1. Exactly ONE entity has { "anchor": true } — pick the most central concept
2. Every other entity references an entity with a LOWER id (already defined above it)
3. For "between", both referenced entities must have lower ids
4. Prefer direct relative_to over between — use between only when truly midway

## Problem Mode Roles
Only assign roles when detected_mode is "problem":
- ude: Undesirable Effect (symptom the speaker complains about)
- root_cause: Underlying cause
- core_driver: The root cause with the most influence
- contributing_factor: Makes things worse but isn't the root cause
- constraint: Blocks potential solutions
- solution: Proposed fix
- gap: Something unknown or uninvestigated (set is_gap=true too)

## Rules
1. Extract ALL meaningful concepts from the transcript — don't skip things
2. Keep labels short (2-4 words)
3. Descriptions should capture the detail from the transcript that the label compresses
4. Use IDs like e1, e2, e3... for entities
5. Every entity should connect to at least one other entity
6. Aim for 4-12 entities depending on transcript complexity
7. Every entity MUST include a spatial_hint — anchor for one, relative direction for the rest
8. Return ONLY the JSON — no commentary, no markdown fences`

export async function interpretRoute(req: Request, res: Response) {
  const { transcript, mode } = req.body as InterpretRequest

  if (!transcript) {
    res.status(400).json({ error: 'transcript is required' })
    return
  }

  if (process.env.MOCK_MODE === 'true') {
    console.log(`[interpret] Mock mode — returning pre-built diagram`)
    const diagram = getMockDiagram(transcript)
    res.json({ diagram })
    return
  }

  const userMessage = mode && mode !== 'auto'
    ? `[Mode: ${mode}] ${transcript}`
    : transcript

  try {
    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text response from Claude' })
      return
    }

    const diagram: DiagramSpec = JSON.parse(textBlock.text)

    if (!diagram.entities || !diagram.relationships || !diagram.title) {
      res.status(500).json({ error: 'Invalid diagram structure from Claude' })
      return
    }

    if (!diagram.step_annotations) {
      diagram.step_annotations = {}
    }

    sanitizeSpatialHints(diagram)

    res.json({ diagram })
  } catch (error) {
    console.error('[interpret] Error:', error)
    const { status, message, code } = categoriseError(error)
    res.status(status).json({ error: message, code })
  }
}

export function categoriseError(error: unknown): { status: number; message: string; code: string } {
  const raw = error instanceof Error ? error.message : String(error)

  if (raw.includes('credit balance')) {
    return { status: 402, message: 'API credits have run out. Please top up your Anthropic account.', code: 'credits_exhausted' }
  }
  if (raw.includes('rate') || (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429)) {
    return { status: 429, message: 'Too many requests. Please wait a moment and try again.', code: 'rate_limited' }
  }
  if (raw.includes('Could not resolve authentication') || raw.includes('api_key') || raw.includes('API key')) {
    return { status: 401, message: 'API key is missing or invalid. Check your .env file.', code: 'auth_error' }
  }
  if (error instanceof SyntaxError || raw.includes('Unexpected token') || raw.includes('JSON')) {
    return { status: 502, message: 'Got an unexpected response from Claude. Please try again.', code: 'parse_error' }
  }
  if (raw.includes('ECONNREFUSED') || raw.includes('ETIMEDOUT') || raw.includes('fetch failed')) {
    return { status: 503, message: 'Cannot reach the Claude API. Check your internet connection.', code: 'network_error' }
  }

  return { status: 500, message: raw || 'Something went wrong. Please try again.', code: 'unknown_error' }
}

const VALID_DIRECTIONS = new Set([
  'above', 'below', 'left', 'right',
  'above-left', 'above-right', 'below-left', 'below-right',
])

function sanitizeSpatialHints(diagram: DiagramSpec) {
  const entityIds = new Set(diagram.entities.map(e => e.id))
  let hasAnchor = false

  for (const entity of diagram.entities) {
    const hint = entity.spatial_hint
    if (!hint) continue

    if ('anchor' in hint) {
      if (hasAnchor) {
        // Only one anchor allowed — strip extras
        delete entity.spatial_hint
      } else {
        hasAnchor = true
      }
    } else if ('relative_to' in hint) {
      if (!entityIds.has(hint.relative_to) || !VALID_DIRECTIONS.has(hint.direction)) {
        delete entity.spatial_hint
      }
    } else if ('between' in hint) {
      if (!Array.isArray(hint.between) || hint.between.length !== 2 ||
          !entityIds.has(hint.between[0]) || !entityIds.has(hint.between[1])) {
        delete entity.spatial_hint
      }
    } else {
      delete entity.spatial_hint
    }
  }
}
