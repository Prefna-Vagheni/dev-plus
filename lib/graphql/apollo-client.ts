// lib/graphql/apollo-client.ts - Apollo Client Setup
'use client';

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// Helper to get the correct URL
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // Browser uses relative path
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // Production
  return `http://localhost:${process.env.PORT || 3000}`; // Local development
};

const httpLink = new HttpLink({
  uri: `${getBaseUrl()}/api/graphql`,
  credentials: 'same-origin',
});
// const httpLink = new HttpLink({
//   uri: '/api/graphql',
//   credentials: 'same-origin',
// });

// WebSocket link for subscriptions (only in browser)
const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: `ws${window.location.protocol === 'https:' ? 's' : ''}://${window.location.host}/api/graphql/ws`,
        }),
      )
    : null;

// Split based on operation type
const splitLink =
  typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        httpLink,
      )
    : httpLink;

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          repositories: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          activityTimeline: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
