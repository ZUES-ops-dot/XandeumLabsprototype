import { Card, CardBody, CardHeader } from '@/components/Card';
import { DegradedState } from '@/components/DegradedState';
import { PresenceChart } from '@/components/PresenceChart';
import { StatCard } from '@/components/StatCard';
import { apiGetResult } from '@/lib/api';
import { formatDateTime, shortenMiddle } from '@/lib/format';

type Pnode = {
  pubkey: string;
  first_seen_at: string;
  last_seen_at: string;
  current_address: string | null;
  current_version: string | null;
  current_capabilities: unknown | null;
  current_metadata: unknown | null;
};

type Snapshot = {
  observed_at: string;
  address: string | null;
  version: string | null;
};

type DetailResponse = {
  pnode: Pnode;
  snapshots: Snapshot[];
};

export default async function Page(props: { params: { pubkey: string } }) {
  const res = await apiGetResult<DetailResponse>(
    `/pnodes/${encodeURIComponent(props.params.pubkey)}`
  );
  if (!res.ok) {
    return <DegradedState title="pNode" status={res.status} body={res.body} />;
  }

  const data = res.data;

  const presence = data.snapshots.map((s) => ({
    observedAt: s.observed_at,
    present: 1
  }));

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">pNode</h1>
        <div className="text-sm text-zinc-400">{shortenMiddle(data.pnode.pubkey, 18, 12)}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="First seen" value={formatDateTime(data.pnode.first_seen_at)} />
        <StatCard title="Last seen" value={formatDateTime(data.pnode.last_seen_at)} />
        <StatCard title="Address" value={data.pnode.current_address ?? '—'} />
        <StatCard title="Version" value={data.pnode.current_version ?? '—'} />
      </div>

      <Card>
        <CardHeader title="Gossip presence" subtitle="Each point indicates the pNode was visible in a snapshot" />
        <CardBody>
          <PresenceChart data={presence} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recent snapshots" subtitle="Last 200 observations" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs text-zinc-400">
                  <th className="border-b border-zinc-800 px-4 py-3">Observed at</th>
                  <th className="border-b border-zinc-800 px-4 py-3">Address</th>
                  <th className="border-b border-zinc-800 px-4 py-3">Version</th>
                </tr>
              </thead>
              <tbody>
                {data.snapshots.slice(-200).reverse().map((s, idx) => (
                  <tr key={`${s.observed_at}-${idx}`} className="text-sm text-zinc-200">
                    <td className="border-b border-zinc-900 px-4 py-3 text-zinc-300">
                      {formatDateTime(s.observed_at)}
                    </td>
                    <td className="border-b border-zinc-900 px-4 py-3 text-zinc-300">
                      {s.address ?? '—'}
                    </td>
                    <td className="border-b border-zinc-900 px-4 py-3 text-zinc-300">
                      {s.version ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Capabilities" />
          <CardBody>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
              {JSON.stringify(data.pnode.current_capabilities ?? {}, null, 2)}
            </pre>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Metadata" />
          <CardBody>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
              {JSON.stringify(data.pnode.current_metadata ?? {}, null, 2)}
            </pre>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
