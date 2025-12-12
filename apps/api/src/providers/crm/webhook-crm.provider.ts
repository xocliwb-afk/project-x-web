import type { CRMConfig } from '@project-x/shared-types';
import { CrmProvider, type NormalizedLead } from './crm-provider.interface';
import { WebhookConnector } from '../../connectors/webhook.connector';

/**
 * WebhookCrmProvider delegates to the existing WebhookConnector implementation
 * to send leads to a configured webhook endpoint.
 */
export class WebhookCrmProvider implements CrmProvider {
  private connector: WebhookConnector;

  constructor() {
    this.connector = new WebhookConnector();
  }

  async createLead(lead: NormalizedLead, config: CRMConfig): Promise<void> {
    await this.connector.sendLead(lead, config);
  }
}
