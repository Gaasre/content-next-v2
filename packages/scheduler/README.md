# @content-next-v2/scheduler

Article scheduling system using BullMQ for delayed job processing.

## Overview

This package provides a queue-based scheduling system for automatically publishing articles at scheduled times. It uses BullMQ with Redis for reliable, distributed job processing.

## Features

- **Delayed Job Execution**: Schedule articles to be published at specific future times
- **Job Cancellation**: Cancel scheduled publications when needed
- **Automatic Retries**: Failed jobs retry 3 times with exponential backoff
- **Idempotent Processing**: Jobs check article status before publishing to prevent duplicates
- **Graceful Shutdown**: Clean worker shutdown on process termination

## Installation

This package is part of the content-next-v2 monorepo and requires Redis to be running.

### Redis Setup

**Local Development:**

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or using Homebrew (macOS)
brew install redis
brew services start redis
```

**Production:**
Use a managed Redis service like:

- Redis Cloud
- AWS ElastiCache
- Upstash
- Railway

## Environment Variables

Configure Redis connection in your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, only if Redis requires authentication
```

## Usage

### Initialize Worker

In your server startup (e.g., `apps/server/src/index.ts`):

```typescript
import { initializeWorker, shutdownWorker } from "@content-next-v2/scheduler";

// Initialize on startup
initializeWorker();

// Shutdown gracefully
process.on("SIGTERM", async () => {
  await shutdownWorker();
  process.exit(0);
});
```

### Schedule an Article

```typescript
import { scheduleArticlePublish } from "@content-next-v2/scheduler";

// Schedule article to publish in the future
const scheduledFor = new Date("2025-12-31T12:00:00Z");
await scheduleArticlePublish("article-id-123", scheduledFor);
```

### Cancel a Scheduled Article

```typescript
import { cancelScheduledArticle } from "@content-next-v2/scheduler";

// Cancel the scheduled publication
await cancelScheduledArticle("article-id-123");
```

### Reschedule an Article

```typescript
import { rescheduleArticlePublish } from "@content-next-v2/scheduler";

// Change the scheduled time
const newScheduledFor = new Date("2026-01-15T10:00:00Z");
await rescheduleArticlePublish("article-id-123", newScheduledFor);
```

## How It Works

1. **Scheduling**: When an article is scheduled, a delayed job is added to the BullMQ queue with the article ID and publish time
2. **Job Storage**: BullMQ stores the job in Redis with a delay based on the scheduled time
3. **Automatic Execution**: When the scheduled time arrives, BullMQ automatically processes the job
4. **Publishing**: The job handler updates the article status to "published" in the database
5. **Idempotency**: Before publishing, the handler checks if the article is still scheduled (not deleted or already published)

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   API       │         │   Redis     │         │   Worker     │
│   Router    │─schedule─▶   Queue    │─delayed─▶   Process    │
│             │         │             │  job    │              │
└─────────────┘         └─────────────┘         └──────┬───────┘
                                                        │
                                                        ▼
                                                ┌──────────────┐
                                                │  PostgreSQL  │
                                                │  (Articles)  │
                                                └──────────────┘
```

## Job Configuration

- **Attempts**: 3 retries on failure
- **Backoff**: Exponential, starting at 5 seconds
- **Completed Jobs**: Kept for 24 hours (max 1000)
- **Failed Jobs**: Kept for 7 days
- **Concurrency**: 5 jobs processed simultaneously

## Monitoring

The worker logs all important events:

- Job scheduling
- Job completion
- Job failures
- Worker errors

For production monitoring, consider adding:

- BullMQ Board for web UI
- Metrics export (Prometheus)
- Alerting on failed jobs

## Error Handling

The system handles various edge cases:

- **Article already published**: Job succeeds without action
- **Article deleted**: Job succeeds without action
- **Article status changed**: Job succeeds without action
- **Database errors**: Job retries with exponential backoff
