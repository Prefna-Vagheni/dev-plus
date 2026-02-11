//# In your dev environment, create a test script
//# src/scripts/test-aggregation.ts

import { addJob } from '../lib/queue/config';

async function testAggregation() {
  const userId = 'ti4ePv0woB3flNDcHqbV4IovtbZbx4xP'; // From Prisma Studio

  await addJob('dataAggregation', 'aggregate-daily-stats', {
    userId,
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
  });

  console.log('Aggregation job added!');
}

testAggregation();
