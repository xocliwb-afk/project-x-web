"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import type { LeadCreateRequest } from "@project-x/shared-types";
import { submitLead } from "@/lib/lead-api";

interface LeadFormProps {
  listingId?: string;
  listingAddress?: string;
  source?: LeadCreateRequest["source"];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LeadForm({
  listingId,
  listingAddress,
  source = "unknown",
  onSuccess,
  onCancel,
}: LeadFormProps) {
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: listingAddress
      ? `I'm interested in ${listingAddress}`
      : "I'm interested in this property.",
    consent: false,
    honeypot: "",
  });
  const [meta, setMeta] = useState({
    sourceUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    setMeta({
      sourceUrl: url.toString(),
      utmSource: url.searchParams.get("utm_source") || "",
      utmMedium: url.searchParams.get("utm_medium") || "",
      utmCampaign: url.searchParams.get("utm_campaign") || "",
    });
  }, []);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      message: listingAddress
        ? `I'm interested in ${listingAddress}`
        : "I'm interested in this property.",
    }));
  }, [listingAddress]);

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

    const trimmedName = formState.fullName.trim();
    const [firstName, ...restName] = trimmedName.split(" ").filter(Boolean);
    const lastName = restName.length ? restName.join(" ") : "";

    const payload: LeadCreateRequest = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: formState.email.trim() || undefined,
      phone: formState.phone.trim() || undefined,
      message: formState.message.trim() || undefined,
      listingId,
      source: source || "unknown",
      sourceUrl: meta.sourceUrl || undefined,
      utmSource: meta.utmSource || undefined,
      utmMedium: meta.utmMedium || undefined,
      utmCampaign: meta.utmCampaign || undefined,
      consentToContact: formState.consent,
      honeypot: formState.honeypot,
    };

    try {
      const result = await submitLead(payload);

      if (!result.success) {
        throw new Error(result.message || "Failed to submit lead");
      }

      setStatus("success");
      setFormState({
        fullName: "",
        email: "",
        phone: "",
        message: listingAddress
          ? `I'm interested in ${listingAddress}`
          : "I'm interested in this property.",
        consent: false,
        honeypot: "",
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
          name="fullName"
          required
          value={formState.fullName}
          onChange={handleChange}
          className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
          placeholder="Name"
        />
        <input
          type="email"
          name="email"
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
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="consent"
            name="consent"
            checked={formState.consent}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, consent: e.target.checked }))
            }
            className="mt-1"
            required
          />
          <label htmlFor="consent" className="text-xs text-text-muted">
            I agree to be contacted about this inquiry.
          </label>
        </div>

        <input
          type="text"
          name="honeypot"
          value={formState.honeypot}
          onChange={handleChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
        />
        <input type="hidden" name="sourceUrl" value={meta.sourceUrl} readOnly />
        <input type="hidden" name="source" value={source} readOnly />
        <input type="hidden" name="listingId" value={listingId ?? ""} readOnly />
        <input type="hidden" name="utmSource" value={meta.utmSource} readOnly />
        <input type="hidden" name="utmMedium" value={meta.utmMedium} readOnly />
        <input type="hidden" name="utmCampaign" value={meta.utmCampaign} readOnly />

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
