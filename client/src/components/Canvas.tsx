import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '../stores/useStore.ts'
import { diagramToFlow } from '../lib/layout.ts'
import { ConceptNode } from './ConceptNode.tsx'
import { ConceptEdge, EdgeMarkers } from './ConceptEdge.tsx'
import { Sparkles } from 'lucide-react'

const nodeTypes: NodeTypes = { concept: ConceptNode }
const edgeTypes: EdgeTypes = { concept: ConceptEdge }

export function Canvas() {
  const diagram = useStore((s) => s.diagram)
  const currentStep = useStore((s) => s.currentStep)
  const isLoading = useStore((s) => s.isLoading)
  const { fitView } = useReactFlow()

  const { nodes, edges } = useMemo(() => {
    if (!diagram) return { nodes: [], edges: [] }
    return diagramToFlow(diagram, currentStep)
  }, [diagram, currentStep])

  const onNodesChange = useCallback(() => {
    // Allow dragging but don't sync back to store
  }, [])

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100)
  }, [fitView])

  return (
    <div className="flex-1 h-full relative">
      <EdgeMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e1e2e" />
        <Controls
          position="top-right"
          className="!bg-canvas-surface !border-canvas-border !shadow-none [&>button]:!bg-canvas-surface [&>button]:!border-canvas-border [&>button]:!text-canvas-muted [&>button:hover]:!bg-canvas-border"
        />
      </ReactFlow>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas-bg/60 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-canvas-accent border-t-transparent animate-spin" />
            <span className="text-sm text-canvas-muted">Interpreting...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!diagram && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-2xl bg-canvas-surface border border-canvas-border flex items-center justify-center">
              <Sparkles size={28} className="text-canvas-accent" />
            </div>
            <h2 className="text-xl font-semibold text-canvas-text">Concept Canvas</h2>
            <p className="text-sm text-canvas-muted leading-relaxed">
              Explain any concept, process, or problem — by typing or speaking — and watch it transform into an interactive diagram.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {['How coffee is made', 'Why projects fail', 'The water cycle'].map((ex) => (
                <span key={ex} className="text-xs px-3 py-1.5 rounded-full bg-canvas-surface border border-canvas-border text-canvas-muted">
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Title overlay */}
      {diagram && (
        <div className="absolute top-4 left-4 z-10 max-w-sm">
          <h1 className="text-lg font-bold text-canvas-text drop-shadow-lg">{diagram.title}</h1>
          {diagram.summary && (
            <p className="text-xs text-canvas-muted mt-1 drop-shadow-lg">{diagram.summary}</p>
          )}
        </div>
      )}
    </div>
  )
}
