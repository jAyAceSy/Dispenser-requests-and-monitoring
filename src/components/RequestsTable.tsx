import { useNavigate } from 'react-router-dom';
import type { DispenserRequest } from '../lib/types';
import { StatusBadge, OverdueBadge } from './StatusBadge';
import { daysOverdue, daysPending, fmtDate } from '../lib/utils';

interface Column {
  key: string;
  label: string;
}

export function RequestsTable({
  requests,
  columns,
}: {
  requests: DispenserRequest[];
  columns: Column[];
}) {
  const navigate = useNavigate();

  if (requests.length === 0) {
    return (
      <div className="bg-[var(--panel)] border border-dashed border-[var(--line)] rounded-xl py-14 text-center">
        <p className="text-sm font-medium text-[var(--ink)]">No requests to show</p>
        <p className="text-xs text-[var(--ink-soft)] mt-1">New requests will appear here as soon as they're created.</p>
      </div>
    );
  }

  const has = (k: string) => columns.some((c) => c.key === k);

  return (
    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[#f9faf9]">
              {columns.map((c) => (
                <th key={c.key} className="text-left font-medium text-[var(--ink-soft)] text-xs uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const item = r.dispenser_request_items?.[0];
              const overdue = daysOverdue(r);
              return (
                <tr key={r.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[#f9faf9]">
                  {has('request_no') && (
                    <td className="px-4 py-3 font-mono-tag font-medium text-[var(--ink)] whitespace-nowrap">{r.request_no}</td>
                  )}
                  {has('request_date') && <td className="px-4 py-3 text-[var(--ink-soft)] whitespace-nowrap">{fmtDate(r.created_at)}</td>}
                  {has('store') && <td className="px-4 py-3 text-[var(--ink)]">{r.customer_name_snapshot}</td>}
                  {has('requested_by') && <td className="px-4 py-3 text-[var(--ink)]">{r.users?.name || '—'}</td>}
                  {has('warehouse') && <td className="px-4 py-3 text-[var(--ink)] whitespace-nowrap">{r.warehouses?.warehouse_name}</td>}
                  {has('item') && (
                    <td className="px-4 py-3 text-[var(--ink)]">{item?.dispenser_items?.item_description || '—'}</td>
                  )}
                  {has('qty') && <td className="px-4 py-3 text-[var(--ink)] font-mono-tag">{item?.quantity_requested ?? '—'}</td>}
                  {has('required_date') && <td className="px-4 py-3 text-[var(--ink-soft)] whitespace-nowrap">{fmtDate(r.required_date)}</td>}
                  {has('status') && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                      {overdue > 0 && <OverdueBadge daysOverdue={overdue} />}
                    </td>
                  )}
                  {has('days_pending') && <td className="px-4 py-3 text-[var(--ink-soft)] font-mono-tag">{daysPending(r.created_at)}</td>}
                  {has('last_updated') && <td className="px-4 py-3 text-[var(--ink-soft)] whitespace-nowrap">{fmtDate(r.updated_at)}</td>}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/request/${r.id}`)}
                      className="text-xs font-semibold text-[var(--brand)] hover:underline"
                    >
                      View / Process
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
