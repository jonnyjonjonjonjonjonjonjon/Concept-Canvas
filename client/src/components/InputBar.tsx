import { useState } from 'react'
import { Send, Mic } from 'lucide-react'

export function InputBar() {
  const [text, setText] = useState('')

  return (
    <div className="border-t border-canvas-border bg-canvas-surface px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        <button
          className="p-2.5 rounded-lg border border-canvas-border text-canvas-muted hover:text-canvas-text hover:bg-canvas-border transition-colors"
          title="Record audio"
        >
          <Mic size={18} />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Explain a concept or describe a problem..."
          className="flex-1 bg-canvas-bg border border-canvas-border rounded-lg px-4 py-2.5 text-sm text-canvas-text placeholder:text-canvas-muted/50 focus:outline-none focus:border-canvas-accent transition-colors"
        />

        <button
          disabled={!text.trim()}
          className="p-2.5 rounded-lg bg-canvas-accent text-white hover:bg-canvas-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
