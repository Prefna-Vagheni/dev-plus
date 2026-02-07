// prisma/seed.ts - Development seed data
import { PrismaClient, EventType, EventSource } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@devpulse.dev' },
    update: {},
    create: {
      id: createId(),
      email: 'test@devpulse.dev',
      name: 'Test Developer',
      image: 'https://github.com/identicons/test.png',
      githubUsername: 'testdev',
      githubId: '12345678',
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create user settings
  await prisma.userSettings.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      timezone: 'America/New_York',
      theme: 'dark',
      notificationsEnabled: true,
      emailDigest: true,
      publicProfile: false,
      autoSyncEnabled: true,
      syncFrequency: 'daily',
      preferences: {
        defaultView: 'dashboard',
        chartType: 'line',
      },
    },
  });

  console.log('✅ Created user settings');

  // Create some test repositories
  const repos = [
    {
      name: 'devpulse',
      fullName: 'testdev/devpulse',
      description: 'Developer analytics platform',
      language: 'TypeScript',
      stars: 42,
      forks: 7,
    },
    {
      name: 'awesome-project',
      fullName: 'testdev/awesome-project',
      description: 'An awesome project',
      language: 'JavaScript',
      stars: 128,
      forks: 15,
    },
    {
      name: 'learning-rust',
      fullName: 'testdev/learning-rust',
      description: 'Learning Rust programming',
      language: 'Rust',
      stars: 5,
      forks: 1,
    },
  ];

  for (const repo of repos) {
    await prisma.repository.upsert({
      where: {
        userId_githubRepoId: {
          userId: testUser.id,
          githubRepoId: `repo-${repo.name}`,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        githubRepoId: `repo-${repo.name}`,
        ...repo,
        lastActivityAt: new Date(),
      },
    });
  }

  console.log('✅ Created test repositories');

  // Create sample activity events (last 7 days)
  const now = new Date();
  const events = [];

  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Add some commits
    for (let i = 0; i < Math.floor(Math.random() * 10) + 3; i++) {
      events.push({
        userId: testUser.id,
        eventType: EventType.COMMIT,
        source: EventSource.GITHUB,
        repositoryName: repos[Math.floor(Math.random() * repos.length)].name,
        language: repos[Math.floor(Math.random() * repos.length)].language,
        eventData: {
          message: `feat: implement feature ${i + 1}`,
          sha: createId(),
          additions: Math.floor(Math.random() * 100),
          deletions: Math.floor(Math.random() * 50),
        },
        occurredAt: new Date(
          date.getTime() - Math.random() * 24 * 60 * 60 * 1000,
        ),
      });
    }

    // Add a PR or two
    if (Math.random() > 0.5) {
      events.push({
        userId: testUser.id,
        eventType: EventType.PULL_REQUEST,
        source: EventSource.GITHUB,
        repositoryName: repos[Math.floor(Math.random() * repos.length)].name,
        eventData: {
          title: `feat: add new feature`,
          number: Math.floor(Math.random() * 100),
          state: 'open',
        },
        occurredAt: new Date(
          date.getTime() - Math.random() * 24 * 60 * 60 * 1000,
        ),
      });
    }

    // Add coding sessions
    events.push({
      userId: testUser.id,
      eventType: EventType.CODE_SESSION,
      source: EventSource.VSCODE,
      repositoryName: repos[Math.floor(Math.random() * repos.length)].name,
      language: repos[Math.floor(Math.random() * repos.length)].language,
      durationSeconds: Math.floor(Math.random() * 7200) + 1800, // 30 min to 2 hours
      eventData: {
        files: Math.floor(Math.random() * 10) + 1,
      },
      occurredAt: new Date(
        date.getTime() - Math.random() * 24 * 60 * 60 * 1000,
      ),
    });
  }

  await prisma.activityEvent.createMany({
    data: events,
  });

  console.log(`✅ Created ${events.length} activity events`);

  // Create daily stats aggregates
  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);

    const dayEvents = events.filter((e) => {
      const eventDate = new Date(e.occurredAt);
      return eventDate.toDateString() === date.toDateString();
    });

    const commits = dayEvents.filter((e) => e.eventType === EventType.COMMIT);
    const prs = dayEvents.filter((e) => e.eventType === EventType.PULL_REQUEST);
    const sessions = dayEvents.filter(
      (e) => e.eventType === EventType.CODE_SESSION,
    );

    const languageStats: Record<string, number> = {};
    dayEvents.forEach((e) => {
      if (e.language) {
        languageStats[e.language] = (languageStats[e.language] || 0) + 1;
      }
    });

    await prisma.dailyStats.upsert({
      where: {
        userId_statDate: {
          userId: testUser.id,
          statDate: date,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        statDate: date,
        totalCommits: commits.length,
        totalPullRequests: prs.length,
        totalIssues: 0,
        totalCodeReviews: 0,
        codingTimeSeconds: sessions.reduce(
          (acc, s) => acc + (s.durationSeconds || 0),
          0,
        ),
        languages: languageStats,
        activeRepositories: [
          ...new Set(dayEvents.map((e) => e.repositoryName)),
        ],
        linesAdded: commits.reduce(
          (acc, c) => acc + ((c.eventData as any).additions || 0),
          0,
        ),
        linesDeleted: commits.reduce(
          (acc, c) => acc + ((c.eventData as any).deletions || 0),
          0,
        ),
      },
    });
  }

  console.log('✅ Created daily stats');

  // Create a sample AI insight
  await prisma.aIInsight.create({
    data: {
      userId: testUser.id,
      insightType: 'WEEKLY_SUMMARY',
      title: 'Weekly Summary',
      response:
        "This week, you've been highly productive with 42 commits across 3 repositories. Your primary focus has been on TypeScript development, with significant time spent in the devpulse project. Keep up the great work!",
      contextData: {
        commits: 42,
        repositories: 3,
        languages: ['TypeScript', 'JavaScript', 'Rust'],
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log('✅ Created AI insight');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
