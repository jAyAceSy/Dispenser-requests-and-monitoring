import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { fetchRequestById, fetchHistory } from '../lib/queries';
import type { DispenserRequest, RequestHistoryEntry } from '../lib/types';
import { StatusBadge, OverdueBadge } from '../components/StatusBadge';
import { fmtDate, fmtDateTime, daysOverdue } from '../lib/utils';

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [req, setReq] = useState<DispenserRequest | null>(null);
  const [history, setHistory] = useState<RequestHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // form state
  const [actualPrepared, setActualPrepared] = useState('');
  const [varianceReason, setVarianceReason] = useState('');
  const [prepRemarks, setPrepRemarks] = useState('');
  const [actualReleased, setActualReleased] = useState('');
  const [releaseVarianceReason, setReleaseVarianceReason] = useState('');
  const [receivedByCustomer, setReceivedByCustomer] = useState('');
  const [releaseRemarks, setReleaseRemarks] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [r, h] = await Promise.all([fetchRequestById(id), fetchHistory(id)]);
    setReq(r as DispenserRequest | null);
    setHistory(h as RequestHistoryEntry[]);
    if (r) {
      const item = (r as DispenserRequest).dispenser_request_items?.[0];
      setActualPrepared(item?.quantity_prepared?.toString() || '');
      setActualReleased(item?.quantity_released?.toString() || item?.quantity_prepared?.toString() || '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-64 animate-pulse" />;
  if (!req) return <div className="text-sm text-[var(--ink-soft)]">Request not found, or you don't have access to it.</div>;

  const item = req.dispenser_request_items?.[0];
  const isOwner = profile?.id === req.requested_by;
  const isAssignedOfficer = profile?.role === 'warehouse_officer' && profile.warehouse_id === req.warehouse_id;
  const isAdmin = profile?.role === 'admin';
  const overdue = daysOverdue(req);

  async function updateStatus(newStatus: DispenserRequest['status'], extra: Record<string, any> = {}) {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from('dispenser_requests').update({ status: newStatus, ...extra }).eq('id', req!.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    await load();
  }

  async function handleReceive() {
    await updateStatus('received');
  }

  async function handleStartPreparation() {
    await updateStatus('preparing');
  }

  async function handleMarkPrepared() {
    setError(null);
    const qty = Number(actualPrepared);
    if (!actualPrepared || isNaN(qty) || qty < 0) return setError('Enter a valid Actual Quantity Prepared.');
    const requestedQty = Number(item?.quantity_requested || 0);
    if (qty !== requestedQty && !varianceReason.trim()) {
      return setError(`Quantity Prepared (${qty}) differs from Quantity Requested (${requestedQty}). A variance reason is required.`);
    }
    setBusy(true);
    const { error: itemErr } = await supabase
      .from('dispenser_request_items')
      .update({
        quantity_prepared: qty,
        variance_reason: qty !== requestedQty ? varianceReason : null,
        preparation_remarks: prepRemarks || null,
        prepared_by: profile!.id,
        prepared_at: new Date().toISOString(),
      })
      .eq('id', item!.id);
    if (itemErr) { setBusy(false); setError(itemErr.message); return; }
    await updateStatus('prepared');
    setBusy(false);
  }

  async function handleRelease() {
    setError(null);
    const qty = Number(actualReleased);
    if (!actualReleased || isNaN(qty) || qty < 0) return setError('Enter a valid Actual Quantity Released.');
    const preparedQty = Number(item?.quantity_prepared || 0);
    if (qty !== preparedQty && !releaseVarianceReason.trim()) {
      return setError(`Quantity Released (${qty}) differs from Quantity Prepared (${preparedQty}). A reason is required.`);
    }
    if (!receivedByCustomer.trim()) return setError('Enter who received the dispenser (Received By).');
    setBusy(true);
    const { error: itemErr } = await supabase
      .from('dispenser_request_items')
      .update({
        quantity_released: qty,
        release_variance_reason: qty !== preparedQty ? releaseVarianceReason : null,
        release_remarks: releaseRemarks || null,
        received_by_customer: receivedByCustomer,
        released_by: profile!.id,
        released_at: new Date().toISOString(),
      })
      .eq('id', item!.id);
    if (itemErr) { setBusy(false); setError(itemErr.message); return; }
    await updateStatus('released');
    setBusy(false);
  }

  async function handleComplete() {
    await updateStatus('completed', { completed_by: profile!.id, completed_at: new Date().toISOString() });
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return setError('A cancellation reason is required.');
    await updateStatus('cancelled', { cancellation_reason: cancelReason, cancelled_by: profile!.id, cancelled_at: new Date().toISOString() });
    setShowCancelForm(false);
  }

  const canCancel = isAdmin && req.status !== 'completed' && req.status !== 'cancelled';

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate(-1)} className="text-xs text-[var(--ink-soft)] hover:underline mb-4">&larr; Back</button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)] font-mono-tag">{req.request_no}</h1>
            <StatusBadge status={req.status} />
            <OverdueBadge daysOverdue={overdue} />
          </div>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Created {fmtDateTime(req.created_at)} by {req.users?.name}</p>
        </div>
        {canCancel && !showCancelForm && (
          <button onClick={() => setShowCancelForm(true)} className="text-sm font-medium text-[var(--rust)] border border-red-200 bg-red-50 rounded-md px-3 py-2 hover:bg-red-100">
            Cancel Request
          </button>
        )}
      </div>

      {error && <div className="text-sm text-[var(--rust)] bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</div>}

      {showCancelForm && (
        <Panel title="Cancel Request" tone="danger">
          <Field label="Cancellation Reason *">
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input" rows={2} placeholder="Explain why this request is being cancelled" />
          </Field>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowCancelForm(false)} className="px-3 py-1.5 text-sm rounded-md border border-[var(--line)]">Nevermind</button>
            <button disabled={busy} onClick={handleCancel} className="px-3 py-1.5 text-sm rounded-md bg-[var(--rust)] text-white font-semibold">Confirm Cancellation</button>
          </div>
        </Panel>
      )}

      {req.status === 'cancelled' && req.cancellation_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-800">
          <strong>Cancelled:</strong> {req.cancellation_reason}
        </div>
      )}

      <Panel title="Request Details">
        <Grid>
          <Info label="Request No." value={req.request_no} mono />
          <Info label="Request Date" value={fmtDate(req.created_at)} />
          <Info label="Requested By" value={req.users?.name || '—'} />
          <Info label="Required Date" value={fmtDate(req.required_date)} />
          <Info label="Warehouse" value={req.warehouses?.warehouse_name || '—'} />
          <Info label="Department" value={req.department || '—'} />
        </Grid>
      </Panel>

      <Panel title="Store / Customer Information">
        <Grid>
          <Info label="Customer Code" value={req.customer_code_snapshot || '—'} mono />
          <Info label="Store / Customer" value={req.customer_name_snapshot || '—'} />
          <Info label="Address" value={req.customer_address_snapshot || '—'} />
          <Info label="Contact Person" value={req.customer_contact_person_snapshot || '—'} />
          <Info label="Contact Number" value={req.customer_contact_number_snapshot || '—'} />
        </Grid>
      </Panel>

      <Panel title="Dispenser Details">
        <Grid>
          <Info label="Dispenser Item" value={item?.dispenser_items?.item_description || '—'} />
          <Info label="Item Code" value={item?.dispenser_items?.item_code || '—'} mono />
          <Info label="Unit of Measure" value={item?.dispenser_items?.uom || '—'} />
          <Info label="Quantity Requested" value={item?.quantity_requested?.toString() || '—'} mono />
        </Grid>
        {req.remarks && (
          <div className="mt-3">
            <Info label="Remarks" value={req.remarks} />
          </div>
        )}
      </Panel>

      {/* WAREHOUSE OFFICER ACTIONS */}
      {isAssignedOfficer && req.status === 'submitted' && (
        <Panel title="Receive Request" tone="action">
          <p className="text-sm text-[var(--ink-soft)] mb-3">Acknowledge that this request has arrived at your warehouse.</p>
          <ConfirmButton
            label="Receive Request"
            busy={busy}
            onConfirm={handleReceive}
            confirmText="Mark this request as RECEIVED?"
          />
        </Panel>
      )}

      {isAssignedOfficer && req.status === 'received' && (
        <Panel title="Preparation" tone="action">
          <p className="text-sm text-[var(--ink-soft)] mb-3">Start preparing the requested dispenser.</p>
          <ConfirmButton label="Start Preparation" busy={busy} onConfirm={handleStartPreparation} confirmText="Start preparation for this request?" />
        </Panel>
      )}

      {isAssignedOfficer && req.status === 'preparing' && (
        <Panel title="Preparation Details" tone="action">
          <Grid>
            <Info label="Prepared By" value={profile?.name || '—'} />
            <Info label="Preparation Date" value={fmtDate(new Date().toISOString())} />
            <Info label="Quantity Requested" value={item?.quantity_requested?.toString() || '—'} mono />
            <Field label="Actual Quantity Prepared *">
              <input type="number" min={0} value={actualPrepared} onChange={(e) => setActualPrepared(e.target.value)} className="input" />
            </Field>
          </Grid>
          {Number(actualPrepared) !== Number(item?.quantity_requested || 0) && actualPrepared !== '' && (
            <Field label="Variance Reason *" className="mt-3">
              <textarea value={varianceReason} onChange={(e) => setVarianceReason(e.target.value)} className="input" rows={2} placeholder="e.g. Only 18 units available in warehouse." />
            </Field>
          )}
          <Field label="Preparation Remarks" className="mt-3">
            <textarea value={prepRemarks} onChange={(e) => setPrepRemarks(e.target.value)} className="input" rows={2} />
          </Field>
          <div className="flex justify-end mt-3">
            <ConfirmButton label="Mark as Prepared" busy={busy} onConfirm={handleMarkPrepared} confirmText="Mark this request as PREPARED?" />
          </div>
        </Panel>
      )}

      {isAssignedOfficer && req.status === 'prepared' && (
        <Panel title="Release" tone="action">
          <Grid>
            <Info label="Prepared Quantity" value={item?.quantity_prepared?.toString() || '—'} mono />
            <Field label="Actual Quantity Released *">
              <input type="number" min={0} value={actualReleased} onChange={(e) => setActualReleased(e.target.value)} className="input" />
            </Field>
            <Field label="Received By *">
              <input value={receivedByCustomer} onChange={(e) => setReceivedByCustomer(e.target.value)} className="input" placeholder="Name of person receiving" />
            </Field>
          </Grid>
          {Number(actualReleased) !== Number(item?.quantity_prepared || 0) && actualReleased !== '' && (
            <Field label="Reason for Variance *" className="mt-3">
              <textarea value={releaseVarianceReason} onChange={(e) => setReleaseVarianceReason(e.target.value)} className="input" rows={2} />
            </Field>
          )}
          <Field label="Release Remarks" className="mt-3">
            <textarea value={releaseRemarks} onChange={(e) => setReleaseRemarks(e.target.value)} className="input" rows={2} />
          </Field>
          <div className="flex justify-end mt-3">
            <ConfirmButton label="Release" busy={busy} onConfirm={handleRelease} confirmText="Confirm release of this dispenser?" />
          </div>
        </Panel>
      )}

      {(isAssignedOfficer || isAdmin) && req.status === 'released' && (
        <Panel title="Complete Request" tone="action">
          <p className="text-sm text-[var(--ink-soft)] mb-3">Mark this transaction as fully completed. Completed requests can no longer be edited.</p>
          <ConfirmButton label="Complete Request" busy={busy} onConfirm={handleComplete} confirmText="Mark this request as COMPLETED? This cannot be undone by normal users." />
        </Panel>
      )}

      {req.status === 'completed' && (
        <Panel title="Completion">
          <Grid>
            <Info label="Completed Date" value={fmtDateTime(req.completed_at)} />
            <Info label="Quantity Released" value={item?.quantity_released?.toString() || '—'} mono />
            <Info label="Received By" value={item?.received_by_customer || '—'} />
          </Grid>
        </Panel>
      )}

      {(item?.quantity_prepared != null || item?.quantity_released != null) && req.status !== 'draft' && (
        <Panel title="Quantity Monitoring">
          <Grid>
            <Info label="Quantity Requested" value={item?.quantity_requested?.toString() || '—'} mono />
            <Info label="Quantity Prepared" value={item?.quantity_prepared?.toString() || '—'} mono />
            <Info label="Quantity Released" value={item?.quantity_released?.toString() || '—'} mono />
          </Grid>
          {item?.variance_reason && <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">Preparation variance: {item.variance_reason}</div>}
          {item?.release_variance_reason && <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">Release variance: {item.release_variance_reason}</div>}
        </Panel>
      )}

      {isOwner && req.status === 'draft' && (
        <Panel title="Submit Draft" tone="action">
          <p className="text-sm text-[var(--ink-soft)] mb-3">This request is saved as a draft and hasn't been routed to the warehouse yet.</p>
          <ConfirmButton label="Submit Request" busy={busy} onConfirm={() => updateStatus('submitted')} confirmText="Submit this request to the warehouse now?" />
        </Panel>
      )}

      <Panel title="Request History / Audit Trail">
        <div className="flex flex-col">
          {history.map((h, i) => (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand)] mt-1.5" />
                {i < history.length - 1 && <div className="w-px flex-1 bg-[var(--line)]" />}
              </div>
              <div className="pb-4">
                <div className="text-xs text-[var(--ink-soft)]">{fmtDateTime(h.created_at)}</div>
                <div className="text-sm font-semibold text-[var(--ink)]">{h.action}</div>
                {h.remarks && <div className="text-sm text-[var(--ink-soft)]">{h.remarks}</div>}
                {h.users?.name && <div className="text-xs text-[var(--ink-soft)] mt-0.5">by {h.users.name}</div>}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <style>{`.input { border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; font-size: 14px; width: 100%; background: white; }`}</style>
    </div>
  );
}

function Panel({ title, children, tone = 'default' }: { title: string; children: React.ReactNode; tone?: 'default' | 'action' | 'danger' }) {
  const toneClass = tone === 'action' ? 'border-[var(--brand)]/30 bg-emerald-50/30' : tone === 'danger' ? 'border-red-200 bg-red-50/40' : 'border-[var(--line)]';
  return (
    <div className={`bg-[var(--panel)] border rounded-xl p-5 mb-4 ${toneClass}`}>
      <h2 className="text-sm font-semibold text-[var(--ink)] mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--ink-soft)]">{label}</span>
      <span className={`text-sm text-[var(--ink)] ${mono ? 'font-mono-tag' : ''}`}>{value}</span>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-[var(--ink-soft)]">{label}</span>
      {children}
    </label>
  );
}

function ConfirmButton({
  label,
  onConfirm,
  busy,
  confirmText,
}: {
  label: string;
  onConfirm: () => Promise<void>;
  busy: boolean;
  confirmText: string;
}) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="flex items-center gap-2 bg-white border border-[var(--line)] rounded-md p-2">
        <span className="text-sm text-[var(--ink)]">{confirmText}</span>
        <button onClick={() => setConfirming(false)} className="text-xs px-2 py-1 rounded border border-[var(--line)]">No</button>
        <button
          disabled={busy}
          onClick={async () => { await onConfirm(); setConfirming(false); }}
          className="text-xs px-2 py-1 rounded bg-[var(--brand)] text-white font-semibold"
        >
          Yes, confirm
        </button>
      </div>
    );
  }
  return (
    <button
      disabled={busy}
      onClick={() => setConfirming(true)}
      className="px-4 py-2 rounded-md text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
    >
      {label}
    </button>
  );
}
