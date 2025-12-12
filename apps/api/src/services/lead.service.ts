import { CRMConfig } from '@project-x/shared-types';
import type { NormalizedLead } from '../providers/crm/crm-provider.interface';
import { getCrmProvider } from '../providers/crm/crm-provider.factory';

export class LeadService {
  async submitLead(payload: NormalizedLead): Promise<void> {
    const config = this.resolveConfig(payload.brokerId);
    const provider = getCrmProvider(config);

    await provider.createLead(payload, config);
    this.logLeadEvent(payload);
  }

  private resolveConfig(brokerId?: string): CRMConfig {
    const safeBrokerId = brokerId && brokerId.trim() ? brokerId : 'default-broker';
    const fallbackUrl = process.env.DEFAULT_LEAD_WEBHOOK_URL;

    if (fallbackUrl) {
      return {
        brokerId: safeBrokerId,
        crmType: 'webhook',
        webhookUrl: fallbackUrl,
        webhookSecret: process.env.DEFAULT_LEAD_WEBHOOK_SECRET,
      };
    }

    return {
      brokerId: safeBrokerId,
      crmType: 'null',
    };
  }

  private logLeadEvent(payload: NormalizedLead): void {
    console.log('[LeadService] Lead processed', {
      timestamp: new Date().toISOString(),
      listingId: payload.listingId,
      source: payload.source,
      leadId: payload.leadId,
    });
  }
}
