import type { RequestStatus } from '../lib/types';
import { STATUS_LABEL } from '../lib/types';

const STYLES: Record<RequestStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-300',
  submitted: 'bg-sky-50 text-sky-700 border-sky-200',
  approved: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  preparing: 'bg-amber-50 text-amber-800 border-amber-200',
  prepared: 'bg-teal-50 text-teal-800 border-teal-200',
  released: 'bg-violet-50 text-violet-800 border-violet-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold tracking-tight ${STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function OverdueBadge({ daysOverdue }: { daysOverdue: number }) {
  if (daysOverdue <= 0) return null;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-red-300 bg-red-50 text-red-700 text-xs font-semibold ml-1.5">
      {daysOverdue}d Overdue
    </span>
  );
}
