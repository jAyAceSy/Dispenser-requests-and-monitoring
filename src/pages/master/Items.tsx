import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { DispenserItem } from '../../lib/types';
import { BulkUploadModal } from '../../components/BulkUploadModal';

const empty = { item_code: '', item_description: '', category: '', uom: 'PC' };

export function Items() {
  const [items, setItems] = useState<DispenserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editing, setEditing] = useState<DispenserItem | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('dispenser_items').select('*').order('item_description');
    setItems(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(empty); setShowForm(true); }
  function openEdit(i: DispenserItem) {
    setEditing(i);
    setForm({ item_code: i.item_code, item_description: i.item_description, category: i.category || '', uom: i.uom });
    setShowForm(true);
  }

  async function save() {
    setError(null);
    if (!form.item_code.trim() || !form.item_description.trim()) return setError('Item Code and Item Description are required.');
    if (editing) {
      const { error: err } = await supabase.from('dispenser_items').update(form).eq('id', editing.id);
      if (err) return setError(err.message);
    } else {
      const { error: err } = await supabase.from('dispenser_items').insert(form);
      if (err) return setError(err.message);
    }
    setShowForm(false);
    load();
  }

  async function toggleActive(i: DispenserItem) {
    await supabase.from('dispenser_items').update({ active: !i.active }).eq('id', i.id);
    load();
  }

  async function handleBulkUpload(rows: Record<string, string>[]) {
    let success = 0;
    const failed: { row: number; reason: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const code = r['item_code']?.trim();
      const desc = r['item_description']?.trim();
      if (!code || !desc) {
        failed.push({ row: i + 2, reason: 'Missing item_code or item_description' });
        continue;
      }
      const { error: err } = await supabase.from('dispenser_items').upsert(
        { item_code: code, item_description: desc, category: r['category']?.trim() || null, uom: r['uom']?.trim() || 'PC' },
        { onConflict: 'item_code' }
      );
      if (err) failed.push({ row: i + 2, reason: err.message });
      else success++;
    }
    return { success, failed };
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Dispenser Items</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Only active items appear when creating new requests.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUpload(true)} className="border border-[var(--line)] text-sm font-medium rounded-md px-4 py-2.5 hover:bg-[#eef1f0]">
            Bulk Upload
          </button>
          <button onClick={openNew} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-md px-4 py-2.5">
            + Add Dispenser Item
          </button>
        </div>
      </div>

      {showUpload && (
        <BulkUploadModal
          title="Bulk Upload Dispenser Items"
          templateFilename="dispenser_items_template.csv"
          templateSampleRow={{ item_code: 'DSP-006', item_description: 'Sample Dispenser', category: 'Dispenser', uom: 'PC' }}
          requiredHeaders={['item_code', 'item_description']}
          onUpload={handleBulkUpload}
          onDone={load}
          onClose={() => setShowUpload(false)}
        />
      )}

      {showForm && (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold mb-3">{editing ? 'Edit' : 'Add'} Dispenser Item</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LField label="Item Code *"><input className="input" value={form.item_code} onChange={(e) => setForm({ ...form, item_code: e.target.value })} /></LField>
            <LField label="Item Description *"><input className="input" value={form.item_description} onChange={(e) => setForm({ ...form, item_description: e.target.value })} /></LField>
            <LField label="Category"><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></LField>
            <LField label="Unit of Measure"><input className="input" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} /></LField>
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
                {['Code', 'Description', 'Category', 'UOM', 'Status', ''].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-[var(--ink-soft)] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[#f9faf9]">
                  <td className="px-4 py-3 font-mono-tag">{i.item_code}</td>
                  <td className="px-4 py-3">{i.item_description}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{i.category || '—'}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{i.uom}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${i.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {i.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(i)} className="text-xs font-semibold text-[var(--brand)] hover:underline mr-3">Edit</button>
                    <button onClick={() => toggleActive(i)} className="text-xs font-semibold text-[var(--ink-soft)] hover:underline">
                      {i.active ? 'Deactivate' : 'Activate'}
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
