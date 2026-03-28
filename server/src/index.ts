import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { interpretRoute } from './routes/interpret.ts'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.post('/api/interpret', interpretRoute)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
