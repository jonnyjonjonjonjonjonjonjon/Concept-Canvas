import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import type { AssessRequest, LayoutAssessment } from '../../../shared/types.ts'

let _client: Anthropic | null = null
function getClient() {
  if (!_client) _client = new Anthropic()
  return _client
}

const ASSESS_PROMPT = `You are a layout quality assessor for Concept Canvas, a speech-to-diagram app.

You will receive a diagram specification (DiagramSpec) with entities, relationships, and spatial_hints that determine where each entity is positioned on a 2D canvas.

## Your Task

1. **Identify the domain** this diagram represents (e.g. hydrology, project management, biology)
2. **Adopt the persona** of an expert in that domain
3. **Evaluate the layout** from that expert's perspective — would this spatial arrangement help a newcomer understand the concept, or does it confuse?
4. **Score 5 criteria** (1-10 each) with brief notes
5. **If any criterion scores below 7**, provide revised spatial_hints to fix the issues

## Spatial Hint System

Each entity has a spatial_hint that describes its position:
- { "anchor": true } — the central/starting entity placed at origin
- { "relative_to": "e1", "direction": "above" } — positioned relative to another entity
- { "between": ["e1", "e3"] } — midpoint between two entities

Directions: above, below, left, right, above-left, above-right, below-left, below-right

## Assessment Criteria

1. **spatial_coherence** — Do positions reflect real-world spatial relationships? Would an expert in this field recognise the arrangement? (e.g. sky above ground, causes below effects, time flowing left-to-right)

2. **flow_readability** — Can a newcomer follow the logical flow? Do connections lead the eye naturally through the concept, or do they criss-cross and double back?

3. **grouping** — Are related entities clustered near each other? Are distinct groups visually separated? Does proximity reflect conceptual relatedness?

4. **balance** — Is the diagram spread evenly across the canvas? Or is it cramped in one area with empty space elsewhere? Does the overall shape feel intentional?

5. **expert_intuition** — As a domain expert: if you were drawing this on a whiteboard to explain to a colleague, would you arrange it this way? Does the spatial metaphor match how practitioners actually think about this concept?

## Output Format

Return ONLY valid JSON (no markdown, no explanation):

{
  "expert_persona": "short role name, e.g. Hydrologist",
  "verdict": "1-2 sentence overall assessment",
  "criteria": {
    "spatial_coherence": { "score": 8, "note": "brief explanation" },
    "flow_readability": { "score": 7, "note": "brief explanation" },
    "grouping": { "score": 9, "note": "brief explanation" },
    "balance": { "score": 6, "note": "brief explanation" },
    "expert_intuition": { "score": 7, "note": "brief explanation" }
  },
  "revised_hints": {
    "e3": { "relative_to": "e1", "direction": "below" },
    "e5": { "anchor": true }
  }
}

## Rules
1. revised_hints is ONLY included if any criterion scores below 7
2. revised_hints contains ONLY the entities whose hints should change — omit entities that are fine
3. Exactly one entity across the whole diagram must be the anchor (if you move the anchor, include the new one in revised_hints)
4. Be specific in notes — reference actual entity labels, not just IDs
5. Score honestly — a perfect layout is rare, most will have areas for improvement
6. Return ONLY the JSON — no commentary`

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
      messages: [{ role: 'user', content: `Assess this diagram layout:\n\n${diagramJson}` }],
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

    res.json({ assessment })
  } catch (error) {
    console.error('[assess] Error:', error)
    const errMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: errMessage })
  }
}
