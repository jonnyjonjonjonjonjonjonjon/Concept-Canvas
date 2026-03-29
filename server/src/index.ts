import dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env from project root (two levels up from server/src/)
dotenv.config({ path: resolve(process.cwd(), '.env') })
// Also try from server workspace root in case cwd is server/
dotenv.config({ path: resolve(process.cwd(), '../.env') })

import express from 'express'
import cors from 'cors'
import { interpretRoute } from './routes/interpret.ts'
import { assessRoute } from './routes/assess.ts'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.post('/api/interpret', interpretRoute)
app.post('/api/assess', assessRoute)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err)
  res.status(500).json({ error: 'Something went wrong. Please try again.', code: 'server_error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
