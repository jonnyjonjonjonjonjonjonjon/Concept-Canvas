import { useEffect, useRef, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useStore } from '../stores/useStore.ts'
import { getFocusNodeIds } from '../lib/cameraFocus.ts'

/**
 * Hook that animates the React Flow viewport to follow the action
 * as the diagram builds step by step.
 *
 * Returns { onMoveStart } to pass to <ReactFlow> so we can detect
 * when the user manually pans/zooms and suppress auto-camera.
 */
export function useCameraFollow() {
  const diagram = useStore((s) => s.diagram)
  const currentStep = useStore((s) => s.currentStep)
  const maxStep = useStore((s) => s.maxStep)
  const { fitView } = useReactFlow()
  const userOverrideRef = useRef(false)

  useEffect(() => {
    if (!diagram || currentStep === 0) return

    // Reset user override on any step change — re-engage camera
    userOverrideRef.current = false

    if (currentStep >= maxStep) {
      // Final step: zoom out to show everything
      fitView({ padding: 0.15, duration: 900, maxZoom: 1.5 })
      return
    }

    const focusIds = getFocusNodeIds(diagram, currentStep)
    if (focusIds.length === 0) return

    fitView({
      nodes: focusIds.map(id => ({ id })),
      padding: 0.35,
      duration: 700,
      maxZoom: 1.5,
    })
  }, [currentStep, diagram, maxStep, fitView])

  const onMoveStart = useCallback(
    (_event: MouseEvent | TouchEvent | null) => {
      // event is null for programmatic moves (our fitView calls)
      // A real event means the user is manually panning/zooming
      if (_event !== null) {
        userOverrideRef.current = true
      }
    },
    []
  )

  return { onMoveStart }
}
