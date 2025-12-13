"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import type { LeadPayload } from "@project-x/shared-types";
import { submitLead, type LeadSubmitPayload } from "@/lib/lead-api";

const DEFAULT_BROKER_ID = process.env.NEXT_PUBLIC_BROKER_ID || "demo-broker";
const DEFAULT_AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || undefined;

interface LeadFormProps {
  listingId?: string;
  listingAddress?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LeadForm({
  listingId,
  listingAddress,
  onSuccess,
  onCancel,
}: LeadFormProps) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    message: listingAddress
      ? `I'm interested in ${listingAddress}`
      : "I'm interested in this property.",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const hasListing = Boolean(listingId);
    const payload: LeadSubmitPayload = {
      ...(hasListing ? { listingId } : {}),
      listingAddress,
      name: formState.name.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim() || undefined,
      message: formState.message.trim() || undefined,
      brokerId: DEFAULT_BROKER_ID,
      agentId: DEFAULT_AGENT_ID,
      source: hasListing ? "listing-pdp" : "global-cta",
    };

    try {
      const response = await submitLead(payload);

      if (!response.success) {
        throw new Error(response.message || "Failed to submit lead");
      }

      setStatus("success");
      setFormState({
        name: "",
        email: "",
        phone: "",
        message: listingAddress
          ? `I'm interested in ${listingAddress}`
          : "I'm interested in this property.",
      });
      onSuccess?.();
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error?.message ?? "Something went wrong");
    }
  };

  const isSubmitting = status === "loading";

  return (
    <div className="rounded-card bg-surface p-5 shadow-sm ring-1 ring-border">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-main">Contact Agent</h2>
          {listingAddress && (
            <p className="text-xs text-text-muted">{listingAddress}</p>
          )}
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-text-muted hover:text-text-main"
          >
            Close
          </button>
        )}
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          required
          value={formState.name}
          onChange={handleChange}
          className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
          placeholder="Name"
        />
        <input
          type="email"
          name="email"
          required
          value={formState.email}
          onChange={handleChange}
          className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
          placeholder="Email"
        />
        <input
          type="tel"
          name="phone"
          value={formState.phone}
          onChange={handleChange}
          className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
          placeholder="Phone"
        />
        <textarea
          name="message"
          value={formState.message}
          onChange={handleChange}
          className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
          rows={4}
          placeholder="Message"
        />

        {errorMessage && (
          <p className="text-sm text-danger">{errorMessage}</p>
        )}
        {status === "success" && (
          <p className="text-sm text-success">
            Thanks! The agent has received your request.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-button bg-primary-accent px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Request Info"}
        </button>
      </form>
    </div>
  );
}
