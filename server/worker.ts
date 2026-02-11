// src/server/worker.ts
import '../lib/queue/worker';
import { initializeSchedulers } from '../lib/queue/scheduler';

// Start schedulers
initializeSchedulers();

console.log('Worker server started with schedulers');
