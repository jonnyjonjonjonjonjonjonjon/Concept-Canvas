import { ReactFlowProvider } from '@xyflow/react'
import { Sidebar } from './components/Sidebar.tsx'
import { Canvas } from './components/Canvas.tsx'
import { InputBar } from './components/InputBar.tsx'
import { StepControls } from './components/StepControls.tsx'

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-canvas-bg">
        {/* Left sidebar */}
        <Sidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas */}
          <div className="flex-1 relative">
            <Canvas />
          </div>

          {/* Step controls */}
          <StepControls />

          {/* Input bar */}
          <InputBar />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
