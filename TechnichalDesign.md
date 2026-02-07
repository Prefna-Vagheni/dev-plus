# DevPulse - Technical Design Document

## 1. Project Overview

**DevPulse** is a real-time developer analytics and insights platform that aggregates data from multiple sources (GitHub, local coding activity, integrations) to provide actionable insights powered by AI.

### Core Value Propositions

- Unified view of developer productivity across tools
- AI-powered insights and recommendations
- Real-time activity tracking and visualization
- Team collaboration features

---

## 2. Technical Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand (lightweight) + React Query (server state)
- **Charts**: Recharts + D3.js for complex visualizations
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library + Playwright

**Why Next.js 14?**

- Server Components for better performance
- Built-in API routes for simple endpoints
- Excellent TypeScript support
- Easy deployment on Vercel
- SEO benefits for public pages

### Backend

- **Runtime**: Node.js 20+
- **Framework**: Express.js (familiar, flexible)
- **Language**: TypeScript
- **API**: RESTful + GraphQL (Apollo Server)
- **Real-time**: Socket.io
- **Authentication**: NextAuth.js (handles OAuth + JWT)
- **Validation**: Zod (shared with frontend)
- **Job Queue**: BullMQ + Redis
- **Cron Jobs**: node-cron
- **Testing**: Jest + Supertest

**Why Express?**

- Battle-tested and widely used
- Excellent middleware ecosystem
- Easy to understand for recruiters
- Flexible architecture

### Database

- **Primary DB**: PostgreSQL 15+
- **ORM**: Prisma (excellent DX, type-safety)
- **Caching**: Redis 7+
- **Search** (future): Elasticsearch or PostgreSQL full-text

**Why PostgreSQL?**

- ACID compliance for user data
- Excellent for time-series data with partitioning
- JSON support for flexible data
- Window functions for analytics
- Mature ecosystem

### AI/ML

- **LLM**: Anthropic Claude API (Sonnet)
- **Use Cases**:
  - Code pattern analysis
  - Natural language queries
  - Personalized recommendations
  - Insight generation

### DevOps & Infrastructure

- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**:
  - Frontend: Vercel
  - Backend: Railway or Render
  - Database: Supabase (managed Postgres) or Railway
  - Redis: Upstash (serverless Redis)
- **Monitoring**: Sentry (errors) + Vercel Analytics
- **Logging**: Winston + Axiom

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Settings   │  │   Insights   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │   API Gateway  │
                    │   (Next.js +   │
                    │    Express)    │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│   Auth Service │  │  API Service │  │  WebSocket      │
│   (NextAuth)   │  │  (REST/GQL)  │  │  Service        │
└───────┬────────┘  └──────┬──────┘  └────────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  PostgreSQL    │  │    Redis    │  │  Background     │
│  (Primary DB)  │  │  (Cache +   │  │  Workers        │
│                │  │   Queue)    │  │  (BullMQ)       │
└────────────────┘  └─────────────┘  └────────┬────────┘
                                              │
                                     ┌────────▼────────┐
                                     │  External APIs  │
                                     │  • GitHub API   │
                                     │  • Claude API   │
                                     └─────────────────┘
```

### Data Flow

1. **User Authentication**:
   - User logs in via GitHub OAuth
   - NextAuth creates session + JWT
   - Token stored in httpOnly cookie

2. **Data Collection**:
   - GitHub webhook → API endpoint → Job Queue
   - VS Code extension → WebSocket → Real-time update
   - Scheduled jobs → Fetch GitHub data → Process → Store

3. **Real-time Updates**:
   - Client subscribes to WebSocket room
   - Background job processes event
   - Result published to Redis pub/sub
   - WebSocket server broadcasts to room
   - Client updates UI optimistically

4. **AI Insights**:
   - User requests insight
   - API aggregates relevant data
   - Send to Claude API with context
   - Stream response back to client
   - Cache result in Redis

---

## 4. Database Schema Design

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  github_username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme VARCHAR(20) DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Activity Events (Time-series data)
CREATE TABLE activity_events (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'commit', 'pr', 'issue', 'code_session'
  event_data JSONB NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'github', 'vscode', 'manual'
  duration_seconds INTEGER,
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, occurred_at, id)
) PARTITION BY RANGE (occurred_at);

-- Create partitions for time-series data (monthly)
CREATE TABLE activity_events_2024_01 PARTITION OF activity_events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for activity_events
CREATE INDEX idx_activity_user_time ON activity_events(user_id, occurred_at DESC);
CREATE INDEX idx_activity_type ON activity_events(event_type);

-- Daily Aggregates (Materialized view approach)
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  total_commits INTEGER DEFAULT 0,
  total_prs INTEGER DEFAULT 0,
  total_issues INTEGER DEFAULT 0,
  coding_time_seconds INTEGER DEFAULT 0,
  languages JSONB DEFAULT '{}', -- {"TypeScript": 3600, "Python": 1800}
  repositories JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stat_date)
);

CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, stat_date DESC);

-- GitHub Repositories
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  language VARCHAR(100),
  stars INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, github_repo_id)
);

-- AI Insights Cache
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(100) NOT NULL,
  query TEXT,
  response TEXT NOT NULL,
  context_data JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_insights_user_type ON ai_insights(user_id, insight_type, created_at DESC);

-- API Keys (for extensions/integrations)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);
```

### Key Design Decisions

1. **UUID Primary Keys**: Better for distributed systems, no sequential ID leakage
2. **Partitioned Tables**: `activity_events` partitioned by time for better query performance
3. **JSONB Fields**: Flexible storage for event_data, preferences, and aggregated stats
4. **Materialized Aggregates**: `daily_stats` pre-computed for dashboard performance
5. **Timestamps**: Always include `created_at` and `updated_at` for audit trails
6. **Proper Indexes**: Strategic indexes on query patterns (user_id + time)

---

## 5. API Design

### REST Endpoints

```
Authentication:
POST   /api/auth/signin           - Initiate OAuth flow
POST   /api/auth/signout          - Sign out user
GET    /api/auth/session          - Get current session

Users:
GET    /api/users/me              - Get current user
PATCH  /api/users/me              - Update user profile
GET    /api/users/me/settings     - Get user settings
PATCH  /api/users/me/settings     - Update settings

Activity:
GET    /api/activity              - Get activity events (paginated)
POST   /api/activity              - Create activity event
GET    /api/activity/stats        - Get aggregated stats
GET    /api/activity/timeline     - Get activity timeline

GitHub Integration:
POST   /api/github/sync           - Trigger GitHub data sync
GET    /api/github/repos          - Get user repositories
POST   /api/github/webhook        - GitHub webhook handler

Insights (AI):
POST   /api/insights/generate     - Generate AI insight
GET    /api/insights              - Get cached insights
POST   /api/insights/query        - Natural language query

Analytics:
GET    /api/analytics/overview    - Dashboard overview
GET    /api/analytics/trends      - Trend analysis
GET    /api/analytics/languages   - Language breakdown
GET    /api/analytics/productivity - Productivity metrics
```

### GraphQL Schema (for complex queries)

```graphql
type User {
  id: ID!
  githubUsername: String!
  email: String!
  name: String
  avatarUrl: String
  settings: UserSettings!
  stats: UserStats!
  activityTimeline(from: DateTime!, to: DateTime!): [ActivityEvent!]!
}

type UserStats {
  totalCommits: Int!
  totalPRs: Int!
  totalIssues: Int!
  codingTimeHours: Float!
  topLanguages: [LanguageStat!]!
  activeRepositories: Int!
}

type ActivityEvent {
  id: ID!
  type: EventType!
  data: JSON!
  occurredAt: DateTime!
  duration: Int
}

type Query {
  me: User!
  activityStats(period: Period!): UserStats!
  insights(type: InsightType): [AIInsight!]!
}

type Mutation {
  syncGitHubData: SyncResult!
  generateInsight(query: String!): AIInsight!
}

type Subscription {
  activityUpdated: ActivityEvent!
}
```

---

## 6. Key Features Breakdown

### MVP (Weeks 1-2)

- [ ] Authentication (GitHub OAuth)
- [ ] GitHub data sync (commits, PRs)
- [ ] Basic dashboard with charts
- [ ] Activity timeline
- [ ] Database setup with migrations

### Phase 2 (Weeks 3-4)

- [ ] Real-time WebSocket updates
- [ ] Background job processing
- [ ] Advanced analytics (trends, patterns)
- [ ] Redis caching layer
- [ ] API rate limiting

### Phase 3 (Weeks 5-6)

- [ ] AI insights integration (Claude API)
- [ ] Natural language queries
- [ ] Recommendation engine
- [ ] Performance optimization
- [ ] Comprehensive testing

### Phase 4 (Polish)

- [ ] VS Code extension (basic)
- [ ] Monitoring & observability
- [ ] Documentation
- [ ] Case study writeup
- [ ] Video demo

---

## 7. Performance Targets

- **API Response Time**: p95 < 100ms for cached, < 300ms for database queries
- **Database Queries**: < 50ms for indexed queries
- **Frontend Load**: First Contentful Paint < 1s
- **WebSocket Latency**: < 100ms for real-time updates
- **Bundle Size**: Initial JS < 200KB gzipped

---

## 8. Security Considerations

- OAuth 2.0 for authentication (no password storage)
- JWT tokens with short expiry + refresh tokens
- httpOnly cookies for token storage
- Rate limiting on all API endpoints (100 req/min per user)
- Input validation with Zod on all endpoints
- Parameterized queries (Prisma prevents SQL injection)
- CORS configured for specific origins
- Content Security Policy headers
- API key hashing (never store plaintext)
- GitHub webhook signature validation

---

## 9. Monitoring & Observability

- **Error Tracking**: Sentry for frontend + backend errors
- **Logging**: Structured JSON logs with Winston
- **Metrics**: Custom metrics for key operations
- **Health Checks**: `/health` endpoint with dependency checks
- **Performance**: Vercel Analytics for frontend, APM for backend

---

## 10. Development Workflow

1. **Local Development**:

   ```bash
   docker-compose up -d     # Start Postgres + Redis
   npm run dev              # Start Next.js dev server
   npm run worker           # Start background workers
   ```

2. **Database Migrations**:

   ```bash
   npx prisma migrate dev   # Create migration
   npx prisma db seed       # Seed data
   ```

3. **Testing**:

   ```bash
   npm run test             # Unit tests
   npm run test:e2e         # E2E tests
   npm run test:coverage    # Coverage report
   ```

4. **CI/CD**:
   - PR opened → Run tests + linting
   - Merge to main → Deploy to staging
   - Tag release → Deploy to production

---

## 11. File Structure

```
devpulse/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── charts/
│   │   ├── dashboard/
│   │   └── shared/
│   ├── lib/
│   │   ├── db/                 # Prisma client
│   │   ├── redis/              # Redis client
│   │   ├── auth/               # NextAuth config
│   │   ├── github/             # GitHub API
│   │   ├── ai/                 # Claude API
│   │   └── utils/
│   ├── server/
│   │   ├── api/                # Express API server
│   │   ├── workers/            # Background jobs
│   │   ├── websocket/          # Socket.io server
│   │   └── jobs/               # Cron jobs
│   ├── types/
│   └── hooks/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## Next Steps

1. Initialize Next.js project with TypeScript
2. Set up Prisma + PostgreSQL
3. Configure authentication with NextAuth
4. Build basic UI with shadcn/ui
5. Implement GitHub OAuth flow
6. Create database schema + migrations
7. Build first API endpoints
8. Start GitHub data sync

This design document will serve as your north star throughout development.
