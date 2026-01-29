import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Trend = 'up' | 'down' | 'neutral';
type Variant = 'teal' | 'orange' | 'purple' | 'default';

const variantStyles: Record<Variant, { border: string; glow: string; icon: string; shadow: string }> = {
  teal: {
    border: 'hover:border-xandeum-teal/30',
    glow: 'bg-xandeum-teal/5 group-hover:bg-xandeum-teal/10',
    icon: 'text-xandeum-700 group-hover:text-xandeum-teal',
    shadow: 'hover:shadow-xandeum-teal/5'
  },
  orange: {
    border: 'hover:border-xandeum-orange/30',
    glow: 'bg-xandeum-orange/5 group-hover:bg-xandeum-orange/10',
    icon: 'text-xandeum-700 group-hover:text-xandeum-orange',
    shadow: 'hover:shadow-xandeum-orange/5'
  },
  purple: {
    border: 'hover:border-xandeum-purple/30',
    glow: 'bg-xandeum-purple/5 group-hover:bg-xandeum-purple/10',
    icon: 'text-xandeum-700 group-hover:text-xandeum-violet',
    shadow: 'hover:shadow-xandeum-purple/5'
  },
  default: {
    border: 'hover:border-xandeum-teal/30',
    glow: 'bg-xandeum-teal/5 group-hover:bg-xandeum-teal/10',
    icon: 'text-xandeum-700 group-hover:text-xandeum-teal',
    shadow: 'hover:shadow-xandeum-teal/5'
  }
};

export function StatCard(props: {
  title: string;
  value: string;
  subvalue?: string;
  trend?: Trend;
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: Variant;
}) {
  const variant = props.variant ?? 'default';
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-xandeum-700/30 bg-gradient-to-br from-xandeum-card to-xandeum-850 px-5 py-4 transition-all duration-300',
        styles.border,
        styles.shadow,
        'hover:shadow-lg',
        props.className
      )}
    >
      <div className={cn('absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl transition-all duration-500', styles.glow)} />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            {props.title}
          </span>
          {props.icon && (
            <span className={cn('transition-colors', styles.icon)}>
              {props.icon}
            </span>
          )}
        </div>
        
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-zinc-50">
            {props.value}
          </span>
          {props.trend && props.trendValue && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                props.trend === 'up' && 'text-xandeum-teal',
                props.trend === 'down' && 'text-xandeum-orange',
                props.trend === 'neutral' && 'text-zinc-500'
              )}
            >
              {props.trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {props.trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {props.trend === 'neutral' && <Minus className="h-3 w-3" />}
              {props.trendValue}
            </span>
          )}
        </div>
        
        {props.subvalue && (
          <p className="mt-1.5 text-xs text-zinc-400">{props.subvalue}</p>
        )}
      </div>
    </div>
  );
}
