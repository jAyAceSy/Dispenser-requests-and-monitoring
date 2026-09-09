import { useEffect, useState } from 'react';
import { fetchRequests } from '../lib/queries';
import type { DispenserRequest } from '../lib/types';
import { RequestsTable } from '../components/RequestsTable';
import { downloadCsv, daysOverdue } from '../lib/utils';

const COLUMNS = [
  { key: 'request_no', label: 'Request No.' },
  { key: 'request_date', label: 'Request Date' },
  { key: 'store', label: 'Store/Customer' },
  { key: 'requested_by', label: 'Requested By' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'item', label: 'Dispenser Item' },
  { key: 'qty', label: 'Qty' },
  { key: 'required_date', label: 'Required Date' },
  { key: 'status', label: 'Status' },
  { key: 'last_updated', label: 'Last Updated' },
];

export function AllRequests() {
  const [requests, setRequests] = useState<DispenserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRequests().then((data) => {
      setRequests(data as DispenserRequest[]);
      setLoading(false);
    });
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.request_no.toLowerCase().includes(s) ||
        r.customer_name_snapshot?.toLowerCase().includes(s) ||
        r.customer_code_snapshot?.toLowerCase().includes(s) ||
        r.users?.name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  function exportCsv() {
    const rows: Record<string, any>[] = [];
    for (const r of filtered) {
      const lineItems = r.dispenser_request_items || [];
      if (lineItems.length === 0) {
        rows.push({
          request_no: r.request_no,
          request_date: r.created_at.slice(0, 10),
          store_customer: r.customer_name_snapshot,
          customer_code: r.customer_code_snapshot,
          requested_by: r.users?.name,
          warehouse: r.warehouses?.warehouse_name,
          item_code: '',
          item_description: '',
          qty_requested: '',
          qty_prepared: '',
          qty_released: '',
          required_date: r.required_date,
          status: r.status,
          days_overdue: daysOverdue(r),
        });
        continue;
      }
      for (const li of lineItems) {
        rows.push({
          request_no: r.request_no,
          request_date: r.created_at.slice(0, 10),
          store_customer: r.customer_name_snapshot,
          customer_code: r.customer_code_snapshot,
          requested_by: r.users?.name,
          warehouse: r.warehouses?.warehouse_name,
          item_code: li.dispenser_items?.item_code,
          item_description: li.dispenser_items?.item_description,
          qty_requested: li.quantity_requested,
          qty_prepared: li.quantity_prepared,
          qty_released: li.quantity_released,
          required_date: r.required_date,
          status: r.status,
          days_overdue: daysOverdue(r),
        });
      }
    }
    downloadCsv(`dispenser-requests-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">All Dispenser Requests</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Complete visibility across every store, warehouse, and status.</p>
        </div>
        <button onClick={exportCsv} className="border border-[var(--line)] text-sm font-medium rounded-md px-4 py-2.5 hover:bg-[#eef1f0]">
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search request no., store, customer code, or requester…"
          className="flex-1 max-w-md border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          {['draft', 'submitted', 'approved', 'preparing', 'prepared', 'released', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-64 animate-pulse" /> : <RequestsTable requests={filtered} columns={COLUMNS} />}
    </div>
  );
}
