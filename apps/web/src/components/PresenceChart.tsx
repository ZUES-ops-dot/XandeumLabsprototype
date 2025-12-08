'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export type PresencePoint = {
  observedAt: string;
  present: number;
};

function formatTick(value: string) {
  const d = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function PresenceChart(props: { data: PresencePoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={props.data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="observedAt"
            tickFormatter={formatTick}
            stroke="#a1a1aa"
            tick={{ fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            stroke="#a1a1aa"
            tick={{ fontSize: 12 }}
            domain={[0, 1]}
            ticks={[0, 1]}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: 12
            }}
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
            formatter={(v) => [Number(v) === 1 ? 'present' : 'absent', 'gossip']}
          />
          <Line type="stepAfter" dataKey="present" stroke="#2dd4bf" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
