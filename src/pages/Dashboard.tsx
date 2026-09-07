import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { fetchRequests } from '../lib/queries';
import type { DispenserRequest, RequestStatus } from '../lib/types';
import { StatCard } from '../components/StatCard';
import { RequestsTable } from '../components/RequestsTable';
import { daysOverdue } from '../lib/utils';

function countBy(requests: DispenserRequest[], status: RequestStatus) {
  return requests.filter((r) => r.status === status).length;
}

function countOverdue(requests: DispenserRequest[]) {
  return requests.filter((r) => daysOverdue(r) > 0).length;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<DispenserRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const filters =
      profile.role === 'insti_team'
        ? { requestedBy: profile.id }
        : profile.role === 'warehouse_officer'
        ? { warehouseId: profile.warehouse_id || undefined }
        : {};
    fetchRequests(filters).then((data) => {
      setRequests(data as DispenserRequest[]);
      setLoading(false);
    });
  }, [profile?.id, profile?.role, profile?.warehouse_id]);

  if (loading) return <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-64 animate-pulse" />;
  if (!profile) return null;

  if (profile.role === 'insti_team') return <InstiDashboard requests={requests} />;
  if (profile.role === 'warehouse_officer') return <WarehouseDashboard requests={requests} hasWarehouse={!!profile.warehouse_id} />;
  return <AdminDashboard requests={requests} />;
}

function InstiDashboard({ requests }: { requests: DispenserRequest[] }) {
  const cols = [
    { key: 'request_no', label: 'Request No.' },
    { key: 'request_date', label: 'Request Date' },
    { key: 'store', label: 'Store/Customer' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'item', label: 'Dispenser Item' },
    { key: 'qty', label: 'Quantity' },
    { key: 'required_date', label: 'Required Date' },
    { key: 'status', label: 'Status' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Insti Team Dashboard</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Your dispenser requests at a glance.</p>
        </div>
        <Link to="/new-request" className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-md px-4 py-2.5">
          + New Dispenser Request
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Requests" value={requests.length} />
        <StatCard label="Submitted" value={countBy(requests, 'submitted')} />
        <StatCard label="Preparing" value={countBy(requests, 'preparing')} tone="warn" />
        <StatCard label="Prepared" value={countBy(requests, 'prepared')} />
        <StatCard label="Released" value={countBy(requests, 'released')} />
        <StatCard label="Completed" value={countBy(requests, 'completed')} tone="good" />
        <StatCard label="Cancelled" value={countBy(requests, 'cancelled')} tone="danger" />
        <StatCard label="Overdue" value={countOverdue(requests)} tone="danger" />
      </div>
      <RequestsTable requests={requests.slice(0, 10)} columns={cols} />
    </div>
  );
}

function WarehouseDashboard({ requests, hasWarehouse }: { requests: DispenserRequest[]; hasWarehouse: boolean }) {
  const cols = [
    { key: 'request_no', label: 'Request No.' },
    { key: 'request_date', label: 'Request Date' },
    { key: 'store', label: 'Store/Customer' },
    { key: 'requested_by', label: 'Requested By' },
    { key: 'item', label: 'Dispenser Item' },
    { key: 'qty', label: 'Qty Requested' },
    { key: 'required_date', label: 'Required Date' },
    { key: 'status', label: 'Status' },
    { key: 'days_pending', label: 'Days Pending' },
  ];
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Warehouse Officer Dashboard</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Requests routed to your warehouse.</p>
      </div>
      {!hasWarehouse && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-6">
          Your account isn't assigned to a warehouse yet. Ask an Admin to assign you to a Warehouse Location.
        </div>
      )}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StatCard label="New Requests" value={countBy(requests, 'submitted')} tone="warn" />
        <StatCard label="Received" value={countBy(requests, 'received')} />
        <StatCard label="Preparing" value={countBy(requests, 'preparing')} tone="warn" />
        <StatCard label="Prepared" value={countBy(requests, 'prepared')} />
        <StatCard label="Released" value={countBy(requests, 'released')} />
        <StatCard label="Completed" value={countBy(requests, 'completed')} tone="good" />
        <StatCard label="Cancelled" value={countBy(requests, 'cancelled')} tone="danger" />
        <StatCard label="Overdue" value={countOverdue(requests)} tone="danger" />
        <StatCard
          label="Pending"
          value={requests.filter((r) => !['completed', 'cancelled'].includes(r.status)).length}
        />
      </div>
      <RequestsTable requests={requests.filter((r) => r.status !== 'draft').slice(0, 10)} columns={cols} />
    </div>
  );
}

function AdminDashboard({ requests }: { requests: DispenserRequest[] }) {
  const cols = [
    { key: 'request_no', label: 'Request No.' },
    { key: 'request_date', label: 'Request Date' },
    { key: 'store', label: 'Store/Customer' },
    { key: 'requested_by', label: 'Requested By' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'item', label: 'Dispenser Item' },
    { key: 'status', label: 'Status' },
  ];
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Admin Dashboard</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Full visibility across all requests, warehouses, and stores.</p>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Requests" value={requests.length} />
        <StatCard label="Pending" value={requests.filter((r) => !['completed', 'cancelled'].includes(r.status)).length} tone="warn" />
        <StatCard label="Completed" value={countBy(requests, 'completed')} tone="good" />
        <StatCard label="Overdue" value={countOverdue(requests)} tone="danger" />
      </div>
      <RequestsTable requests={requests.slice(0, 12)} columns={cols} />
    </div>
  );
}
