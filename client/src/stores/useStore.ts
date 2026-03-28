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

  // Actions
  setDiagram: (diagram: DiagramSpec) => void
  setMode: (mode: StructuralMode) => void
  setCurrentStep: (step: number) => void
  stepForward: () => void
  stepBack: () => void
  togglePlay: () => void
  addMessage: (message: ConversationMessage) => void
  setLoading: (loading: boolean) => void
  toggleSidebar: () => void
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
  savedCanvases: [],

  setDiagram: (diagram) => {
    const maxStep = Math.max(
      ...diagram.entities.map((e) => e.reveal_order),
      ...diagram.relationships.map((r) => r.reveal_order),
      0
    )
    set({ diagram, maxStep, currentStep: maxStep })
  },

  setMode: (mode) => set({ mode }),

  setCurrentStep: (step) => {
    const { maxStep } = get()
    set({ currentStep: Math.max(0, Math.min(step, maxStep)) })
  },

  stepForward: () => {
    const { currentStep, maxStep } = get()
    if (currentStep < maxStep) set({ currentStep: currentStep + 1 })
  },

  stepBack: () => {
    const { currentStep } = get()
    if (currentStep > 0) set({ currentStep: currentStep - 1 })
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  addMessage: (message) =>
    set((s) => ({ conversation: [...s.conversation, message] })),

  setLoading: (isLoading) => set({ isLoading }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
