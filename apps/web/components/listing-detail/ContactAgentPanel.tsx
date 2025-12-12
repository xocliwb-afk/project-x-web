'use client';

import { useEffect, useState } from 'react';
import type { LeadCreateRequest } from '@project-x/shared-types';
import { submitLead } from '@/lib/lead-api';

type ContactAgentPanelProps = {
  listingId: string;
  brokerId: string;
};

export default function ContactAgentPanel({ listingId, brokerId }: ContactAgentPanelProps) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const nameParts = name.trim().split(' ').filter(Boolean);
    const [firstName, ...restName] = nameParts;
    const payload: LeadCreateRequest = {
      firstName: firstName || undefined,
      lastName: restName.length ? restName.join(' ') : undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      message: message.trim() || undefined,
      listingId,
      source: 'pdp',
      sourceUrl: sourceUrl || undefined,
      consentToContact: consent,
      honeypot,
    };

    try {
      const result = await submitLead(payload);

      if (result.success) {
        setSubmitted(true);
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
        setConsent(false);
        setHoneypot('');
      } else {
        setError(result.message || 'Failed to send your message.');
      }
    } catch (err) {
      console.error('Failed to submit lead', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">Contact Agent</h2>
      {submitted ? (
        <p className="text-sm text-green-600">
          Thanks! Your message has been sent.
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
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isLoading ? 'Sending...' : 'Contact Agent'}
          </button>
        </form>
      )}
    </div>
  );
}
