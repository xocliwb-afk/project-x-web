"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { usePathname } from "next/navigation";
import { submitLead, type LeadSubmitPayload } from "@/lib/lead-api";
import { trackEvent } from "@/lib/analytics";
import { buildLeadContext } from "@/lib/leadContext";
import type { Intent } from "@/stores/useLeadModalStore";

const DEFAULT_BROKER_ID =
  process.env.NEXT_PUBLIC_BROKER_ID || "demo-broker";
const DEFAULT_AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || undefined;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const RECAPTCHA_WAIT_TIMEOUT_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForRecaptchaExecute = async (
  timeoutMs = RECAPTCHA_WAIT_TIMEOUT_MS
): Promise<{ execute: (siteKey: string, options: { action: string }) => Promise<string> } | null> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= timeoutMs) {
    const grecaptcha = typeof window !== "undefined" ? (window as any).grecaptcha : undefined;
    if (grecaptcha && typeof grecaptcha.execute === "function") {
      return grecaptcha;
    }
    await sleep(100);
  }
  return null;
};

interface LeadFormProps {
  intent: Intent;
  entrySource?: string;
  listingId?: string;
  listingAddress?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LeadForm({
  intent,
  entrySource,
  listingId,
  listingAddress,
  onSuccess,
  onCancel,
}: LeadFormProps) {
  const pathname = usePathname() || "/";

  const getInitialMessage = (
    currentIntent: Intent,
    address?: string,
    interest?: string
  ): string => {
    if (currentIntent === "schedule-showing") {
      return address
        ? `I'd like to schedule a showing for ${address}`
        : "I'd like to schedule a showing.";
    }
    if (currentIntent === "get-details") {
      return address
        ? `I have questions about ${address}`
        : "I'm interested in learning more about available properties.";
    }
    // talk-to-brandon
    return interest ? `I'd like to discuss ${interest}` : "I'd like to discuss my real estate needs.";
  };

  const [messageAuto, setMessageAuto] = useState(true);

  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    interest: "",
    preferredArea: "",
    message: getInitialMessage(intent, listingAddress, undefined),
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submitStartedAtRef = useRef<number | null>(null);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (name === "message") setMessageAuto(false);
    if (name === "interest" && intent === "talk-to-brandon" && messageAuto) {
      setFormState((prev) => ({
        ...prev,
        message: getInitialMessage(intent, listingAddress, value),
      }));
    }
  };

  useEffect(() => {
    if (!messageAuto) return;
    setFormState((prev) => ({
      ...prev,
      message: getInitialMessage(intent, listingAddress, prev.interest),
    }));
  }, [intent, listingAddress, messageAuto]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    submitStartedAtRef.current = Date.now();

    if (!RECAPTCHA_SITE_KEY) {
      setStatus("error");
      setErrorMessage("Captcha not ready. Please try again.");
      trackEvent("lead_submit_error", {
        intent,
        entry_source: entrySource,
        listing_id: listingId,
        error_type: "captcha_unavailable",
      });
      return;
    }
    const grecaptcha = await waitForRecaptchaExecute();
    if (!grecaptcha) {
      setStatus("error");
      setErrorMessage("Security check is still loading — please try again.");
      trackEvent("lead_submit_error", {
        intent,
        entry_source: entrySource,
        listing_id: listingId,
        error_type: "captcha_unavailable",
      });
      return;
    }

    const hasListing = Boolean(listingId);
    const fullName = `${formState.firstName.trim()} ${formState.lastName.trim()}`.trim();
    const lines: string[] = [];
    const userMessage = formState.message.trim();
    if (userMessage) {
      lines.push(userMessage);
      lines.push("");
    }
    lines.push("---");
    lines.push(`Interest: ${formState.interest}`);
    if (formState.preferredArea.trim()) {
      lines.push(`Preferred area: ${formState.preferredArea.trim()}`);
    }
    const finalMessage: string | undefined = lines.join("\n") || undefined;

    let captchaToken: string | undefined;
    try {
      captchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "submit_lead" });
    } catch (err) {
      setStatus("error");
      setErrorMessage("Security check is still loading — please try again.");
      trackEvent("lead_submit_error", {
        intent,
        entry_source: entrySource,
        listing_id: listingId,
        error_type: "captcha_execute",
      });
      return;
    }

    const pageType = pathname.startsWith("/search")
      ? "search"
      : pathname.startsWith("/listing")
      ? "listing-detail"
      : "app";

    const context = buildLeadContext({
      page_type: pageType,
      page_slug: pathname.replace(/^\/+/, "") || undefined,
      listingId,
      listingAddress,
      source: hasListing ? "listing-pdp" : "global-cta",
      intent,
      entry_source: entrySource,
    });

    const payload: LeadSubmitPayload = {
      ...(hasListing ? { listingId } : {}),
      listingAddress,
      name: fullName,
      email: formState.email.trim(),
      phone: formState.phone.trim() || undefined,
      message: finalMessage,
      brokerId: DEFAULT_BROKER_ID,
      agentId: DEFAULT_AGENT_ID,
      source: hasListing ? "listing-pdp" : "global-cta",
      captchaToken,
      context,
    };

    try {
      const response = await submitLead(payload);

      if (!response.success) {
        throw new Error(response.message || "Failed to submit lead");
      }

      const duration = submitStartedAtRef.current
        ? Date.now() - submitStartedAtRef.current
        : undefined;
      trackEvent("lead_submit_success", {
        intent,
        entry_source: entrySource,
        listing_id: listingId,
        submission_duration_ms: duration,
      });

      setStatus("success");
      setFormState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        interest: "",
        preferredArea: "",
        message: getInitialMessage(intent, listingAddress, undefined),
      });
      onSuccess?.();
    } catch (error: any) {
      trackEvent("lead_submit_error", {
        intent,
        entry_source: entrySource,
        listing_id: listingId,
        error_type: "submit_failed",
      });
      setStatus("error");
      setErrorMessage(error?.message ?? "Something went wrong");
    }
  };

  const isSubmitting = status === "loading";

  const showInterestFields = intent === "talk-to-brandon";

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="firstName"
            required
            value={formState.firstName}
            onChange={handleChange}
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
            placeholder="First Name"
          />
          <input
            type="text"
            name="lastName"
            required
            value={formState.lastName}
            onChange={handleChange}
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
            placeholder="Last Name"
          />
        </div>
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
        {showInterestFields && (
          <>
            <select
              name="interest"
              required
              value={formState.interest}
              onChange={handleChange}
              className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select interest
              </option>
              <option value="Buying">Buying</option>
              <option value="Selling">Selling</option>
              <option value="Building / Renovation">Building / Renovation</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              name="preferredArea"
              value={formState.preferredArea}
              onChange={handleChange}
              className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
              placeholder="Preferred Area (optional)"
            />
          </>
        )}
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
