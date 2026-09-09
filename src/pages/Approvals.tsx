import { useEffect, useState } from 'react';
import { fetchRequests } from '../lib/queries';
import type { DispenserRequest } from '../lib/types';
import { RequestsTable } from '../components/RequestsTable';
import { StatCard } from '../components/StatCard';

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
];

export function Approvals() {
  const [requests, setRequests] = useState<DispenserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchRequests().then((data) => {
      setRequests(data as DispenserRequest[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-64 animate-pulse" />;

  const pending = requests.filter((r) => r.status === 'submitted');
  const shown = showAll ? requests : pending;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Approvals</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Requests waiting for your review before they're routed to a warehouse.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Awaiting Approval" value={pending.length} tone="warn" />
        <StatCard label="Approved" value={requests.filter((r) => r.status !== 'draft' && r.status !== 'submitted' && r.status !== 'cancelled').length} tone="good" />
        <StatCard label="Total Requests" value={requests.length} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">{showAll ? 'All Requests' : 'Awaiting Your Approval'}</h2>
        <button onClick={() => setShowAll((s) => !s)} className="text-xs font-semibold text-[var(--brand)] hover:underline">
          {showAll ? 'Show only pending approval' : 'Show all requests'}
        </button>
      </div>

      <RequestsTable requests={shown} columns={COLUMNS} />
    </div>
  );
}
