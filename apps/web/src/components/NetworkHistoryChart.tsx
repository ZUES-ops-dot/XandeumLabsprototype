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

import { formatNumber } from '@/lib/format';

export type NetworkHistoryPoint = {
  bucketStart: string;
  activePnodes: number;
};

function formatTick(value: string) {
  const d = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function NetworkHistoryChart(props: { data: NetworkHistoryPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={props.data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#2d2d44" strokeDasharray="3 3" />
          <XAxis
            dataKey="bucketStart"
            tickFormatter={formatTick}
            stroke="#a1a1aa"
            tick={{ fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            stroke="#a1a1aa"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => formatNumber(Number(v))}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid #2d2d44',
              borderRadius: 12,
              color: '#e4e4e7'
            }}
            labelStyle={{ color: '#a1a1aa' }}
            cursor={{ stroke: 'rgba(0, 212, 170, 0.3)' }}
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
            formatter={(v) => [formatNumber(Number(v)), 'active pNodes']}
          />
          <Line
            type="monotone"
            dataKey="activePnodes"
            stroke="#00d4aa"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
