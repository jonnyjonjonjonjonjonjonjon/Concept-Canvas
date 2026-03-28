import type { InterpretRequest, InterpretResponse } from '../../../shared/types.ts'

export async function interpretTranscript(
  request: InterpretRequest
): Promise<InterpretResponse> {
  const response = await fetch('/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
