import { CRMConfig } from '@project-x/shared-types';
import type { NormalizedLead } from '../providers/crm/crm-provider.interface';

export interface CrmConnector {
  sendLead(lead: NormalizedLead, config: CRMConfig): Promise<void>;
}
