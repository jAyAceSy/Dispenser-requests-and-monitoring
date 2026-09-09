import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { fetchRequests } from '../lib/queries';
import type { DispenserRequest } from '../lib/types';
import { RequestsTable } from '../components/RequestsTable';

const COLUMNS = [
  { key: 'request_no', label: 'Request No.' },
  { key: 'request_date', label: 'Request Date' },
  { key: 'store', label: 'Store/Customer' },
  { key: 'requested_by', label: 'Requested By' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'item', label: 'Dispenser Item' },
  { key: 'qty', label: 'Qty Requested' },
  { key: 'required_date', label: 'Required Date' },
  { key: 'status', label: 'Status' },
  { key: 'days_pending', label: 'Days Pending' },
];

export function IncomingRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<DispenserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!profile?.warehouse_id) { setLoading(false); return; }
    fetchRequests({ warehouseId: profile.warehouse_id }).then((data) => {
      setRequests((data as DispenserRequest[]).filter((r) => !['draft', 'submitted'].includes(r.status)));
      setLoading(false);
    });
  }, [profile?.warehouse_id]);

  if (!loading && !profile?.warehouse_id) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
        Your account is not yet assigned to a warehouse. Contact an Admin to assign you to a Warehouse Location.
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.request_no.toLowerCase().includes(s) || r.customer_name_snapshot?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Incoming Requests</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Requests routed to your assigned warehouse.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search request no. or store…"
          className="flex-1 max-w-sm border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          {['approved', 'preparing', 'prepared', 'released', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-64 animate-pulse" /> : <RequestsTable requests={filtered} columns={COLUMNS} />}
    </div>
  );
}
