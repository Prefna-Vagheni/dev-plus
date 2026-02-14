// lib/graphql/mutations.ts - GraphQL Mutations
import { gql } from '@apollo/client';

export const TRIGGER_SYNC = gql`
  mutation TriggerSync($input: SyncInput!) {
    triggerSync(input: $input) {
      id
      jobType
      status
      startedAt
    }
  }
`;

export const GENERATE_INSIGHT = gql`
  mutation GenerateInsight($input: GenerateInsightInput!) {
    generateInsight(input: $input) {
      id
      insightType
      title
      query
      response
      createdAt
      expiresAt
    }
  }
`;

export const REGENERATE_INSIGHT = gql`
  mutation RegenerateInsight($id: ID!) {
    regenerateInsight(id: $id) {
      id
      insightType
      title
      query
      response
      createdAt
      expiresAt
    }
  }
`;

export const DELETE_INSIGHT = gql`
  mutation DeleteInsight($id: ID!) {
    deleteInsight(id: $id)
  }
`;

export const CLEAR_CACHE = gql`
  mutation ClearCache($pattern: String) {
    clearCache(pattern: $pattern)
  }
`;
