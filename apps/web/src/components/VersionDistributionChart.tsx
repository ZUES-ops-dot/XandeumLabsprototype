'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { formatNumber } from '@/lib/format';

export type VersionBucket = {
  version: string;
  count: number;
};

export function VersionDistributionChart(props: { data: VersionBucket[] }) {
  const data = props.data.slice(0, 8);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#2d2d44" strokeDasharray="3 3" />
          <XAxis
            dataKey="version"
            stroke="#a1a1aa"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
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
            cursor={{ fill: 'rgba(0, 212, 170, 0.1)' }}
            formatter={(v) => [formatNumber(Number(v)), 'pNodes']}
          />
          <Bar dataKey="count" fill="#00d4aa" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
