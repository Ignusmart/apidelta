import { Check, X, Minus } from 'lucide-react';

export type Verdict = 'win' | 'lose' | 'tie' | 'na';

export interface CompareRow {
  feature: string;
  apidelta: string | boolean;
  competitor: string | boolean;
  verdict: Verdict;
  note?: string;
}

export function CompareTable({
  rows,
  competitorName,
}: {
  rows: CompareRow[];
  competitorName: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/60 text-left">
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Feature
            </th>
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-violet-300">
              APIDelta
            </th>
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {rows.map((row) => (
            <tr key={row.feature} className="align-top hover:bg-gray-900/40">
              <td className="px-5 py-4">
                <p className="font-medium text-gray-200">{row.feature}</p>
                {row.note && <p className="mt-1 text-xs text-gray-500">{row.note}</p>}
              </td>
              <td className="px-5 py-4">
                <Cell value={row.apidelta} verdict={row.verdict} side="apidelta" />
              </td>
              <td className="px-5 py-4">
                <Cell value={row.competitor} verdict={row.verdict} side="competitor" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({
  value,
  verdict,
  side,
}: {
  value: string | boolean;
  verdict: Verdict;
  side: 'apidelta' | 'competitor';
}) {
  if (typeof value === 'boolean') {
    if (value) return <Check aria-hidden="true" className="h-4 w-4 text-emerald-400" />;
    return <X aria-hidden="true" className="h-4 w-4 text-gray-600" />;
  }
  if (value === '—' || value === 'N/A') {
    return <Minus aria-hidden="true" className="h-4 w-4 text-gray-600" />;
  }
  // Highlight cell text by verdict so the visual scan reads "who wins this row".
  const wins =
    (verdict === 'win' && side === 'apidelta') ||
    (verdict === 'lose' && side === 'competitor');
  const loses =
    (verdict === 'lose' && side === 'apidelta') ||
    (verdict === 'win' && side === 'competitor');
  return (
    <span
      className={`text-sm ${
        wins ? 'text-emerald-300' : loses ? 'text-gray-500' : 'text-gray-300'
      }`}
    >
      {value}
    </span>
  );
}
