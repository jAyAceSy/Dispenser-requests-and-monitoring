import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Warehouse, AppUser } from '../../lib/types';

const empty = { warehouse_code: '', warehouse_name: '', location: '', assigned_officer_id: '' };

export function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [officers, setOfficers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [wh, off] = await Promise.all([
      supabase.from('warehouses').select('*').order('warehouse_name'),
      supabase.from('users').select('*').eq('role', 'warehouse_officer').order('name'),
    ]);
    setWarehouses(wh.data || []);
    setOfficers(off.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(empty); setShowForm(true); }
  function openEdit(w: Warehouse) {
    setEditing(w);
    setForm({ warehouse_code: w.warehouse_code, warehouse_name: w.warehouse_name, location: w.location || '', assigned_officer_id: w.assigned_officer_id || '' });
    setShowForm(true);
  }

  async function save() {
    setError(null);
    if (!form.warehouse_code.trim() || !form.warehouse_name.trim()) return setError('Warehouse Code and Name are required.');
    const payload = { ...form, assigned_officer_id: form.assigned_officer_id || null };
    if (editing) {
      const { error: err } = await supabase.from('warehouses').update(payload).eq('id', editing.id);
      if (err) return setError(err.message);
    } else {
      const { error: err } = await supabase.from('warehouses').insert(payload);
      if (err) return setError(err.message);
    }
    setShowForm(false);
    load();
  }

  async function toggleActive(w: Warehouse) {
    await supabase.from('warehouses').update({ active: !w.active }).eq('id', w.id);
    load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Warehouses</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Each warehouse routes to its assigned Warehouse Officer.</p>
        </div>
        <button onClick={openNew} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-md px-4 py-2.5">
          + Add Warehouse
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold mb-3">{editing ? 'Edit' : 'Add'} Warehouse</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LField label="Warehouse Code *"><input className="input" value={form.warehouse_code} onChange={(e) => setForm({ ...form, warehouse_code: e.target.value })} /></LField>
            <LField label="Warehouse Name *"><input className="input" value={form.warehouse_name} onChange={(e) => setForm({ ...form, warehouse_name: e.target.value })} /></LField>
            <LField label="Location"><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></LField>
            <LField label="Assigned Warehouse Officer">
              <select className="input" value={form.assigned_officer_id} onChange={(e) => setForm({ ...form, assigned_officer_id: e.target.value })}>
                <option value="">Unassigned</option>
                {officers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </LField>
          </div>
          {error && <div className="text-sm text-[var(--rust)] mt-3">{error}</div>}
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm rounded-md border border-[var(--line)]">Cancel</button>
            <button onClick={save} className="px-3 py-1.5 text-sm rounded-md bg-[var(--brand)] text-white font-semibold">Save</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-48 animate-pulse" />
      ) : (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[#f9faf9]">
                {['Code', 'Name', 'Location', 'Assigned Officer', 'Status', ''].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-[var(--ink-soft)] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[#f9faf9]">
                  <td className="px-4 py-3 font-mono-tag">{w.warehouse_code}</td>
                  <td className="px-4 py-3">{w.warehouse_name}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{w.location || '—'}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{officers.find((o) => o.id === w.assigned_officer_id)?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${w.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {w.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(w)} className="text-xs font-semibold text-[var(--brand)] hover:underline mr-3">Edit</button>
                    <button onClick={() => toggleActive(w)} className="text-xs font-semibold text-[var(--ink-soft)] hover:underline">
                      {w.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`.input { border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; font-size: 14px; width: 100%; background: white; }`}</style>
    </div>
  );
}

function LField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--ink-soft)]">{label}</span>
      {children}
    </label>
  );
}
