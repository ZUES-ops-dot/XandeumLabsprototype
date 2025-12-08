import { Card, CardBody, CardHeader } from '@/components/Card';

function getErrorLabel(status: number) {
  if (status === 0) return 'API unreachable';
  if (status === 503) return 'Service unavailable';
  return `Error ${status}`;
}

export function DegradedState(props: {
  title: string;
  status: number;
  body: unknown | null;
}) {
  const label = getErrorLabel(props.status);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">{props.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {label}. The backend could not access the database.
        </p>
      </div>

      <Card>
        <CardHeader title="How to fix" subtitle="Local development prerequisites" />
        <CardBody className="space-y-3 text-sm text-zinc-300">
          <div className="space-y-1">
            <div className="font-medium text-zinc-100">1) Ensure Postgres/Timescale is running</div>
            <div className="text-zinc-400">
              If you use Docker-based DB, install Docker Desktop and ensure the <span className="text-zinc-200">docker</span>{' '}
              command works in your terminal.
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-zinc-100">2) Start DB and run migrations</div>
            <div className="text-zinc-400">
              Run <span className="text-zinc-200">npm run db:up</span> then <span className="text-zinc-200">npm run db:migrate</span>.
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-zinc-100">3) Verify</div>
            <div className="text-zinc-400">
              Open <span className="text-zinc-200">http://localhost:3001/health</span>.
            </div>
          </div>

          <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
            {JSON.stringify(props.body, null, 2)}
          </pre>
        </CardBody>
      </Card>
    </main>
  );
}
