/**
 * jobs/index — registers and starts all background jobs
 * Called once from api/src/index.ts after the server starts.
 */

import { startOutboxRelay } from './outboxRelay';

export function startBackgroundJobs() {
    startOutboxRelay();
    console.log('[Jobs] All background jobs registered');
}
