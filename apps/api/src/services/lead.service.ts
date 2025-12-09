import {
  CRMConfig,
  LeadPayload,
} from '@project-x/shared-types';
import { getCrmProvider } from '../providers/crm/crm-provider.factory';

export class LeadService {
  async submitLead(payload: LeadPayload): Promise<void> {
    const config = this.resolveConfig(payload.brokerId);
    const provider = getCrmProvider(config);

    await provider.createLead(payload, config);
    this.logLeadEvent(payload, config);
  }

  private resolveConfig(brokerId: string): CRMConfig {
    const fallbackUrl = process.env.DEFAULT_LEAD_WEBHOOK_URL;

    if (fallbackUrl) {
      return {
        brokerId,
        crmType: 'webhook',
        webhookUrl: fallbackUrl,
        webhookSecret: process.env.DEFAULT_LEAD_WEBHOOK_SECRET,
      };
    }

    return {
      brokerId,
      crmType: 'null',
    };
  }

  private logLeadEvent(payload: LeadPayload, config: CRMConfig): void {
    console.log('[LeadService] Lead processed', {
      timestamp: new Date().toISOString(),
      brokerId: payload.brokerId,
      listingId: payload.listingId,
      source: payload.source,
      crmType: config.crmType,
    });
  }
}
