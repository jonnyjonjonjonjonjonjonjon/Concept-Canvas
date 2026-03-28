import { create } from 'zustand'
import type {
  DiagramSpec,
  StructuralMode,
  ConversationMessage,
  SavedCanvas,
} from '../../../shared/types.ts'

interface AppState {
  // Current diagram
  diagram: DiagramSpec | null
  mode: StructuralMode
  currentStep: number
  maxStep: number
  isPlaying: boolean

  // Conversation
  conversation: ConversationMessage[]
  isLoading: boolean

  // UI
  sidebarOpen: boolean
  savedCanvases: SavedCanvas[]
  selectedEntityId: string | null

  // Actions
  setDiagram: (diagram: DiagramSpec) => void
  setMode: (mode: StructuralMode) => void
  setCurrentStep: (step: number) => void
  stepForward: () => void
  stepBack: () => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  addMessage: (message: ConversationMessage) => void
  setLoading: (loading: boolean) => void
  toggleSidebar: () => void
  setSelectedEntity: (id: string | null) => void
  saveCanvas: () => void
  loadCanvas: (canvas: SavedCanvas) => void
  deleteCanvas: (id: string) => void
  newCanvas: () => void
}

const STORAGE_KEY = 'concept-canvas-saved'

function loadSavedCanvases(): SavedCanvas[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistCanvases(canvases: SavedCanvas[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
}

export const useStore = create<AppState>((set, get) => ({
  diagram: null,
  mode: 'auto',
  currentStep: 0,
  maxStep: 0,
  isPlaying: false,

  conversation: [],
  isLoading: false,

  sidebarOpen: true,
  savedCanvases: loadSavedCanvases(),
  selectedEntityId: null,

  setDiagram: (diagram) => {
    const maxStep = Math.max(
      ...diagram.entities.map((e) => e.reveal_order),
      ...diagram.relationships.map((r) => r.reveal_order),
      0
    )
    // Start at step 0 for build animation, then auto-play will reveal
    set({ diagram, maxStep, currentStep: 0, isPlaying: true })
  },

  setMode: (mode) => set({ mode }),

  setCurrentStep: (step) => {
    const { maxStep } = get()
    set({ currentStep: Math.max(0, Math.min(step, maxStep)) })
  },

  stepForward: () => {
    const { currentStep, maxStep } = get()
    if (currentStep < maxStep) {
      set({ currentStep: currentStep + 1 })
    } else {
      set({ isPlaying: false })
    }
  },

  stepBack: () => {
    const { currentStep } = get()
    if (currentStep > 0) set({ currentStep: currentStep - 1 })
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (isPlaying) => set({ isPlaying }),

  addMessage: (message) =>
    set((s) => ({ conversation: [...s.conversation, message] })),

  setLoading: (isLoading) => set({ isLoading }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setSelectedEntity: (selectedEntityId) => set({ selectedEntityId }),

  saveCanvas: () => {
    const { diagram, conversation, mode, savedCanvases } = get()
    if (!diagram) return

    const canvas: SavedCanvas = {
      id: crypto.randomUUID(),
      title: diagram.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      diagram,
      conversation,
      mode,
    }

    const updated = [canvas, ...savedCanvases]
    persistCanvases(updated)
    set({ savedCanvases: updated })
  },

  loadCanvas: (canvas) => {
    const maxStep = Math.max(
      ...canvas.diagram.entities.map((e) => e.reveal_order),
      ...canvas.diagram.relationships.map((r) => r.reveal_order),
      0
    )
    set({
      diagram: canvas.diagram,
      conversation: canvas.conversation,
      mode: canvas.mode,
      maxStep,
      currentStep: maxStep,
      isPlaying: false,
    })
  },

  deleteCanvas: (id) => {
    const { savedCanvases } = get()
    const updated = savedCanvases.filter((c) => c.id !== id)
    persistCanvases(updated)
    set({ savedCanvases: updated })
  },

  newCanvas: () => {
    set({
      diagram: null,
      conversation: [],
      currentStep: 0,
      maxStep: 0,
      isPlaying: false,
      selectedEntityId: null,
    })
  },
}))
