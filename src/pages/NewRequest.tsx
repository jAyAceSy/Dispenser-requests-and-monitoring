import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import type { Warehouse, StoreCustomer, DispenserItem } from '../lib/types';
import { SearchableSelect } from '../components/SearchableSelect';

interface LineItem {
  key: string;
  itemId: string;
  quantity: string;
}

function newLine(): LineItem {
  return { key: Math.random().toString(36).slice(2), itemId: '', quantity: '' };
}

export function NewRequest() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stores, setStores] = useState<StoreCustomer[]>([]);
  const [items, setItems] = useState<DispenserItem[]>([]);

  const [warehouseId, setWarehouseId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [requiredDate, setRequiredDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [wh, st, it] = await Promise.all([
        supabase.from('warehouses').select('*').eq('active', true).order('warehouse_name'),
        supabase.from('stores_customers').select('*').eq('active', true).order('customer_name'),
        supabase.from('dispenser_items').select('*').eq('active', true).order('item_code'),
      ]);
      setWarehouses(wh.data || []);
      setStores(st.data || []);
      setItems(it.data || []);
    })();
  }, []);

  const selectedStore = stores.find((s) => s.id === storeId);
  const itemOptions = items.map((i) => ({ value: i.id, label: i.item_code, sublabel: `${i.item_description} · ${i.uom}` }));

  function updateLine(key: string, patch: Partial<LineItem>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, newLine()]);
  }
  function removeLine(key: string) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((l) => l.key !== key)));
  }

  async function handleSubmit(asDraft: boolean) {
    setError(null);
    if (!profile) return;

    if (!storeId) return setError('Please select a Store/Customer.');
    if (!warehouseId) return setError('Please select a Warehouse Location.');
    if (!requiredDate) return setError('Please enter the Required Date.');

    const usedItemIds = new Set<string>();
    for (const line of lines) {
      if (!line.itemId) return setError('Please select a dispenser item for every line.');
      if (usedItemIds.has(line.itemId)) return setError('The same dispenser item was selected more than once. Please combine quantities into a single line.');
      usedItemIds.add(line.itemId);
      const qty = Number(line.quantity);
      if (!line.quantity || isNaN(qty) || qty <= 0) return setError('Quantity must be a number greater than zero for every line.');
    }

    setSubmitting(true);
    const { data: req, error: reqErr } = await supabase
      .from('dispenser_requests')
      .insert({
        requested_by: profile.id,
        department: profile.department,
        store_customer_id: storeId,
        warehouse_id: warehouseId,
        required_date: requiredDate,
        remarks: remarks || null,
        status: asDraft ? 'draft' : 'submitted',
      })
      .select()
      .single();

    if (reqErr || !req) {
      setSubmitting(false);
      return setError(reqErr?.message || 'Failed to create request.');
    }

    const { error: itemErr } = await supabase.from('dispenser_request_items').insert(
      lines.map((l) => ({
        request_id: req.id,
        item_id: l.itemId,
        quantity_requested: Number(l.quantity),
      }))
    );

    setSubmitting(false);
    if (itemErr) return setError(itemErr.message);

    navigate('/my-requests');
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">New Dispenser Request</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Request No. and Request Date will be generated automatically on submit. You can add more than one dispenser item to a single request.</p>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl p-6 flex flex-col gap-6">
        <Section title="Request Information">
          <Grid>
            <Field label="Requested By"><StaticValue>{profile?.name}</StaticValue></Field>
            <Field label="Department"><StaticValue>{profile?.department || '—'}</StaticValue></Field>
            <Field label="Required Date *">
              <input type="date" required value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} className="input" />
            </Field>
            <Field label="Warehouse Location *">
              <SearchableSelect
                value={warehouseId || null}
                onChange={setWarehouseId}
                placeholder="Select warehouse…"
                options={warehouses.map((w) => ({ value: w.id, label: `${w.warehouse_name}`, sublabel: w.location || undefined }))}
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Store / Customer Information">
          <Field label="Store / Customer *">
            <SearchableSelect
              value={storeId || null}
              onChange={setStoreId}
              placeholder="Search store or customer…"
              options={stores.map((s) => ({ value: s.id, label: s.customer_name, sublabel: s.customer_code }))}
            />
          </Field>
          {selectedStore && (
            <Grid className="mt-3">
              <Field label="Customer Code"><StaticValue>{selectedStore.customer_code}</StaticValue></Field>
              <Field label="Address"><StaticValue>{selectedStore.address || '—'}</StaticValue></Field>
            </Grid>
          )}
        </Section>

        <Section title="Dispenser Details">
          <div className="flex flex-col gap-3">
            {lines.map((line, idx) => (
              <div key={line.key} className="flex flex-col sm:flex-row sm:items-end gap-2">
                <Field label={idx === 0 ? 'Dispenser Item *' : ''} className="flex-1 min-w-0">
                  <SearchableSelect
                    value={line.itemId || null}
                    onChange={(v) => updateLine(line.key, { itemId: v })}
                    placeholder="Select dispenser item…"
                    options={itemOptions}
                  />
                </Field>
                <div className="flex gap-2 items-end">
                  <Field label={idx === 0 ? 'Quantity *' : ''} className="w-28 sm:w-32 shrink-0">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      required
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                      className="input"
                      placeholder="Qty"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length === 1}
                    className="h-[38px] px-2.5 rounded-md border border-[var(--line)] text-[var(--rust)] disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    aria-label="Remove item"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addLine}
              className="self-start text-sm font-semibold text-[var(--brand)] hover:underline mt-1"
            >
              + Add another dispenser item
            </button>
          </div>
          <Field label="Remarks" className="mt-4">
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="input" rows={3} placeholder="Optional notes for the warehouse" />
          </Field>
        </Section>

        {error && <div className="text-sm text-[var(--rust)] bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

        <div className="flex gap-3 justify-end pt-2 border-t border-[var(--line)]">
          <button
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 rounded-md text-sm font-medium border border-[var(--line)] text-[var(--ink)] hover:bg-[#eef1f0] disabled:opacity-60"
          >
            Save as Draft
          </button>
          <button
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="px-5 py-2 rounded-md text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
      <style>{`.input { border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; font-size: 14px; width: 100%; background: white; }`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--ink)] mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>{children}</div>;
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-xs font-medium text-[var(--ink-soft)]">{label}</span>}
      {children}
    </label>
  );
}

function StaticValue({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-[var(--ink)] bg-[#f2f4f3] border border-[var(--line)] rounded-md px-3 py-2">{children}</div>;
}
