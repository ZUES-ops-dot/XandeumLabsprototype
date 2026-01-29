import { cn } from '@/lib/cn';

export function Card(props: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'card-xandeum rounded-2xl border border-white/5 transition-all duration-300',
        props.hover && 'hover:border-xandeum-cyan/40 hover:shadow-glow-teal',
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

export function CardHeader(props: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between border-b border-white/5 px-6 py-5">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">{props.title}</h3>
        {props.subtitle && (
          <p className="mt-1 text-xs text-zinc-400">{props.subtitle}</p>
        )}
      </div>
      {props.action && <div>{props.action}</div>}
    </div>
  );
}

export function CardBody(props: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 py-5', props.className)}>{props.children}</div>;
}

export function CardFooter(props: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('border-t border-white/5 px-6 py-5', props.className)}>
      {props.children}
    </div>
  );
}
