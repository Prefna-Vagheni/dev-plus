-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('COMMIT', 'PULL_REQUEST', 'ISSUE', 'CODE_REVIEW', 'CODE_SESSION', 'RELEASE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('GITHUB', 'VSCODE', 'MANUAL', 'API');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('WEEKLY_SUMMARY', 'CODE_PATTERN_ANALYSIS', 'PRODUCTIVITY_TREND', 'RECOMMENDATION', 'NATURAL_LANGUAGE_QUERY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "github_id" TEXT,
    "github_username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_digest" BOOLEAN NOT NULL DEFAULT true,
    "public_profile" BOOLEAN NOT NULL DEFAULT false,
    "auto_sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "syncFrequency" TEXT NOT NULL DEFAULT 'daily',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "github_repo_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "description" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "source" "EventSource" NOT NULL,
    "event_data" JSONB NOT NULL,
    "repository_name" TEXT,
    "language" TEXT,
    "duration_seconds" INTEGER,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stat_date" DATE NOT NULL,
    "total_commits" INTEGER NOT NULL DEFAULT 0,
    "total_pull_requests" INTEGER NOT NULL DEFAULT 0,
    "total_issues" INTEGER NOT NULL DEFAULT 0,
    "total_code_reviews" INTEGER NOT NULL DEFAULT 0,
    "coding_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "languages" JSONB NOT NULL DEFAULT '{}',
    "active_repositories" JSONB NOT NULL DEFAULT '[]',
    "lines_added" INTEGER NOT NULL DEFAULT 0,
    "lines_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "insight_type" "InsightType" NOT NULL,
    "title" TEXT,
    "query" TEXT,
    "response" TEXT NOT NULL,
    "context_data" JSONB,
    "expires_at" TIMESTAMP(3),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "rate_limit" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "items_processed" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_username_key" ON "users"("github_username");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "repositories_user_id_last_activity_at_idx" ON "repositories"("user_id", "last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_user_id_github_repo_id_key" ON "repositories"("user_id", "github_repo_id");

-- CreateIndex
CREATE INDEX "activity_events_user_id_occurred_at_idx" ON "activity_events"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "activity_events_user_id_event_type_occurred_at_idx" ON "activity_events"("user_id", "event_type", "occurred_at");

-- CreateIndex
CREATE INDEX "activity_events_occurred_at_idx" ON "activity_events"("occurred_at");

-- CreateIndex
CREATE INDEX "daily_stats_user_id_stat_date_idx" ON "daily_stats"("user_id", "stat_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_user_id_stat_date_key" ON "daily_stats"("user_id", "stat_date");

-- CreateIndex
CREATE INDEX "ai_insights_user_id_insight_type_created_at_idx" ON "ai_insights"("user_id", "insight_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_insights_expires_at_idx" ON "ai_insights"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "sync_jobs_user_id_status_idx" ON "sync_jobs"("user_id", "status");

-- CreateIndex
CREATE INDEX "sync_jobs_created_at_idx" ON "sync_jobs"("created_at");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
