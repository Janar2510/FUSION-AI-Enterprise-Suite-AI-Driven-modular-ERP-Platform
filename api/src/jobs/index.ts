/**
 * jobs/index — registers and starts all background jobs
 * Called once from api/src/index.ts after the server starts.
 */

import { startOutboxRelay } from './outboxRelay';
import { startSlaBreach } from './slaBreach';
import { startSubscriptionRenewal } from './subscriptionRenewal';
import { startCampaignWorkflowRunner } from './campaignWorkflowRunner';

export function startBackgroundJobs() {
    startOutboxRelay();
    startSlaBreach();
    startSubscriptionRenewal();
    startCampaignWorkflowRunner();
    console.log('[Jobs] All background jobs registered');
}
