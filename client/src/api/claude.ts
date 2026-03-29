import type { InterpretRequest, InterpretResponse, AssessRequest, AssessResponse } from '../../../shared/types.ts'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const body = await response.json()
      throw new Error(body.error ?? `Request failed (${response.status})`)
    } catch (e) {
      if (e instanceof Error && e.message !== `Request failed (${response.status})`) throw e
      throw new Error(`Can't reach the server. Check that it's running.`)
    }
  }
  return response.json()
}

export async function interpretTranscript(
  request: InterpretRequest
): Promise<InterpretResponse> {
  let response: Response
  try {
    response = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    throw new Error('Can\'t reach the server. Make sure it\'s running with npm run dev.')
  }
  return handleResponse<InterpretResponse>(response)
}

export async function assessLayout(
  request: AssessRequest
): Promise<AssessResponse> {
  let response: Response
  try {
    response = await fetch('/api/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    throw new Error('Can\'t reach the server. Make sure it\'s running with npm run dev.')
  }
  return handleResponse<AssessResponse>(response)
}
