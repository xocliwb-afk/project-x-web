import type {
  LeadCreateRequest,
  LeadCreateResponse,
  LeadResponse,
  ApiError,
} from '@project-x/shared-types';

export type SubmitLeadResult = {
  success: boolean;
  message?: string;
  leadId?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3002';

export async function submitLead(payload: LeadCreateRequest): Promise<SubmitLeadResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessage = 'Failed to submit lead';

      try {
        const errorData = (await res.json()) as ApiError;
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // ignore JSON parse errors
      }

      return { success: false, message: errorMessage };
    }

    const data = (await res.json()) as LeadCreateResponse | LeadResponse;
    return { success: true, leadId: (data as LeadCreateResponse).leadId };
  } catch (err) {
    return {
      success: false,
      message: 'A network error occurred. Please try again.',
    };
  }
}
