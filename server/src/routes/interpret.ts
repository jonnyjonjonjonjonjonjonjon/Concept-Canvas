import type { Request, Response } from 'express'
import type { InterpretRequest, DiagramSpec } from '../../../shared/types.ts'

// Mock response for development — will be replaced with real Claude API call
const MOCK_DIAGRAM: DiagramSpec = {
  title: 'How Coffee Gets from Farm to Cup',
  summary: 'The journey of coffee from agricultural production through processing, shipping, roasting, and distribution.',
  detected_mode: 'process',
  entities: [
    { id: 'e1', label: 'Coffee Farmer', type: 'actor', icon_name: 'tractor', description: 'Usually based in countries like Colombia or Ethiopia.', is_gap: false, reveal_order: 1 },
    { id: 'e2', label: 'Harvesting', type: 'process', icon_name: 'hand', description: 'Cherries picked when ripe, usually by hand.', is_gap: false, reveal_order: 2 },
    { id: 'e3', label: 'Processing', type: 'process', icon_name: 'filter', description: 'Beans extracted from cherries, then washed or dried.', is_gap: false, reveal_order: 3 },
    { id: 'e4', label: 'Shipping', type: 'process', icon_name: 'ship', description: 'Green beans transported to roasters by sea.', is_gap: false, reveal_order: 4 },
    { id: 'e5', label: 'Roasting', type: 'process', icon_name: 'flame', description: 'Beans roasted at different temperatures for flavour.', is_gap: false, reveal_order: 5 },
    { id: 'e6', label: 'Distribution', type: 'process', icon_name: 'store', description: 'Roasted beans go to cafés or supermarkets.', is_gap: false, reveal_order: 6 },
    { id: 'e7', label: 'Brewing & Drinking', type: 'process', icon_name: 'coffee', description: 'Someone grinds, brews, and drinks the coffee.', is_gap: false, reveal_order: 7 },
  ],
  relationships: [
    { source: 'e1', target: 'e2', type: 'flows_into', reveal_order: 1 },
    { source: 'e2', target: 'e3', type: 'flows_into', reveal_order: 2 },
    { source: 'e3', target: 'e4', type: 'flows_into', reveal_order: 3 },
    { source: 'e4', target: 'e5', type: 'flows_into', reveal_order: 4 },
    { source: 'e5', target: 'e6', type: 'flows_into', reveal_order: 5 },
    { source: 'e6', target: 'e7', type: 'flows_into', reveal_order: 6 },
  ],
}

export async function interpretRoute(req: Request, res: Response) {
  const { transcript, mode } = req.body as InterpretRequest

  if (!transcript) {
    res.status(400).json({ error: 'transcript is required' })
    return
  }

  // TODO: Replace with real Claude API call
  // For now, return mock data regardless of input
  console.log(`[interpret] mode=${mode}, transcript=${transcript.substring(0, 80)}...`)

  res.json({ diagram: MOCK_DIAGRAM })
}
