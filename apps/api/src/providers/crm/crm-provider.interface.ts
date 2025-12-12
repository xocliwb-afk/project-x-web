import type { CRMConfig, LeadCreateRequest } from '@project-x/shared-types';

export type NormalizedLead = Omit<LeadCreateRequest, 'source' | 'honeypot'> & {
  leadId: string;
  brokerId: string;
  agentId?: string;
  source: NonNullable<LeadCreateRequest['source']>;
  listingAddress?: string;
};

/**
 * CrmProvider abstracts a downstream CRM integration.
 * It receives a normalized LeadPayload and a CRMConfig that describes
 * how to talk to the downstream system (webhook, API client, etc).
 */
export interface CrmProvider {
  /**
   * Sends a lead to the configured CRM system.
   * @param lead - The lead data payload.
   * @param config - The broker-specific configuration for this CRM.
   */
  createLead(lead: NormalizedLead, config: CRMConfig): Promise<void>;
}
