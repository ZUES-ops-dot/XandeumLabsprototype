import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-xandeum-700/50 text-zinc-300',
  success: 'bg-xandeum-teal/15 text-xandeum-teal',
  warning: 'bg-xandeum-orange/15 text-xandeum-orange',
  danger: 'bg-red-500/15 text-red-300',
  info: 'bg-xandeum-purple/15 text-xandeum-violet'
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-zinc-400',
  success: 'bg-xandeum-teal',
  warning: 'bg-xandeum-orange',
  danger: 'bg-red-400',
  info: 'bg-xandeum-violet'
};

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />
      )}
      {children}
    </span>
  );
}
