const LABELS: Record<string, string> = {
  status: 'Status',
  propertyType: 'Property type',
  minPrice: 'Min price',
  maxPrice: 'Max price',
  bedsMin: 'Beds (min)',
  bathsMin: 'Baths (min)',
  city: 'City',
  zip: 'ZIP',
  keywords: 'Keywords',
};

export type ProposedFilters = Record<string, any>;

export type DiffEntry = {
  key: string;
  label: string;
  currentValue: string;
  proposedValue: string;
};

const formatValue = (v: any) => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
};

export function buildAiAssistDiff(
  current: Record<string, any>,
  proposed: ProposedFilters,
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const keys = Object.keys(LABELS);

  keys.forEach((key) => {
    const proposedValue = proposed?.[key];
    if (proposedValue == null) return;
    const currentValue = current?.[key];
    const curFormatted = formatValue(currentValue);
    const propFormatted = formatValue(proposedValue);
    if (curFormatted === propFormatted) return;
    entries.push({
      key,
      label: LABELS[key] ?? key,
      currentValue: curFormatted,
      proposedValue: propFormatted,
    });
  });

  return entries;
}
