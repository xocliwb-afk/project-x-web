import type { LeadPayload, ApiError } from '@project-x/shared-types';

export type SubmitLeadResult = {
  success: boolean;
  message?: string;
};

export async function submitLead(payload: LeadPayload): Promise<SubmitLeadResult> {
  try {
    const res = await fetch('/api/leads', {
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

    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: 'A network error occurred. Please try again.',
    };
  }
}
