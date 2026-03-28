import { PanelLeft } from 'lucide-react'
import { useStore } from '../stores/useStore.ts'

export function Sidebar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)

  return (
    <>
      {/* Toggle button (always visible) */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-canvas-surface border border-canvas-border text-canvas-muted hover:text-canvas-text transition-colors"
      >
        <PanelLeft size={18} />
      </button>

      {/* Sidebar panel */}
      <aside
        className={`h-full bg-canvas-surface border-r border-canvas-border transition-all duration-200 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="pt-14 px-4 pb-4 flex-1 overflow-y-auto">
          <h2 className="text-sm font-medium text-canvas-muted mb-3">History</h2>
          <p className="text-xs text-canvas-muted/60">No canvases yet</p>
        </div>
      </aside>
    </>
  )
}
