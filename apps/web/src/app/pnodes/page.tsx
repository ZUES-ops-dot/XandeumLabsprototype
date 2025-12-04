import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Server } from 'lucide-react';

import { Card, CardBody, CardHeader, CardFooter } from '@/components/Card';
import { DegradedState } from '@/components/DegradedState';
import { Badge } from '@/components/ui/Badge';
import { apiGetResult } from '@/lib/api';
import { formatDateTime, shortenMiddle } from '@/lib/format';

type PnodeRow = {
  pubkey: string;
  firstSeenAt: string;
  lastSeenAt: string;
  currentAddress: string | null;
  currentVersion: string | null;
};

type PnodesResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: PnodeRow[];
};

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParams, key: string): string | undefined {
  const v = searchParams[key];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function buildHref(base: string, searchParams: SearchParams, updates: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [k, v] of Object.entries(searchParams)) {
    const vv = Array.isArray(v) ? v[0] : v;
    if (typeof vv === 'string' && vv.length > 0) params.set(k, vv);
  }

  for (const [k, v] of Object.entries(updates)) {
    if (!v) params.delete(k);
    else params.set(k, v);
  }

  const qs = params.toString();
  return qs.length > 0 ? `${base}?${qs}` : base;
}

function isOnline(lastSeenAt: string, windowSeconds = 120) {
  const t = new Date(lastSeenAt).getTime();
  return t >= Date.now() - windowSeconds * 1000;
}

export default async function Page(props: { searchParams: SearchParams }) {
  const query = getParam(props.searchParams, 'query');
  const status = getParam(props.searchParams, 'status');
  const version = getParam(props.searchParams, 'version');
  const page = Number(getParam(props.searchParams, 'page') ?? '1');

  const qs = new URLSearchParams();
  if (query) qs.set('query', query);
  if (status) qs.set('status', status);
  if (version) qs.set('version', version);
  qs.set('page', String(Number.isFinite(page) && page > 0 ? page : 1));
  qs.set('pageSize', '25');

  const res = await apiGetResult<PnodesResponse>(`/pnodes?${qs.toString()}`);
  if (!res.ok) {
    return <DegradedState title="pNode Explorer" status={res.status} body={res.body} />;
  }

  const data = res.data;

  const hasPrev = data.page > 1;
  const hasNext = data.page * data.pageSize < data.total;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-xandeum-900/70 via-xandeum-card/70 to-black/60 p-6 sm:p-8">
        <div className="aurora-ring teal -left-10 top-0" />
        <div className="aurora-ring purple right-0 bottom-0" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">registry</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              <span className="text-gradient-teal">pNode</span> Explorer
            </h1>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Tap directly into the gossip stream to inspect validator endpoints, uptime, and software versions.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300 backdrop-blur-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
              <Server className="h-4 w-4" />
              Total Nodes
            </div>
            <p className="mt-1 text-3xl font-semibold text-gradient-teal">{data.total.toLocaleString()}</p>
            <p className="text-xs text-zinc-500">Snapshot of registered pNodes</p>
          </div>
        </div>
      </header>

      <Card>
        <CardBody className="p-5">
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                name="query"
                defaultValue={query ?? ''}
                placeholder="Search by pubkey or address..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-xandeum-cyan focus:outline-none focus:ring-2 focus:ring-xandeum-cyan/20"
              />
            </div>
            <select
              name="status"
              defaultValue={status ?? ''}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 transition focus:border-xandeum-cyan focus:outline-none focus:ring-2 focus:ring-xandeum-cyan/20"
            >
              <option value="">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <input
              name="version"
              defaultValue={version ?? ''}
              placeholder="Version"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-xandeum-cyan focus:outline-none focus:ring-2 focus:ring-xandeum-cyan/20 sm:w-32"
            />
            <button
              type="submit"
              className="rounded-full bg-xandeum-gradient px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-xandeum-950 shadow-lg shadow-glow-teal transition hover:scale-[0.99]"
            >
              Search
            </button>
            <input type="hidden" name="page" value="1" />
          </form>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-xandeum-700/30">
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Pubkey</th>
                <th className="hidden px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 md:table-cell">Address</th>
                <th className="hidden px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">Version</th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-xandeum-700/20">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-500">
                    No pNodes found matching your criteria
                  </td>
                </tr>
              ) : (
                data.items.map((row) => {
                  const online = isOnline(row.lastSeenAt);
                  return (
                    <tr
                      key={row.pubkey}
                      className="group transition-colors hover:bg-white/5"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <Badge variant={online ? 'success' : 'default'} dot>
                          {online ? 'online' : 'offline'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <Link
                          href={`/pnodes/${encodeURIComponent(row.pubkey)}`}
                          className="font-mono text-sm text-xandeum-teal transition-colors hover:text-xandeum-cyan"
                        >
                          {shortenMiddle(row.pubkey, 12, 8)}
                        </Link>
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-4 text-sm text-zinc-400 md:table-cell">
                        {row.currentAddress ?? <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-4 sm:table-cell">
                        {row.currentVersion ? (
                          <Badge variant="info">{row.currentVersion}</Badge>
                        ) : (
                          <span className="text-sm text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-400">
                        {formatDateTime(row.lastSeenAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <CardFooter className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Page <span className="font-medium text-zinc-300">{data.page}</span> of{' '}
            <span className="font-medium text-zinc-300">{Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
          </p>
          <div className="flex items-center gap-2">
            <Link
              aria-disabled={!hasPrev}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                hasPrev
                  ? 'border-white/15 bg-white/5 text-zinc-200 hover:border-xandeum-cyan/40 hover:text-white'
                  : 'pointer-events-none border-white/5 bg-transparent text-zinc-600'
              }`}
              href={buildHref('/pnodes', props.searchParams, { page: String(data.page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Link>
            <Link
              aria-disabled={!hasNext}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                hasNext
                  ? 'border-white/15 bg-white/5 text-zinc-200 hover:border-xandeum-cyan/40 hover:text-white'
                  : 'pointer-events-none border-white/5 bg-transparent text-zinc-600'
              }`}
              href={buildHref('/pnodes', props.searchParams, { page: String(data.page + 1) })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
