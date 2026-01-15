'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from 'next/navigation';
import { parseSearchPrompt, ParseSearchResult } from '@/lib/ai/parseSearchPrompt';
import { buildAiAssistDiff, DiffEntry } from '@/lib/search/aiAssistDiff';
import { applyAiProposedFilters } from '@/lib/search/applyAiProposedFilters';

const FEATURE_FLAG = process.env.NEXT_PUBLIC_AI_ASSIST_ENABLED === 'true';

const STATUS_REVERSE: Record<string, string> = {
  FOR_SALE: 'for_sale',
  PENDING: 'pending',
  SOLD: 'sold',
};

const PROPERTY_REVERSE: Record<string, string> = {
  'Single Family': 'house',
  Condo: 'condo',
  Townhome: 'townhome',
  Land: 'land',
  'Multi-Family': 'multi_family',
};

type AssistState = 'idle' | 'loading' | 'success' | 'error' | 'disabled' | 'rate_limited';

type Proposal = {
  requestId: string;
  proposedFilters: Record<string, any>;
  explanations: Array<{ field: string; reason: string }>;
  confidence: number;
  warnings: string[];
  ignoredInputReasons: string[];
};

const normalizeCurrentFilters = (params: ReadonlyURLSearchParams) => {
  const toNumber = (v: string | null) => (v != null && v !== '' ? Number(v) : null);
  const status = params.get('status');
  const city = params.get('city');
  const zip = params.get('zip');
  const keywords = params.get('keywords');
  return {
    status: status ? (STATUS_REVERSE[status] ?? status.toLowerCase()) : null,
    propertyType: (() => {
      const pt = params.get('propertyType');
      if (!pt) return null;
      return PROPERTY_REVERSE[pt] ?? pt.toLowerCase();
    })(),
    minPrice: toNumber(params.get('minPrice')),
    maxPrice: toNumber(params.get('maxPrice')),
    bedsMin: toNumber(params.get('beds')),
    bathsMin: toNumber(params.get('baths')),
    city: city || null,
    zip: zip || null,
    keywords: keywords ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : null,
  };
};

export default function AiAssistPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState<AssistState>('idle');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined);

  const currentFilters = useMemo(() => normalizeCurrentFilters(searchParams), [searchParams]);
  const diff: DiffEntry[] = useMemo(() => {
    if (!proposal) return [];
    return buildAiAssistDiff(currentFilters, proposal.proposedFilters);
  }, [currentFilters, proposal]);

  const hasChanges = diff.length > 0;

  const handleSuggest = useCallback(async () => {
    if (!prompt.trim()) return;
    setState('loading');
    setError(null);
    setRetryAfter(undefined);
    const res: ParseSearchResult = await parseSearchPrompt(prompt, {
      currentFilters,
      searchText: searchParams.get('q'),
    });

    if (res.kind === 'disabled') {
      setState('disabled');
      setProposal(null);
      return;
    }
    if (res.kind === 'rate_limited') {
      setState('rate_limited');
      setProposal(null);
      setRetryAfter(res.retryAfterSeconds);
      return;
    }
    if (res.kind === 'error') {
      setState('error');
      setError(res.message || 'Unable to process prompt');
      setProposal(null);
      return;
    }
    setState('success');
    setProposal(res.data);
  }, [prompt, currentFilters, searchParams]);

  const handleApply = useCallback(() => {
    if (!proposal) return;
    applyAiProposedFilters({
      proposedFilters: proposal.proposedFilters,
      router,
      pathname,
      searchParams,
    });
  }, [proposal, router, pathname, searchParams]);

  const handleClear = useCallback(() => {
    setProposal(null);
    setPrompt('');
    setState('idle');
    setError(null);
    setRetryAfter(undefined);
  }, []);

  if (!FEATURE_FLAG) return null;

  return (
    <div className="mb-4 rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-text-main">AI Assist</h3>
          <p className="text-xs text-text-main/70">Get suggested filters. Review before applying.</p>
        </div>
      </div>

      <textarea
        data-testid="ai-assist-textarea"
        className="mb-2 w-full rounded-md border border-border bg-white p-2 text-sm text-text-main focus:border-primary focus:outline-none"
        rows={3}
        placeholder="e.g., 3 bed homes under 400k in Grand Rapids"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          data-testid="ai-assist-suggest"
          onClick={handleSuggest}
          disabled={state === 'loading' || !prompt.trim()}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {state === 'loading' ? 'Suggesting…' : 'Suggest'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-surface-accent"
        >
          Clear
        </button>
        {state === 'rate_limited' && (
          <span className="text-[11px] text-amber-600">
            Too many requests{retryAfter ? ` (retry in ~${retryAfter}s)` : ''}
          </span>
        )}
        {state === 'disabled' && <span className="text-[11px] text-text-main/70">Assist unavailable</span>}
        {state === 'error' && error && (
          <span className="text-[11px] text-red-600">{error}</span>
        )}
      </div>

      {proposal && (
        <div className="space-y-2 text-sm text-text-main">
          <div className="flex items-center justify-between text-xs text-text-main/70">
            <span>Confidence: {(proposal.confidence * 100).toFixed(0)}%</span>
            {proposal.warnings?.length > 0 && (
              <span className="text-amber-600">Warnings: {proposal.warnings.length}</span>
            )}
          </div>

          {diff.length === 0 ? (
            <p className="text-xs text-text-main/70">No changes suggested versus current filters.</p>
          ) : (
            <ul className="space-y-1 text-xs" data-testid="ai-assist-diff">
              {diff.map((d) => (
                <li key={d.key} className="rounded border border-border px-2 py-1">
                  <div className="font-semibold">{d.label}</div>
                  <div className="text-text-main/70">Current: {d.currentValue || '—'}</div>
                  <div>Proposed: {d.proposedValue || '—'}</div>
                </li>
              ))}
            </ul>
          )}

          {proposal.ignoredInputReasons?.length > 0 && (
            <div className="text-[11px] text-text-main/70">
              Ignored: {proposal.ignoredInputReasons.join(', ')}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              data-testid="ai-assist-apply"
              onClick={handleApply}
              disabled={!hasChanges}
              className="rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/90 disabled:opacity-60"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={state === 'loading' || !prompt.trim()}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-surface-accent"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
