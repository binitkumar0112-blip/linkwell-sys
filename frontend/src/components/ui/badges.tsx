import { cn } from '../../utils/cn';

const SEVERITY_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  low:       { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Low' },
  moderate:  { pill: 'bg-amber-50 text-amber-700 border border-amber-200',       dot: 'bg-amber-500',   label: 'Moderate' },
  medium:    { pill: 'bg-amber-50 text-amber-700 border border-amber-200',       dot: 'bg-amber-500',   label: 'Medium' },
  high:      { pill: 'bg-orange-50 text-orange-700 border border-orange-200',    dot: 'bg-orange-500',  label: 'High' },
  critical:  { pill: 'bg-red-50 text-red-700 border border-red-200',             dot: 'bg-red-500',     label: 'Critical' },
  resolved:  { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Resolved' },
  'in-progress': { pill: 'bg-amber-50 text-amber-700 border border-amber-200',   dot: 'bg-amber-500',   label: 'In Progress' },
};

const STATUS_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  reported:    { pill: 'bg-blue-50 text-blue-700 border border-blue-200',         dot: 'bg-blue-500',    label: 'Reported' },
  open:        { pill: 'bg-slate-50 text-slate-600 border border-slate-200',      dot: 'bg-slate-400',   label: 'Open' },
  assigned:    { pill: 'bg-purple-50 text-purple-700 border border-purple-200',   dot: 'bg-purple-500',  label: 'Assigned' },
  in_progress: { pill: 'bg-amber-50 text-amber-700 border border-amber-200',      dot: 'bg-amber-500',   label: 'In Progress' },
  'in-progress': { pill: 'bg-amber-50 text-amber-700 border border-amber-200',    dot: 'bg-amber-500',   label: 'In Progress' },
  resolved:    { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',dot: 'bg-emerald-500', label: 'Resolved' },
  completed:   { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',dot: 'bg-emerald-500', label: 'Completed' },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity?.toLowerCase()] || SEVERITY_STYLES.medium;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {s.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status?.toLowerCase()] || STATUS_STYLES.open;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {s.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const icons: Record<string, string> = {
    infrastructure: '🏗️', health: '🏥', rescue: '🚨', food: '🍽️',
    water: '💧', sanitation: '🚿', education: '📚', environment: '🌿',
    other: '📌',
  };
  const icon = icons[category?.toLowerCase()] || icons.other;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 capitalize">
      <span>{icon}</span> {category}
    </span>
  );
}

export function TrustLevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    'Community Leader': 'bg-purple-50 text-purple-700 border-purple-200',
    'Trusted':          'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Verified':         'bg-blue-50 text-blue-700 border-blue-200',
    'New':              'bg-slate-50 text-slate-600 border-slate-200',
  };
  const style = styles[level] || styles.New;
  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border', style)}>
      {level || 'New'}
    </span>
  );
}
