# DevPulse 📊

> A production-grade developer analytics platform showcasing full-stack expertise, real-time data processing, and AI-powered insights.

**Live Demo**: [Coming Soon]  
**Case Study**: [Coming Soon]  
**Tech Stack**: Next.js 14, TypeScript, PostgreSQL, Redis, Prisma, NextAuth, Socket.io, Claude AI

---

## 🎯 Project Overview

DevPulse is a comprehensive developer analytics platform that aggregates data from GitHub and other sources to provide actionable insights about coding patterns, productivity trends, and learning progress. Built as a 1% portfolio project to demonstrate full-stack engineering excellence.

### Key Features

- 🔐 **Secure Authentication** - GitHub OAuth with NextAuth.js
- 📊 **Real-time Analytics** - Live dashboard with WebSocket updates
- 🤖 **AI-Powered Insights** - Natural language queries and recommendations using Claude
- 📈 **Advanced Visualizations** - Interactive charts with time-series data
- ⚡ **Performance Optimized** - Multi-layer caching, query optimization, sub-100ms responses
- 🔄 **Background Processing** - Job queues for data sync and aggregation
- 🎨 **Modern UI** - Dark mode, responsive design, polished UX
- 🧪 **Well Tested** - Unit, integration, and E2E tests (80%+ coverage goal)

### What Makes This Project Stand Out

This isn't another todo app or blog. DevPulse demonstrates:

✅ **Complex System Architecture** - Microservices-lite design with proper separation of concerns  
✅ **Real-time Data Pipeline** - WebSocket connections, Redis pub/sub, event-driven architecture  
✅ **Database Engineering** - Time-series optimization, partitioning, materialized views  
✅ **Production Practices** - Observability, error tracking, CI/CD, security best practices  
✅ **AI Integration** - Thoughtful LLM implementation for genuine value-add features  
✅ **Scalability Thinking** - Caching strategies, rate limiting, job queues

---

## 🏗️ Architecture

```
Frontend (Next.js 14)
    ├── Server Components (RSC)
    ├── Client Components (React Query)
    └── WebSocket Client (Socket.io)
           │
           ▼
    API Layer (Next.js + Express)
    ├── REST Endpoints
    ├── GraphQL (Apollo)
    └── WebSocket Server
           │
           ▼
    Data Layer
    ├── PostgreSQL (Primary DB)
    ├── Redis (Cache + Queue)
    └── Background Workers (BullMQ)
           │
           ▼
    External Services
    ├── GitHub API
    ├── Anthropic Claude API
    └── Monitoring (Sentry)
```

See [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) for detailed architecture documentation.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- GitHub OAuth App credentials
- Anthropic API key

### Installation

1. **Clone and initialize:**

   ```bash
   # Make the init script executable
   chmod +x init-devpulse.sh

   # Run initialization (creates Next.js project, installs deps)
   ./init-devpulse.sh

   cd devpulse
   ```

2. **Set up environment variables:**

   ```bash
   # Copy example env file
   cp .env.example .env.local

   # Edit .env.local and add your credentials:
   # - GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET
   # - ANTHROPIC_API_KEY
   # - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
   ```

3. **Start Docker services:**

   ```bash
   npm run docker:up
   ```

4. **Set up database:**

   ```bash
   # Copy the Prisma schema
   cp ../prisma-schema.prisma prisma/schema.prisma

   # Push schema to database
   npm run db:push

   # (Optional) Seed with sample data
   npm run db:seed
   ```

5. **Start development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) 🎉

### Additional Services

```bash
# Start background workers
npm run worker

# Open Prisma Studio (database GUI)
npm run db:studio

# Run tests
npm run test
npm run test:e2e
```

---

## 📁 Project Structure

```
devpulse/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed/                   # Seed data scripts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, etc.)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── charts/            # Chart components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── db/                # Prisma client & utilities
│   │   ├── redis/             # Redis client
│   │   ├── auth/              # NextAuth configuration
│   │   ├── github/            # GitHub API wrapper
│   │   ├── ai/                # Claude API integration
│   │   └── utils/             # Utility functions
│   ├── server/
│   │   ├── api/               # Express API server (if separate)
│   │   ├── workers/           # Background job workers
│   │   ├── websocket/         # Socket.io server
│   │   └── jobs/              # Cron jobs
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript type definitions
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # Playwright E2E tests
├── .github/
│   └── workflows/             # CI/CD pipelines
└── docs/
    ├── TECHNICAL_DESIGN.md    # Architecture documentation
    ├── PROJECT_ROADMAP.md     # Development roadmap
    └── API.md                 # API documentation
```

---

## 🛠️ Tech Stack Deep Dive

### Frontend

- **Next.js 14** - React framework with App Router, Server Components
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality, accessible component library
- **Recharts + D3.js** - Data visualization
- **Zustand** - Lightweight state management
- **React Query** - Server state management with caching
- **Socket.io-client** - Real-time WebSocket connections

### Backend

- **Node.js 20** - Runtime environment
- **Express.js** - Web framework
- **NextAuth.js** - Authentication (GitHub OAuth)
- **Prisma** - Type-safe ORM
- **BullMQ** - Redis-based job queue
- **Socket.io** - WebSocket server
- **Zod** - Schema validation

### Database & Caching

- **PostgreSQL 15** - Primary database
  - Time-series partitioning for activity events
  - Materialized views for aggregations
  - JSON columns for flexible data
- **Redis 7** - Multi-purpose
  - Query caching
  - Session storage
  - Job queue
  - Rate limiting
  - Pub/sub for real-time updates

### AI/ML

- **Anthropic Claude API** - LLM for insights
  - Code pattern analysis
  - Natural language queries
  - Personalized recommendations

### DevOps

- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Vercel** - Frontend hosting
- **Railway/Render** - Backend hosting
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring

---

## 🔑 Key Technical Highlights

### 1. Real-time Architecture

```typescript
// WebSocket server with Redis pub/sub
io.on('connection', (socket) => {
  socket.join(`user:${userId}`);

  redisSubscriber.subscribe(`activity:${userId}`);
  redisSubscriber.on('message', (channel, message) => {
    socket.to(`user:${userId}`).emit('activity:update', JSON.parse(message));
  });
});
```

### 2. Efficient Data Aggregation

```sql
-- Daily stats aggregation with window functions
SELECT
  user_id,
  DATE(occurred_at) as stat_date,
  COUNT(*) FILTER (WHERE event_type = 'COMMIT') as total_commits,
  SUM(duration_seconds) as coding_time_seconds,
  jsonb_object_agg(language, count) as languages
FROM activity_events
WHERE user_id = $1
  AND occurred_at >= $2
GROUP BY user_id, DATE(occurred_at);
```

### 3. Multi-layer Caching Strategy

```typescript
// 1. React Query (client-side)
// 2. Redis (server-side)
// 3. PostgreSQL (materialized views)

async function getAnalytics(userId: string) {
  // Check Redis cache
  const cached = await redis.get(`analytics:${userId}`);
  if (cached) return JSON.parse(cached);

  // Query database
  const data = await db.dailyStats.findMany({ where: { userId } });

  // Cache for 5 minutes
  await redis.setex(`analytics:${userId}`, 300, JSON.stringify(data));

  return data;
}
```

### 4. Background Job Processing

```typescript
// Add job to queue
await queue.add(
  'github-sync',
  {
    userId,
    since: lastSyncDate,
  },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
);

// Worker processes jobs
queue.process('github-sync', async (job) => {
  const { userId, since } = job.data;
  // Fetch and process GitHub data
  return processGitHubData(userId, since);
});
```

### 5. AI-Powered Insights

```typescript
// Stream AI response to client
const stream = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  messages: [
    {
      role: 'user',
      content: generatePrompt(userData, query),
    },
  ],
  stream: true,
});

for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
}
```

---

## 📊 Performance Metrics

Target metrics (to be measured post-deployment):

- **API Response Time**: p95 < 100ms (cached), < 300ms (database)
- **Database Queries**: < 50ms average for indexed queries
- **Frontend Load**: First Contentful Paint < 1s
- **Lighthouse Score**: > 90 across all categories
- **WebSocket Latency**: < 100ms for real-time updates
- **Test Coverage**: > 80% across all code

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

Testing strategy:

- **Unit tests**: Pure functions, utilities, business logic
- **Integration tests**: API endpoints, database operations
- **E2E tests**: Critical user flows (login, dashboard, data sync)

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
# Connected to GitHub, auto-deploys on push to main
vercel --prod
```

### Backend (Railway)

```bash
railway up
```

### Environment Variables

Ensure all production environment variables are set:

- Database connection strings
- API keys
- OAuth credentials
- Redis connection

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment guide.

---

## 📈 Roadmap

See [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) for detailed week-by-week plan.

**Current Phase**: Week 1 - Foundation & Setup  
**Next Milestone**: GitHub integration and data sync

### Upcoming Features

- [ ] VS Code extension for local activity tracking
- [ ] Team collaboration features
- [ ] Public developer profiles
- [ ] Email digests (weekly summaries)
- [ ] More platform integrations (GitLab, Bitbucket)

---

## 🤝 Contributing

This is primarily a portfolio project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - feel free to use this project as inspiration for your own portfolio!

---

## 👨‍💻 About This Project

DevPulse was built as a portfolio project to demonstrate production-level full-stack development skills. It showcases:

- Complex system architecture and design patterns
- Real-world data processing and analytics
- Modern web development best practices
- AI integration with practical applications
- DevOps and deployment expertise

**Why DevPulse?** Most portfolio projects are simple CRUD apps or tutorial follow-alongs. DevPulse goes beyond by tackling real engineering challenges: real-time data processing, time-series optimization, AI integration, and production-grade infrastructure.

---

## 📚 Resources

- [Technical Design Document](./TECHNICAL_DESIGN.md)
- [Project Roadmap](./PROJECT_ROADMAP.md)
- [API Documentation](./docs/API.md)
- [Case Study](./docs/CASE_STUDY.md) (coming soon)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Anthropic](https://www.anthropic.com/) - Claude AI API

---

**Built with ❤️ for ambitious developers who want to stand out**

Questions? Feedback? [Open an issue](https://github.com/yourusername/devpulse/issues)!
