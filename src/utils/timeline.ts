export function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Fiscal year: September of year N to August of year N+1
export function getFiscalYearKey(value: string): { key: string; label: string } {
  const [year, month] = value.split('-').map(Number);
  const startYear = month >= 9 ? year : year - 1;
  return { key: String(startYear), label: `Année ${startYear}-${startYear + 1} (sept. à août)` };
}

export const SOURCE_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  dev: { dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  fabrication: { dot: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50' },
  logistics: { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  communication: { dot: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
};

export function sourceColor(sourceType: string) {
  return SOURCE_COLORS[sourceType] ?? { dot: 'bg-gray-400', text: 'text-gray-700', bg: 'bg-gray-50' };
}
