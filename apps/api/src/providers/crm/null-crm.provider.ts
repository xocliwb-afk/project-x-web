import type { CRMConfig } from '@project-x/shared-types';
import { CrmProvider, type NormalizedLead } from './crm-provider.interface';

/**
 * NullCrmProvider is the default "no-op" CRM provider.
 * It records that a lead was received but does not make any external calls.
 */
export class NullCrmProvider implements CrmProvider {
  async createLead(lead: NormalizedLead, config: CRMConfig): Promise<void> {
    console.log('[NullCrmProvider] Lead captured (no external CRM call):', {
      brokerId: config.brokerId,
      leadId: lead.leadId,
      listingId: lead.listingId,
      source: lead.source,
    });

    // No external side effects
    return Promise.resolve();
  }
}
