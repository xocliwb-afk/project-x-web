'use client';

import { useEffect, useState } from 'react';
import type { Listing, LeadCreateRequest } from '@project-x/shared-types';
import { submitLead } from '@/lib/lead-api';

type LeadCaptureModalProps = {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  brokerId: string;
};

export function LeadCaptureModal({
  listing,
  isOpen,
  onClose,
  brokerId,
}: LeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSourceUrl(window.location.href);
  }, []);

  if (!isOpen) return null;

  function handleBackdropClick() {
    onClose();
  }

  function handleContentClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const nameParts = name.trim().split(' ').filter(Boolean);
    const [firstName, ...restName] = nameParts;

    const payload: LeadCreateRequest = {
      firstName: firstName || undefined,
      lastName: restName.length ? restName.join(' ') : undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      message: message.trim() || undefined,
      listingId: listing.id,
      source: 'pdp',
      sourceUrl: sourceUrl || undefined,
      consentToContact: consent,
      honeypot,
    };

    const result = await submitLead(payload);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.message || 'Failed to send your message.');
    }

    setIsLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={handleContentClick}
      >
        <h2 className="mb-2 text-lg font-semibold text-slate-900">
          I&apos;m interested in this home
        </h2>
        <p className="mb-4 text-xs text-slate-500">Listing #{listing.id}</p>

        {submitted ? (
          <p className="text-sm text-green-600">
            Thanks! Your interest has been noted. (In a later epic this will send to the backend.)
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-700">Name</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Phone (optional)</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Message</label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
                required
              />
              <label htmlFor="consent" className="text-xs text-slate-600">
                I agree to be contacted about this inquiry.
              </label>
            </div>
            <input
              type="text"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
