import { useEffect, useMemo, useState } from 'react';
import { fetchRequests } from '../lib/queries';
import type { DispenserRequest } from '../lib/types';
import { downloadCsv } from '../lib/utils';

function groupCount<T>(items: T[], keyFn: (t: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export function Reports() {
  const [requests, setRequests] = useState<DispenserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  useEffect(() => {
    fetchRequests().then((data) => {
      setRequests(data as DispenserRequest[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (dateFrom && r.created_at < dateFrom) return false;
      if (dateTo && r.created_at > dateTo + 'T23:59:59') return false;
      if (warehouseFilter && r.warehouses?.warehouse_name !== warehouseFilter) return false;
      return true;
    });
  }, [requests, dateFrom, dateTo, warehouseFilter]);

  if (loading) return <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-64 animate-pulse" />;

  const byStore = groupCount(filtered, (r) => r.customer_name_snapshot || 'Unknown');
  const byWarehouse = groupCount(filtered, (r) => r.warehouses?.warehouse_name || 'Unknown');
  const byItem = new Map<string, number>();
  filtered.forEach((r) => {
    for (const item of r.dispenser_request_items || []) {
      const key = item.dispenser_items ? `${item.dispenser_items.item_code} · ${item.dispenser_items.item_description}` : 'Unknown';
      byItem.set(key, (byItem.get(key) || 0) + Number(item.quantity_requested || 0));
    }
  });
  const byItemSorted = Array.from(byItem.entries()).sort((a, b) => b[1] - a[1]);

  const byStatus = groupCount(filtered, (r) => r.status);

  const byMonth = new Map<string, number>();
  filtered.forEach((r) => {
    const m = r.created_at.slice(0, 7);
    byMonth.set(m, (byMonth.get(m) || 0) + 1);
  });
  const byMonthSorted = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const warehouseNames = Array.from(new Set(requests.map((r) => r.warehouses?.warehouse_name).filter(Boolean))) as string[];

  function exportReport() {
    const rows: Record<string, any>[] = [];
    for (const r of filtered) {
      for (const li of r.dispenser_request_items || []) {
        rows.push({
          request_no: r.request_no,
          request_date: r.created_at.slice(0, 10),
          store_customer: r.customer_name_snapshot,
          warehouse: r.warehouses?.warehouse_name,
          item_code: li.dispenser_items?.item_code,
          item_description: li.dispenser_items?.item_description,
          qty_requested: li.quantity_requested,
          qty_prepared: li.quantity_prepared,
          qty_released: li.quantity_released,
          status: r.status,
        });
      }
    }
    downloadCsv(`dispenser-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Monitoring &amp; Reports</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Trends and breakdowns across stores, warehouses, and dispenser items.</p>
        </div>
        <button onClick={exportReport} className="border border-[var(--line)] text-sm font-medium rounded-md px-4 py-2.5 hover:bg-[#eef1f0]">
          Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--ink-soft)]">Date From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--ink-soft)]">Date To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--ink-soft)]">Warehouse</span>
          <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white">
            <option value="">All Warehouses</option>
            {warehouseNames.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ReportCard title="Requests by Store/Customer" rows={byStore} />
        <ReportCard title="Requests by Warehouse" rows={byWarehouse} />
        <ReportCard title="Quantity Requested by Dispenser Item" rows={byItemSorted} />
        <ReportCard title="Request Status Breakdown" rows={byStatus} labelize />
        <div className="col-span-2">
          <ReportCard title="Monthly Request Trend" rows={byMonthSorted} />
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, rows, labelize = false }: { title: string; rows: [string, number][]; labelize?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-[var(--ink-soft)]">No data for the selected filters.</p>}
      <div className="flex flex-col gap-2">
        {rows.slice(0, 8).map(([label, value]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-[var(--ink-soft)] w-36 truncate">
              {labelize ? label[0].toUpperCase() + label.slice(1) : label}
            </span>
            <div className="flex-1 bg-[#eef1f0] rounded h-2.5 overflow-hidden">
              <div className="h-full bg-[var(--brand)] rounded" style={{ width: `${(value / max) * 100}%` }} />
            </div>
            <span className="text-xs font-mono-tag text-[var(--ink)] w-8 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
