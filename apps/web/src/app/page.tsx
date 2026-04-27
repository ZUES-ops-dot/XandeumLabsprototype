import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { DataQualityPanel } from '@/components/DataQualityPanel';
import { DegradedState } from '@/components/DegradedState';
import { NetworkHistoryChart } from '@/components/NetworkHistoryChart';
import { StatCard } from '@/components/StatCard';
import { VersionDistributionChart } from '@/components/VersionDistributionChart';
import { apiGetResult } from '@/lib/api';
import { formatDateTime, formatNumber } from '@/lib/format';
import {
  Server,
  Wifi,
  Clock,
  Activity,
  Search,
  ExternalLink,
  Zap,
  Database,
  Globe,
  Radio,
  ShieldCheck,
  Layers
} from 'lucide-react';

type DataQuality = {
  avgQualityScore: number;
  totalIngestCycles: number;
  lastIngestAt: string | null;
  issuesLastHour: Record<string, number>;
};

type Overview = {
  computedAt: string;
  totalPnodes: number;
  onlinePnodes: number;
  lastGossipAt: string | null;
  dataQuality: DataQuality;
};

type HistoryPoint = {
  bucketStart: string;
  activePnodes: number;
};

type VersionBucket = {
  version: string;
  count: number;
};

export default async function Page() {
  const [overviewRes, historyRes, versionsRes] = await Promise.all([
    apiGetResult<Overview>('/network/overview'),
    apiGetResult<HistoryPoint[]>('/network/history?window=24h&bucket=5m'),
    apiGetResult<VersionBucket[]>('/network/versions')
  ]);

  if (!overviewRes.ok) {
    return <DegradedState title="Network Overview" status={overviewRes.status} body={overviewRes.body} />;
  }

  const overview = overviewRes.data;
  const history = historyRes.ok ? historyRes.data : [];
  const versions = versionsRes.ok ? versionsRes.data : [];

  const offline = Math.max(overview.totalPnodes - overview.onlinePnodes, 0);
  const onlinePercent = overview.totalPnodes > 0 
    ? Math.round((overview.onlinePnodes / overview.totalPnodes) * 100) 
    : 0;

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-xandeum-900/80 via-xandeum-card/80 to-black/60 p-8 sm:p-12 shadow-2xl shadow-black/40">
        <div className="aurora-ring teal -left-16 top-8" />
        <div className="aurora-ring purple right-0 -top-10" />
        <div className="aurora-ring orange bottom-0 right-12" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400">live telemetry</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              <span className="text-gradient-teal">Xandeum</span> pNode Analytics
            </h1>
            <p className="text-base text-zinc-300">
              Observe the decentralized storage mesh in real-time. We monitor gossip streams, normalize node
              capabilities, and surface actionable network health signals with the same neon energy as the OG
              Xandeum experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pnodes"
                className="inline-flex items-center gap-2 rounded-full bg-xandeum-gradient px-6 py-3 text-sm font-semibold uppercase tracking-wide text-xandeum-950 shadow-xl shadow-glow-teal transition hover:scale-[1.01]"
              >
                Inspect Nodes
                <Search className="h-4 w-4" />
              </Link>
              <a
                href="https://xandeum.network"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-xandeum-cyan hover:text-white"
              >
                Visit xandeum.network
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative grid gap-4 rounded-3xl border border-white/10 bg-black/30 p-6 text-sm text-zinc-300 backdrop-blur-xl sm:grid-cols-2 lg:w-96 lg:grid-cols-1">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Live Throughput</p>
              <p className="mt-1 text-3xl font-bold text-gradient-teal">{formatNumber(overview.onlinePnodes)} pNodes</p>
              <p className="text-xs text-zinc-500">Reporting within last 120s</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Latest Gossip</p>
              <p className="mt-1 text-base font-semibold text-white">
                {overview.lastGossipAt ? formatDateTime(overview.lastGossipAt) : 'No snapshots yet'}
              </p>
              <p className="mt-2 text-xs text-zinc-500">Synchronized to Timescale hypertables</p>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            title: 'Explore pNodes',
            description: 'Search the registry, drill into capabilities, export snapshots.',
            icon: <Search className="h-6 w-6 text-xandeum-950" />,
            href: '/pnodes',
            tint: 'bg-xandeum-gradient shadow-glow-teal',
            border: 'hover:border-xandeum-teal/50',
            text: 'group-hover:text-xandeum-cyan'
          },
          {
            title: 'Learn the Network',
            description: 'Dive into OG docs, economics, and architecture deep dives.',
            icon: <Globe className="h-6 w-6 text-xandeum-950" />,
            href: 'https://xandeum.network',
            tint: 'bg-xandeum-orange shadow-glow-orange',
            border: 'hover:border-xandeum-orange/50',
            text: 'group-hover:text-xandeum-orange'
          },
          {
            title: 'Build on Xandeum',
            description: 'Access SDKs, REST endpoints, and service orchestration guides.',
            icon: <Zap className="h-6 w-6 text-white" />,
            href: 'https://github.com/xandeum',
            tint: 'bg-xandeum-purple shadow-glow-purple',
            border: 'hover:border-xandeum-purple/50',
            text: 'group-hover:text-xandeum-violet'
          }
        ].map((action) => {
          const isExternal = action.href.startsWith('http');
          const Wrapper = isExternal ? 'a' : Link;
          return (
            <Wrapper
              key={action.title}
              href={action.href}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group"
            >
              <div className={`surface-panel flex h-full flex-col gap-3 border-white/10 p-5 transition ${action.border}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.tint}`}>
                  {action.icon}
                </div>
                <div className="space-y-1">
                  <p className={`text-base font-semibold text-white transition ${action.text}`}>{action.title}</p>
                  <p className="text-sm text-zinc-400">{action.description}</p>
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total pNodes"
          value={formatNumber(overview.totalPnodes)}
          subvalue={`Updated ${formatDateTime(overview.computedAt)}`}
          icon={<Server className="h-5 w-5" />}
          variant="teal"
        />
        <StatCard
          title="Online Now"
          value={formatNumber(overview.onlinePnodes)}
          subvalue={`${onlinePercent}% of network`}
          trend={onlinePercent >= 80 ? 'up' : onlinePercent >= 50 ? 'neutral' : 'down'}
          trendValue={`${onlinePercent}%`}
          icon={<Wifi className="h-5 w-5" />}
          variant="teal"
        />
        <StatCard
          title="Offline"
          value={formatNumber(offline)}
          subvalue="Outside presence window"
          icon={<Activity className="h-5 w-5" />}
          variant="orange"
        />
        <StatCard
          title="Last Gossip"
          value={overview.lastGossipAt ? formatDateTime(overview.lastGossipAt) : '--'}
          subvalue="Most recent snapshot"
          icon={<Clock className="h-5 w-5" />}
          variant="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Network Activity"
            subtitle="Distinct pNodes seen in gossip over time"
          />
          <CardBody>
            {history.length > 0 ? (
              <NetworkHistoryChart data={history} />
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-zinc-500">
                No history data available
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Version Distribution"
            subtitle="Current software version per pNode"
          />
          <CardBody>
            {versions.length > 0 ? (
              <VersionDistributionChart data={versions} />
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-zinc-500">
                No version data available
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Data Quality Panel */}
      <Card>
        <CardHeader
          title="Ingestion Health"
          subtitle="Data quality metrics from the gossip pipeline"
        />
        <CardBody>
          <DataQualityPanel quality={overview.dataQuality} />
        </CardBody>
      </Card>

      {/* Network Features */}
      <Card>
        <CardHeader
          title="Xandeum Network Features"
          subtitle="Scalable decentralized storage for Solana programs"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-xandeum-teal/10 mb-4">
                <Database className="h-7 w-7 text-xandeum-teal" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">Scalable to Exabytes+</h3>
              <p className="text-sm text-zinc-400">
                Xandeum scales storage capacity beyond traditional blockchain limitations.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-xandeum-orange/10 mb-4">
                <Zap className="h-7 w-7 text-xandeum-orange" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">Random Access</h3>
              <p className="text-sm text-zinc-400">
                Direct data access without sequential reads for optimal performance.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-xandeum-purple/10 mb-4">
                <Globe className="h-7 w-7 text-xandeum-violet" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">Decentralized</h3>
              <p className="text-sm text-zinc-400">
                Fully decentralized storage network powered by pNode operators.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
