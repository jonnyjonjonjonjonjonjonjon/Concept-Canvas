import { useState, useCallback } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'
import { useStore } from '../stores/useStore.ts'
import { interpretTranscript } from '../api/claude.ts'

export function InputBar() {
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const mode = useStore((s) => s.mode)
  const isLoading = useStore((s) => s.isLoading)
  const setLoading = useStore((s) => s.setLoading)
  const setDiagram = useStore((s) => s.setDiagram)
  const addMessage = useStore((s) => s.addMessage)

  const handleSubmit = useCallback(async (transcript: string) => {
    const trimmed = transcript.trim()
    if (!trimmed || isLoading) return

    // Add user message
    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    })

    setLoading(true)
    setText('')

    try {
      const response = await interpretTranscript({ transcript: trimmed, mode })
      setDiagram(response.diagram)

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.diagram.title,
        timestamp: Date.now(),
        diagramUpdate: response.diagram,
      })
    } catch (error) {
      console.error('Failed to interpret:', error)
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to interpret transcript'}`,
        timestamp: Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }, [isLoading, mode, setLoading, setDiagram, addMessage])

  const toggleRecording = useCallback(() => {
    if (isRecording && recognition) {
      recognition.stop()
      setIsRecording(false)
      setRecognition(null)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    let finalTranscript = ''

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      setText(finalTranscript + interim)
    }

    rec.onend = () => {
      setIsRecording(false)
      setRecognition(null)
      if (finalTranscript.trim()) {
        handleSubmit(finalTranscript.trim())
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
      setRecognition(null)
    }

    rec.start()
    setIsRecording(true)
    setRecognition(rec)
  }, [isRecording, recognition, handleSubmit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(text)
    }
  }

  return (
    <div className="border-t border-canvas-border bg-canvas-surface px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        <button
          onClick={toggleRecording}
          className={`p-2.5 rounded-lg border transition-colors ${
            isRecording
              ? 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse'
              : 'border-canvas-border text-canvas-muted hover:text-canvas-text hover:bg-canvas-border'
          }`}
          title={isRecording ? 'Stop recording' : 'Record audio'}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Listening...' : 'Explain a concept or describe a problem...'}
          disabled={isLoading}
          className="flex-1 bg-canvas-bg border border-canvas-border rounded-lg px-4 py-2.5 text-sm text-canvas-text placeholder:text-canvas-muted/50 focus:outline-none focus:border-canvas-accent transition-colors disabled:opacity-50"
        />

        <button
          onClick={() => handleSubmit(text)}
          disabled={!text.trim() || isLoading}
          className="p-2.5 rounded-lg bg-canvas-accent text-white hover:bg-canvas-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Send"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  )
}
