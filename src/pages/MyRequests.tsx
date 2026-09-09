import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { fetchRequests } from '../lib/queries';
import type { DispenserRequest } from '../lib/types';
import { RequestsTable } from '../components/RequestsTable';

const COLUMNS = [
  { key: 'request_no', label: 'Request No.' },
  { key: 'request_date', label: 'Request Date' },
  { key: 'store', label: 'Store/Customer' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'item', label: 'Dispenser Item' },
  { key: 'qty', label: 'Quantity' },
  { key: 'required_date', label: 'Required Date' },
  { key: 'status', label: 'Status' },
  { key: 'last_updated', label: 'Last Updated' },
];

export function MyRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<DispenserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!profile) return;
    fetchRequests({ requestedBy: profile.id }).then((data) => {
      setRequests(data as DispenserRequest[]);
      setLoading(false);
    });
  }, [profile?.id]);

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.request_no.toLowerCase().includes(s) ||
        r.customer_name_snapshot?.toLowerCase().includes(s) ||
        r.customer_code_snapshot?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">My Requests</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Requests you have submitted, in progress, or completed.</p>
        </div>
        <Link to="/new-request" className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-md px-4 py-2.5">
          + New Dispenser Request
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search request no., store, or customer code…"
          className="flex-1 max-w-sm border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          {['draft', 'submitted', 'approved', 'preparing', 'prepared', 'released', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? <TableSkeleton /> : <RequestsTable requests={filtered} columns={COLUMNS} />}
    </div>
  );
}

function TableSkeleton() {
  return <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-64 animate-pulse" />;
}
