// @ts-nocheck
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover = true, padding = 'md' }: CardProps) {
  const paddings = { sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-2xl shadow-sm',
        hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  valueColor?: string;
  sub?: string;
}

export function StatCard({ label, value, icon, iconBg = 'bg-indigo-50', valueColor = 'text-slate-900', sub }: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
          <p className={cn('text-3xl font-bold leading-none', valueColor)}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
