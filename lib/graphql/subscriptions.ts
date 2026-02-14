// lib/graphql/subscriptions.ts - GraphQL Subscriptions Setup
import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

// Subscription event names
export const SUBSCRIPTION_EVENTS = {
  SYNC_JOB_UPDATED: 'SYNC_JOB_UPDATED',
  ACTIVITY_EVENT_CREATED: 'ACTIVITY_EVENT_CREATED',
  INSIGHT_GENERATING: 'INSIGHT_GENERATING',
};

// Subscription resolvers (add to resolvers.ts)
export const subscriptionResolvers = {
  Subscription: {
    syncJobUpdated: {
      subscribe: (_: any, args: any) => {
        return (pubsub as any).asyncIterator([
          `${SUBSCRIPTION_EVENTS.SYNC_JOB_UPDATED}_${args.userId}`,
        ]);
      },
    },

    activityEventCreated: {
      subscribe: (_: any, args: any) => {
        return (pubsub as any).asyncIterator([
          `${SUBSCRIPTION_EVENTS.ACTIVITY_EVENT_CREATED}_${args.userId}`,
        ]);
      },
    },

    insightGenerating: {
      subscribe: (_: any, args: any) => {
        return (pubsub as any).asyncIterator([
          `${SUBSCRIPTION_EVENTS.INSIGHT_GENERATING}_${args.userId}`,
        ]);
      },
    },
  },
};

// Helper functions to publish events

export function publishSyncJobUpdate(userId: string, syncJob: any) {
  pubsub.publish(`${SUBSCRIPTION_EVENTS.SYNC_JOB_UPDATED}_${userId}`, {
    syncJobUpdated: syncJob,
  });
}

export function publishActivityEvent(userId: string, activityEvent: any) {
  pubsub.publish(`${SUBSCRIPTION_EVENTS.ACTIVITY_EVENT_CREATED}_${userId}`, {
    activityEventCreated: activityEvent,
  });
}

export function publishInsightProgress(userId: string, progress: any) {
  pubsub.publish(`${SUBSCRIPTION_EVENTS.INSIGHT_GENERATING}_${userId}`, {
    insightGenerating: progress,
  });
}
