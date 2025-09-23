import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as jwt from 'jsonwebtoken'
import * as bcryptjs from 'bcryptjs'

type Bindings = {
  JWT_SECRET: string
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS configuration
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://lingoloop-ai.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// In-memory storage for testing
const users: any[] = []

async function connectDB(databaseUrl: string) {
  // Mock database connection for testing
  return {
    collection: (name: string) => ({
      findOne: async (query: any) => {
        if (name === 'users') {
          return users.find(user => user.email === query.email)
        }
        return null
      },
      insertOne: async (doc: any) => {
        if (name === 'users') {
          const user = { ...doc, _id: Date.now().toString() }
          users.push(user)
          return { insertedId: user._id }
        }
        return { insertedId: Date.now().toString() }
      }
    })
  }
}

// JWT middleware
app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth')) {
    return await next()
  }

  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401)
  }

  const token = authHeader.substring(7)
  try {
    const payload = jwt.verify(token, c.env.JWT_SECRET) as any
    // Store payload in context for use in route handlers
    return await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// Auth endpoints
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  try {
    const db = await connectDB(c.env.DATABASE_URL)
    const user = await db.collection('users').findOne({ email })

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const isValid = await bcryptjs.compare(password, user.password)
    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const token = jwt.sign({
      userId: user._id.toString(),
      email: user.email
    }, c.env.JWT_SECRET)

    return c.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName
        },
        accessToken: token
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/auth/register', async (c) => {
  const { email, password, displayName } = await c.req.json()

  if (!email || !password || password.length < 8) {
    return c.json({ error: 'Valid email and password (min 8 chars) are required' }, 400)
  }

  try {
    const db = await connectDB(c.env.DATABASE_URL)
    const existingUser = await db.collection('users').findOne({ email })

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409)
    }

    const hashedPassword = await bcryptjs.hash(password, 10)
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      displayName: displayName || email,
      createdAt: new Date()
    })

    const token = jwt.sign({
      userId: result.insertedId.toString(),
      email
    }, c.env.JWT_SECRET)

    return c.json({
      success: true,
      data: {
        user: {
          id: result.insertedId.toString(),
          email,
          displayName: displayName || email
        },
        accessToken: token
      }
    })
  } catch (err) {
    console.error('Register error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Audio files endpoints (placeholder implementation)
app.get('/api/audios', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const pageSize = parseInt(c.req.query('pageSize') || '10')

    // Mock data for now
    const mockFiles = [
      {
        id: '1',
        filename: 'sample1.mp3',
        duration: 120000,
        size: 2048000,
        status: 'transcribed',
        createdAt: new Date().toISOString()
      }
    ]

    return c.json({
      items: mockFiles,
      hasMore: false
    })
  } catch (err) {
    console.error('Audio files error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// User endpoints
app.get('/api/user/learning-stats', async (c) => {
  try {
    // Mock data for now
    return c.json({
      totalSessions: 0,
      totalMinutes: 0,
      totalSegments: 0,
      streakDays: 0,
      achievements: []
    })
  } catch (err) {
    console.error('Learning stats error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/api/user/progress', async (c) => {
  try {
    // Mock data for now
    return c.json({
      goals: [],
      recentSessions: [],
      skillProgression: {},
      suggestions: []
    })
  } catch (err) {
    console.error('Progress error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app