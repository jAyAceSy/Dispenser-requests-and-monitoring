import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { StoreCustomer } from '../../lib/types';

const empty = { customer_code: '', customer_name: '', address: '', contact_person: '', contact_number: '' };

export function Stores() {
  const [stores, setStores] = useState<StoreCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StoreCustomer | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('stores_customers').select('*').order('customer_name');
    setStores(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  }
  function openEdit(s: StoreCustomer) {
    setEditing(s);
    setForm({ customer_code: s.customer_code, customer_name: s.customer_name, address: s.address || '', contact_person: s.contact_person || '', contact_number: s.contact_number || '' });
    setShowForm(true);
  }

  async function save() {
    setError(null);
    if (!form.customer_code.trim() || !form.customer_name.trim()) return setError('Customer Code and Store/Customer Name are required.');
    if (editing) {
      const { error: err } = await supabase.from('stores_customers').update(form).eq('id', editing.id);
      if (err) return setError(err.message);
    } else {
      const { error: err } = await supabase.from('stores_customers').insert(form);
      if (err) return setError(err.message);
    }
    setShowForm(false);
    load();
  }

  async function toggleActive(s: StoreCustomer) {
    await supabase.from('stores_customers').update({ active: !s.active }).eq('id', s.id);
    load();
  }

  const filtered = stores.filter((s) => {
    const q = search.toLowerCase();
    return s.customer_name.toLowerCase().includes(q) || s.customer_code.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Stores / Customers</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Master data used when creating dispenser requests.</p>
        </div>
        <button onClick={openNew} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-md px-4 py-2.5">
          + Add Store/Customer
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or code…"
        className="mb-4 max-w-sm border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white w-full"
      />

      {showForm && (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold mb-3">{editing ? 'Edit' : 'Add'} Store / Customer</h2>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Customer Code *"><input className="input" value={form.customer_code} onChange={(e) => setForm({ ...form, customer_code: e.target.value })} /></LField>
            <LField label="Store/Customer Name *"><input className="input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></LField>
            <LField label="Address"><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></LField>
            <LField label="Contact Person"><input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></LField>
            <LField label="Contact Number"><input className="input" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></LField>
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
                {['Code', 'Name', 'Address', 'Contact', 'Status', ''].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-[var(--ink-soft)] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[#f9faf9]">
                  <td className="px-4 py-3 font-mono-tag">{s.customer_code}</td>
                  <td className="px-4 py-3">{s.customer_name}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{s.address || '—'}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{s.contact_person}{s.contact_number ? ` · ${s.contact_number}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(s)} className="text-xs font-semibold text-[var(--brand)] hover:underline mr-3">Edit</button>
                    <button onClick={() => toggleActive(s)} className="text-xs font-semibold text-[var(--ink-soft)] hover:underline">
                      {s.active ? 'Deactivate' : 'Activate'}
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
