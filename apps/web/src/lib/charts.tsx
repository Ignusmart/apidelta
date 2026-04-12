'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DailyStats {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface SeverityTotals {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-xs text-gray-400">{label}</p>
      {payload.filter(p => p.value > 0).map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize text-gray-300">{p.name}</span>
          <span className="ml-auto font-medium text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ChangesOverTimeChart({ data }: { data: DailyStats[] }) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-600">
        No change data yet
      </div>
    );
  }

  // Format dates for display
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="low" stackId="1" fill={SEVERITY_COLORS.low} fillOpacity={0.3} stroke={SEVERITY_COLORS.low} strokeWidth={1.5} />
        <Area type="monotone" dataKey="medium" stackId="1" fill={SEVERITY_COLORS.medium} fillOpacity={0.3} stroke={SEVERITY_COLORS.medium} strokeWidth={1.5} />
        <Area type="monotone" dataKey="high" stackId="1" fill={SEVERITY_COLORS.high} fillOpacity={0.3} stroke={SEVERITY_COLORS.high} strokeWidth={1.5} />
        <Area type="monotone" dataKey="critical" stackId="1" fill={SEVERITY_COLORS.critical} fillOpacity={0.4} stroke={SEVERITY_COLORS.critical} strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const SEVERITY_BARS = [
  { key: 'critical' as const, label: 'Critical', color: SEVERITY_COLORS.critical },
  { key: 'high' as const, label: 'High', color: SEVERITY_COLORS.high },
  { key: 'medium' as const, label: 'Medium', color: SEVERITY_COLORS.medium },
  { key: 'low' as const, label: 'Low', color: SEVERITY_COLORS.low },
];

export function SeverityDistributionChart({ totals }: { totals: SeverityTotals }) {
  const data = SEVERITY_BARS.map((s) => ({
    name: s.label,
    count: totals[s.key],
    fill: s.color,
  }));

  const allZero = data.every((d) => d.count === 0);
  if (allZero) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-600">
        No changes detected yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#9ca3af' }}
          itemStyle={{ color: '#f9fafb' }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
