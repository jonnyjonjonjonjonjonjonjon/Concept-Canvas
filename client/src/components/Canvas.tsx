import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '../stores/useStore.ts'
import { diagramToFlow } from '../lib/layout.ts'
import { getStepTiming } from '../lib/cameraFocus.ts'
import { useCameraFollow } from '../hooks/useCameraFollow.ts'
import { ConceptNode } from './ConceptNode.tsx'
import { ConceptEdge, EdgeMarkers } from './ConceptEdge.tsx'
import { AssessmentPanel } from './AssessmentPanel.tsx'
import { Toast } from './Toast.tsx'
import { Sparkles } from 'lucide-react'

const nodeTypes: NodeTypes = { concept: ConceptNode }
const edgeTypes: EdgeTypes = { concept: ConceptEdge }

const EXAMPLES = [
  {
    label: 'How coffee is made',
    transcript: 'Coffee starts at farms where cherries are grown and hand-picked when ripe. The beans are extracted and processed by washing or drying, then shipped as green beans to roasters around the world. Roasters heat them at different temperatures to develop flavour, then the roasted beans are distributed to cafes and shops where they are ground, brewed, and served as coffee.',
  },
  {
    label: 'Why projects fail',
    transcript: 'Projects usually fail because of unclear requirements at the start, which leads to scope creep and misaligned expectations. Poor communication between teams causes duplicated work and missed dependencies. Unrealistic deadlines put pressure on quality, leading to technical debt that slows everything down. Eventually stakeholders lose confidence, funding gets cut, and the project collapses.',
  },
  {
    label: 'The water cycle',
    transcript: 'Water evaporates from oceans and lakes, rises into the atmosphere where it cools and condenses into clouds. The clouds accumulate moisture until precipitation occurs as rain or snow. The water falls to the ground, some flows into rivers and streams as runoff, some soaks into the ground as infiltration. Eventually all the water makes its way back to the oceans and the cycle starts again.',
  },
]

export function Canvas() {
  const diagram = useStore((s) => s.diagram)
  const currentStep = useStore((s) => s.currentStep)
  const isLoading = useStore((s) => s.isLoading)
  const setPendingInput = useStore((s) => s.setPendingInput)
  const isPlaying = useStore((s) => s.isPlaying)
  const { onMoveStart } = useCameraFollow()

  const { nodes, edges } = useMemo(() => {
    if (!diagram) return { nodes: [], edges: [] }
    return diagramToFlow(diagram, currentStep)
  }, [diagram, currentStep])

  const onNodesChange = useCallback(() => {
    // Allow dragging but don't sync back to store
  }, [])

  return (
    <div className="flex-1 h-full relative">
      <EdgeMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onMoveStart={onMoveStart}
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
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-2xl bg-canvas-surface border border-canvas-border flex items-center justify-center">
              <Sparkles size={28} className="text-canvas-accent" />
            </div>
            <h2 className="text-xl font-semibold text-canvas-text">Concept Canvas</h2>
            <p className="text-sm text-canvas-muted leading-relaxed">
              Explain any concept, process, or problem — by typing or speaking — and watch it transform into an interactive diagram.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setPendingInput(ex.transcript)}
                  className="text-xs px-3 py-1.5 rounded-full bg-canvas-surface border border-canvas-border text-canvas-muted hover:text-canvas-text hover:border-canvas-accent/50 transition-colors cursor-pointer"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <Toast />

      {/* Assessment panel */}
      <AssessmentPanel />

      {/* Title overlay */}
      {diagram && (
        <div className="absolute top-4 left-4 z-10 max-w-sm">
          <h1 className="text-lg font-bold text-canvas-text drop-shadow-lg">{diagram.title}</h1>
          {diagram.summary && (
            <p className="text-xs text-canvas-muted mt-1 drop-shadow-lg">{diagram.summary}</p>
          )}
        </div>
      )}

      {/* Floating annotation */}
      {diagram && (() => {
        const annotation = diagram.step_annotations?.[currentStep]
        if (!annotation) return null
        const timing = getStepTiming(diagram, currentStep)
        return (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div
              key={currentStep}
              className="rounded-xl bg-canvas-surface/90 border border-canvas-border backdrop-blur-md shadow-lg shadow-black/30 max-w-md text-center animate-fade-in overflow-hidden"
            >
              <p className="text-sm text-canvas-text leading-relaxed px-5 pt-3 pb-2.5">{annotation}</p>
              <div className="h-0.5 bg-canvas-border/50">
                <div
                  key={`timer-${currentStep}-${isPlaying}`}
                  className={`h-full bg-canvas-accent/60 origin-left ${isPlaying ? 'animate-step-timer' : ''}`}
                  style={isPlaying ? { animationDuration: `${timing.total}ms` } : { transform: 'scaleX(1)' }}
                />
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
