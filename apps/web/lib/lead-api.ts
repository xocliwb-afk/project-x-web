import type { LeadPayload, ApiError } from '@project-x/shared-types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  'http://localhost:3002';

export type SubmitLeadResult = {
  success: boolean;
  message?: string;
};

export async function submitLead(payload: LeadPayload): Promise<SubmitLeadResult> {
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

    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: 'A network error occurred. Please try again.',
    };
  }
}
