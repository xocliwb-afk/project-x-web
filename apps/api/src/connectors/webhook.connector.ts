import fetch from 'node-fetch';
import { CRMConfig } from '@project-x/shared-types';
import { CrmConnector } from './connector.interface';
import type { NormalizedLead } from '../providers/crm/crm-provider.interface';

export class WebhookConnector implements CrmConnector {
  async sendLead(lead: NormalizedLead, config: CRMConfig): Promise<void> {
    if (!config.webhookUrl) {
      throw new Error('Webhook URL is not configured for this broker');
    }

    const { honeypot: _honeypot, ...safeLead } = lead as NormalizedLead & { honeypot?: string };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.webhookSecret ? { 'X-Webhook-Secret': config.webhookSecret } : {}),
      },
      body: JSON.stringify({
        source: lead.source ?? 'project-x-web',
        payload: safeLead,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Webhook connector failed with status ${response.status}: ${text || response.statusText}`,
      );
    }
  }
}
