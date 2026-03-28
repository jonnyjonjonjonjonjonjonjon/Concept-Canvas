import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export function Canvas() {
  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={[]}
        edges={[]}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e1e2e" />
        <Controls
          position="top-right"
          className="!bg-canvas-surface !border-canvas-border !shadow-none [&>button]:!bg-canvas-surface [&>button]:!border-canvas-border [&>button]:!text-canvas-muted [&>button:hover]:!bg-canvas-border"
        />
      </ReactFlow>
    </div>
  )
}
