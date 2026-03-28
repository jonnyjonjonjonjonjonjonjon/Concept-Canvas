// ── Entity Types ──────────────────────────────────────────────
export type EntityType =
  | 'actor'       // Things that DO (people, organisations, machines)
  | 'object'      // Things that ARE (physical items, data, materials)
  | 'process'     // Things that HAPPEN (actions, transformations)
  | 'concept'     // Abstract forces (ideas, pressures, qualities)
  | 'environment' // Where things happen (places, contexts, containers)
  | 'event';      // Moments that change things (triggers, transitions)

// ── Relationship Types ───────────────────────────────────────
export type RelationshipType =
  | 'flows_into'      // Sequential: "then", "next"
  | 'causes'          // Causal: "because", "leads to"
  | 'contains'        // Nesting: "within", "inside"
  | 'interacts_with'  // Bidirectional: "works with", "affects each other"
  | 'transforms_into' // Metamorphosis: "becomes", "turns into"
  | 'opposes';        // Tension: "blocks", "prevents"

// ── Structural Modes ─────────────────────────────────────────
export type StructuralMode =
  | 'auto'
  | 'process'
  | 'cycle'
  | 'cause_effect'
  | 'system'
  | 'timeline'
  | 'containment'
  | 'problem';

// ── Problem Mode Roles ───────────────────────────────────────
export type ProblemRole =
  | 'ude'                  // Undesirable Effect (symptom)
  | 'root_cause'
  | 'core_driver'          // Root cause with most influence
  | 'contributing_factor'
  | 'constraint'           // Blocks solutions
  | 'solution'
  | 'gap';                 // Unknown / uninvestigated

// ── Entity ───────────────────────────────────────────────────
export interface Entity {
  id: string;
  label: string;
  type: EntityType;
  icon_name: string;       // Lucide icon name (e.g. "coffee", "flame")
  description: string;     // Hover/click detail text (absorbed content)
  is_gap: boolean;
  reveal_order: number;
  role?: ProblemRole;      // Only in Problem mode
}

// ── Relationship ─────────────────────────────────────────────
export interface Relationship {
  source: string;          // Entity id
  target: string;          // Entity id
  type: RelationshipType;
  label?: string;
  reveal_order: number;
}

// ── Diagram Specification (Claude's output) ──────────────────
export interface DiagramSpec {
  title: string;
  summary?: string;
  detected_mode: StructuralMode;
  entities: Entity[];
  relationships: Relationship[];
}

// ── API Request / Response ───────────────────────────────────
export interface InterpretRequest {
  transcript: string;
  mode: StructuralMode;
}

export interface InterpretResponse {
  diagram: DiagramSpec;
}

// ── Conversation Message ─────────────────────────────────────
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  diagramUpdate?: DiagramSpec; // If this message resulted in a diagram change
}

// ── Saved Canvas (localStorage) ──────────────────────────────
export interface SavedCanvas {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  diagram: DiagramSpec;
  conversation: ConversationMessage[];
  mode: StructuralMode;
}
