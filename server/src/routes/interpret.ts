import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import type { InterpretRequest, DiagramSpec } from '../../../shared/types.ts'

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
      "role": null
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
7. Return ONLY the JSON — no commentary, no markdown fences`

export async function interpretRoute(req: Request, res: Response) {
  const { transcript, mode } = req.body as InterpretRequest

  if (!transcript) {
    res.status(400).json({ error: 'transcript is required' })
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

    res.json({ diagram })
  } catch (error) {
    console.error('[interpret] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
}
