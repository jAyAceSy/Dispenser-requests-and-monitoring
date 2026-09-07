export function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'warn' | 'danger' | 'good';
}) {
  const toneClasses: Record<string, string> = {
    default: 'border-[var(--line)]',
    warn: 'border-amber-300',
    danger: 'border-red-300',
    good: 'border-emerald-300',
  };
  const valueTone: Record<string, string> = {
    default: 'text-[var(--ink)]',
    warn: 'text-amber-700',
    danger: 'text-red-700',
    good: 'text-emerald-700',
  };
  return (
    <div className={`bg-[var(--panel)] rounded-lg border ${toneClasses[tone]} px-4 py-3.5 flex flex-col gap-1 min-w-0`}>
      <span className="text-[11px] uppercase tracking-wide text-[var(--ink-soft)] font-medium truncate">{label}</span>
      <span className={`text-2xl font-semibold font-mono-tag ${valueTone[tone]}`}>{value}</span>
    </div>
  );
}
