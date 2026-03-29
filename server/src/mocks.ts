import type { DiagramSpec, LayoutAssessment } from '../../shared/types.ts'

// ── Water Cycle (cycle mode) ─────────────────────────────────
const WATER_CYCLE: DiagramSpec = {
  title: 'The Water Cycle',
  summary: 'Water continuously moves through evaporation, condensation, precipitation, and runoff in an endless cycle.',
  detected_mode: 'cycle',
  entities: [
    { id: 'e1', label: 'Oceans & Lakes', type: 'environment', icon_name: 'waves', description: 'Large bodies of water where the cycle begins and ends', is_gap: false, reveal_order: 1, spatial_hint: { anchor: true } },
    { id: 'e2', label: 'Evaporation', type: 'process', icon_name: 'trending-up', description: 'Water transforms from liquid to vapor and rises from water bodies', is_gap: false, reveal_order: 2, spatial_hint: { relative_to: 'e1', direction: 'above' } },
    { id: 'e3', label: 'Atmosphere', type: 'environment', icon_name: 'cloud', description: 'Where water vapor rises, cools, and begins to condense', is_gap: false, reveal_order: 3, spatial_hint: { relative_to: 'e2', direction: 'above-right' } },
    { id: 'e4', label: 'Condensation', type: 'process', icon_name: 'droplet', description: 'Water vapor cools and transforms into liquid droplets forming clouds', is_gap: false, reveal_order: 4, spatial_hint: { relative_to: 'e3', direction: 'right' } },
    { id: 'e5', label: 'Clouds', type: 'object', icon_name: 'cloud', description: 'Visible masses of condensed water droplets suspended in atmosphere', is_gap: false, reveal_order: 5, spatial_hint: { relative_to: 'e4', direction: 'below-right' } },
    { id: 'e6', label: 'Precipitation', type: 'process', icon_name: 'cloud-rain', description: 'Water falls from clouds as rain, snow, sleet, or hail', is_gap: false, reveal_order: 6, spatial_hint: { relative_to: 'e5', direction: 'below' } },
    { id: 'e7', label: 'Surface Runoff', type: 'process', icon_name: 'arrow-right', description: 'Water flows over land into rivers, streams, and back to the ocean', is_gap: false, reveal_order: 7, spatial_hint: { relative_to: 'e6', direction: 'below-left' } },
    { id: 'e8', label: 'Infiltration', type: 'process', icon_name: 'arrow-down', description: 'Water soaks into the ground becoming groundwater', is_gap: false, reveal_order: 8, spatial_hint: { relative_to: 'e7', direction: 'left' } },
  ],
  relationships: [
    { source: 'e1', target: 'e2', type: 'flows_into', label: 'heats up', reveal_order: 2 },
    { source: 'e2', target: 'e3', type: 'flows_into', label: 'rises into', reveal_order: 3 },
    { source: 'e3', target: 'e4', type: 'flows_into', label: 'cools', reveal_order: 4 },
    { source: 'e4', target: 'e5', type: 'flows_into', label: 'forms', reveal_order: 5 },
    { source: 'e5', target: 'e6', type: 'flows_into', label: 'releases', reveal_order: 6 },
    { source: 'e6', target: 'e7', type: 'flows_into', label: 'falls to ground', reveal_order: 7 },
    { source: 'e7', target: 'e1', type: 'flows_into', label: 'returns to', reveal_order: 8 },
    { source: 'e6', target: 'e8', type: 'flows_into', label: 'soaks in', reveal_order: 8 },
    { source: 'e8', target: 'e1', type: 'flows_into', label: 'feeds back', reveal_order: 8 },
  ],
  step_annotations: {
    1: 'The cycle begins at oceans and lakes, vast bodies of surface water',
    2: 'Heat from the sun causes water to evaporate into vapor',
    3: 'Water vapor rises into the atmosphere where it begins to cool',
    4: 'Cooling vapor condenses into tiny water droplets',
    5: 'Droplets accumulate into visible clouds',
    6: 'Heavy clouds release precipitation — rain, snow, or hail',
    7: 'Water flows over land as runoff, returning to oceans',
    8: 'Some water infiltrates the ground, eventually rejoining the cycle',
  },
}

// ── Coffee Process (process mode) ────────────────────────────
const COFFEE_PROCESS: DiagramSpec = {
  title: 'From Farm to Cup: The Coffee Journey',
  summary: 'Coffee travels from tropical farms through harvesting, processing, shipping, roasting, and brewing before reaching your cup.',
  detected_mode: 'process',
  entities: [
    { id: 'e1', label: 'Coffee Farm', type: 'environment', icon_name: 'tree', description: 'Tropical farms in Colombia, Ethiopia, or Brazil where coffee plants grow', is_gap: false, reveal_order: 1, spatial_hint: { anchor: true } },
    { id: 'e2', label: 'Harvesting', type: 'process', icon_name: 'hand', description: 'Ripe coffee cherries are hand-picked from the plants', is_gap: false, reveal_order: 2, spatial_hint: { relative_to: 'e1', direction: 'right' } },
    { id: 'e3', label: 'Processing', type: 'process', icon_name: 'filter', description: 'Beans extracted from cherries by washing or natural drying methods', is_gap: false, reveal_order: 3, spatial_hint: { relative_to: 'e2', direction: 'right' } },
    { id: 'e4', label: 'Green Beans', type: 'object', icon_name: 'package', description: 'Processed beans dried and sorted, ready for export', is_gap: false, reveal_order: 4, spatial_hint: { relative_to: 'e3', direction: 'right' } },
    { id: 'e5', label: 'Shipping', type: 'process', icon_name: 'truck', description: 'Green beans transported by sea to roasters worldwide', is_gap: false, reveal_order: 5, spatial_hint: { relative_to: 'e4', direction: 'right' } },
    { id: 'e6', label: 'Roasting', type: 'process', icon_name: 'flame', description: 'Beans heated at precise temperatures to develop flavour profiles', is_gap: false, reveal_order: 6, spatial_hint: { relative_to: 'e5', direction: 'right' } },
    { id: 'e7', label: 'Distribution', type: 'process', icon_name: 'store', description: 'Roasted beans packaged and sent to cafes and supermarkets', is_gap: false, reveal_order: 7, spatial_hint: { relative_to: 'e6', direction: 'right' } },
    { id: 'e8', label: 'Brewing', type: 'process', icon_name: 'coffee', description: 'Beans ground and brewed into the final cup of coffee', is_gap: false, reveal_order: 8, spatial_hint: { relative_to: 'e7', direction: 'right' } },
  ],
  relationships: [
    { source: 'e1', target: 'e2', type: 'flows_into', reveal_order: 2 },
    { source: 'e2', target: 'e3', type: 'flows_into', reveal_order: 3 },
    { source: 'e3', target: 'e4', type: 'transforms_into', reveal_order: 4 },
    { source: 'e4', target: 'e5', type: 'flows_into', reveal_order: 5 },
    { source: 'e5', target: 'e6', type: 'flows_into', reveal_order: 6 },
    { source: 'e6', target: 'e7', type: 'flows_into', reveal_order: 7 },
    { source: 'e7', target: 'e8', type: 'flows_into', reveal_order: 8 },
  ],
  step_annotations: {
    1: 'Coffee begins its journey at tropical farms',
    2: 'Workers hand-pick ripe coffee cherries from the plants',
    3: 'Cherries are processed to extract the raw beans inside',
    4: 'Processed beans are dried and sorted as green coffee',
    5: 'Green beans are shipped by sea to roasters worldwide',
    6: 'Roasters apply heat to develop the beans\' flavour',
    7: 'Roasted coffee is distributed to shops and cafes',
    8: 'Finally, beans are ground and brewed into your cup',
  },
}

// ── Why Projects Fail (cause_effect mode) ────────────────────
const PROJECT_FAILURE: DiagramSpec = {
  title: 'Why Projects Fail: A Causal Analysis',
  summary: 'Project failure cascades from unclear requirements and poor communication through scope creep, technical debt, and stakeholder loss of confidence.',
  detected_mode: 'cause_effect',
  entities: [
    { id: 'e1', label: 'Unclear Requirements', type: 'concept', icon_name: 'alert-triangle', description: 'Requirements are vague or poorly documented from the start', is_gap: false, reveal_order: 1, spatial_hint: { anchor: true } },
    { id: 'e2', label: 'Scope Creep', type: 'process', icon_name: 'trending-up', description: 'Features expand beyond original plan without adjusting timeline', is_gap: false, reveal_order: 2, spatial_hint: { relative_to: 'e1', direction: 'right' } },
    { id: 'e3', label: 'Misaligned Expectations', type: 'concept', icon_name: 'x-circle', description: 'Stakeholders and team have different views of what success looks like', is_gap: false, reveal_order: 2, spatial_hint: { relative_to: 'e1', direction: 'below-right' } },
    { id: 'e4', label: 'Poor Communication', type: 'concept', icon_name: 'alert-triangle', description: 'Teams work in silos without sharing information effectively', is_gap: false, reveal_order: 3, spatial_hint: { relative_to: 'e2', direction: 'right' } },
    { id: 'e5', label: 'Duplicated Work', type: 'process', icon_name: 'layers', description: 'Multiple teams unknowingly build the same features', is_gap: false, reveal_order: 4, spatial_hint: { relative_to: 'e4', direction: 'right' } },
    { id: 'e6', label: 'Missed Dependencies', type: 'event', icon_name: 'git-branch', description: 'Critical dependencies discovered too late in the process', is_gap: false, reveal_order: 4, spatial_hint: { relative_to: 'e4', direction: 'below-right' } },
    { id: 'e7', label: 'Unrealistic Deadlines', type: 'concept', icon_name: 'clock', description: 'Timelines set without accounting for actual complexity', is_gap: false, reveal_order: 5, spatial_hint: { relative_to: 'e5', direction: 'right' } },
    { id: 'e8', label: 'Quality Pressure', type: 'concept', icon_name: 'trending-down', description: 'Shortcuts taken to meet deadlines, reducing quality', is_gap: false, reveal_order: 6, spatial_hint: { relative_to: 'e7', direction: 'right' } },
    { id: 'e9', label: 'Technical Debt', type: 'concept', icon_name: 'wrench', description: 'Accumulated shortcuts slow down all future development', is_gap: false, reveal_order: 7, spatial_hint: { relative_to: 'e8', direction: 'below-right' } },
    { id: 'e10', label: 'Project Collapse', type: 'event', icon_name: 'x-circle', description: 'Stakeholders lose confidence, funding is cut, project fails', is_gap: false, reveal_order: 8, spatial_hint: { relative_to: 'e9', direction: 'right' } },
  ],
  relationships: [
    { source: 'e1', target: 'e2', type: 'causes', label: 'leads to', reveal_order: 2 },
    { source: 'e1', target: 'e3', type: 'causes', label: 'creates', reveal_order: 2 },
    { source: 'e2', target: 'e4', type: 'causes', reveal_order: 3 },
    { source: 'e3', target: 'e4', type: 'causes', reveal_order: 3 },
    { source: 'e4', target: 'e5', type: 'causes', reveal_order: 4 },
    { source: 'e4', target: 'e6', type: 'causes', reveal_order: 4 },
    { source: 'e5', target: 'e7', type: 'causes', reveal_order: 5 },
    { source: 'e6', target: 'e7', type: 'causes', reveal_order: 5 },
    { source: 'e7', target: 'e8', type: 'causes', reveal_order: 6 },
    { source: 'e8', target: 'e9', type: 'causes', reveal_order: 7 },
    { source: 'e9', target: 'e10', type: 'causes', label: 'ultimately causes', reveal_order: 8 },
  ],
  step_annotations: {
    1: 'It starts with unclear requirements — the foundation is shaky',
    2: 'This breeds scope creep and misaligned expectations',
    3: 'Poor communication compounds the confusion between teams',
    4: 'Teams duplicate work while missing critical dependencies',
    5: 'Unrealistic deadlines are set without understanding the true scope',
    6: 'Quality suffers as shortcuts are taken to meet deadlines',
    7: 'Technical debt accumulates, slowing everything down',
    8: 'Confidence collapses, funding is pulled, and the project fails',
  },
}

// ── Generic fallback ─────────────────────────────────────────
const GENERIC_DEMO: DiagramSpec = {
  title: 'Demo Diagram (Mock Mode)',
  summary: 'This is a demo diagram shown while the API is unavailable. Try the example buttons for richer demos.',
  detected_mode: 'system',
  entities: [
    { id: 'e1', label: 'Central Concept', type: 'concept', icon_name: 'lightbulb', description: 'The main idea or concept being explored', is_gap: false, reveal_order: 1, spatial_hint: { anchor: true } },
    { id: 'e2', label: 'Component A', type: 'object', icon_name: 'box', description: 'A key component of the concept', is_gap: false, reveal_order: 2, spatial_hint: { relative_to: 'e1', direction: 'right' } },
    { id: 'e3', label: 'Component B', type: 'object', icon_name: 'box', description: 'Another key component', is_gap: false, reveal_order: 3, spatial_hint: { relative_to: 'e1', direction: 'below-right' } },
    { id: 'e4', label: 'Outcome', type: 'event', icon_name: 'target', description: 'The result of the components working together', is_gap: false, reveal_order: 4, spatial_hint: { relative_to: 'e2', direction: 'below-right' } },
  ],
  relationships: [
    { source: 'e1', target: 'e2', type: 'contains', reveal_order: 2 },
    { source: 'e1', target: 'e3', type: 'contains', reveal_order: 3 },
    { source: 'e2', target: 'e4', type: 'causes', reveal_order: 4 },
    { source: 'e3', target: 'e4', type: 'causes', reveal_order: 4 },
  ],
  step_annotations: {
    1: 'Start with the central concept',
    2: 'Component A connects to the core',
    3: 'Component B adds another dimension',
    4: 'Together they produce the outcome',
  },
}

// ── Mock matching ────────────────────────────────────────────

export function getMockDiagram(transcript: string): DiagramSpec {
  const t = transcript.toLowerCase()
  if (t.includes('water') || t.includes('evapor') || t.includes('rain') || t.includes('cycle')) return WATER_CYCLE
  if (t.includes('coffee') || t.includes('farm') || t.includes('roast') || t.includes('brew')) return COFFEE_PROCESS
  if (t.includes('project') || t.includes('fail') || t.includes('deadline') || t.includes('requirement')) return PROJECT_FAILURE
  return GENERIC_DEMO
}

export function getMockAssessment(): LayoutAssessment {
  return {
    expert_persona: 'Layout Quality Assessor (Mock)',
    verdict: 'This is a pre-designed mock layout following research-backed design principles. Assessment is simulated.',
    criteria: {
      spatial_coherence: { score: 8, note: 'Entities positioned according to real-world spatial relationships' },
      flow_readability: { score: 8, note: 'Flow follows a consistent direction with no backtracking' },
      grouping: { score: 7, note: 'Related entities are clustered with appropriate spacing' },
      balance: { score: 8, note: 'Layout uses landscape orientation with good canvas utilisation' },
      expert_intuition: { score: 7, note: 'Arrangement matches how a domain expert would draw this' },
    },
  }
}
