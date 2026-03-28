import { PanelLeft, Plus, Trash2, Clock } from 'lucide-react'
import { useStore } from '../stores/useStore.ts'

export function Sidebar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const savedCanvases = useStore((s) => s.savedCanvases)
  const saveCanvas = useStore((s) => s.saveCanvas)
  const loadCanvas = useStore((s) => s.loadCanvas)
  const deleteCanvas = useStore((s) => s.deleteCanvas)
  const newCanvas = useStore((s) => s.newCanvas)
  const diagram = useStore((s) => s.diagram)

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-canvas-surface border border-canvas-border text-canvas-muted hover:text-canvas-text transition-colors"
      >
        <PanelLeft size={18} />
      </button>

      <aside
        className={`h-full bg-canvas-surface border-r border-canvas-border transition-all duration-200 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="pt-14 px-3 pb-4 flex-1 overflow-y-auto flex flex-col">
          <div className="flex gap-2 mb-4">
            <button
              onClick={newCanvas}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-canvas-border text-sm text-canvas-muted hover:text-canvas-text hover:bg-canvas-border/50 transition-colors"
            >
              <Plus size={14} />
              New
            </button>
            {diagram && (
              <button
                onClick={saveCanvas}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-canvas-accent/30 text-sm text-canvas-accent hover:bg-canvas-accent/10 transition-colors"
              >
                Save
              </button>
            )}
          </div>

          <h2 className="text-xs font-medium uppercase tracking-wider text-canvas-muted/60 mb-2 px-1">
            History
          </h2>

          {savedCanvases.length === 0 ? (
            <p className="text-xs text-canvas-muted/40 px-1">No saved canvases yet</p>
          ) : (
            <div className="flex flex-col gap-1">
              {savedCanvases.map((canvas) => (
                <div
                  key={canvas.id}
                  className="group flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-canvas-border/30 cursor-pointer transition-colors"
                  onClick={() => loadCanvas(canvas)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-canvas-text truncate">
                      {canvas.title}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-canvas-muted/50 mt-0.5">
                      <Clock size={10} />
                      {formatDate(canvas.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCanvas(canvas.id)
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 text-canvas-muted hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
