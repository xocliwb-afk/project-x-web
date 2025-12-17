const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  'http://localhost:3001';

export type LeadSubmitPayload = {
  listingId?: string;
  listingAddress?: string;
  message?: string;
  name: string;
  email?: string;
  phone?: string;
  brokerId: string;
  agentId?: string;
  source?: string;
};

export type SubmitLeadResult = {
  success: boolean;
  message?: string;
};

export async function submitLead(payload: LeadSubmitPayload): Promise<SubmitLeadResult> {
  const normalizedPayload: LeadSubmitPayload = {
    ...payload,
    source: payload.source ?? 'project-x-web',
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedPayload),
    });

    if (!res.ok) {
      let errorMessage = 'Failed to submit lead';

      try {
        const errorData = (await res.json()) as { message?: string };
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
