import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchRequestById } from '../lib/queries';
import type { DispenserRequest } from '../lib/types';
import { fmtDate, fmtDateTime } from '../lib/utils';

export function PrintRequest() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<DispenserRequest | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchRequestById(id).then((r) => setReq(r as DispenserRequest | null));
  }, [id]);

  if (!req) return <div className="p-8 text-sm text-gray-500">Loading…</div>;

  const items = req.dispenser_request_items || [];

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white text-gray-900 font-sans">
      <div className="flex justify-end mb-4 print:hidden">
        <button onClick={() => window.print()} className="bg-gray-900 text-white text-sm font-semibold rounded-md px-4 py-2">
          Print
        </button>
      </div>

      <div className="border-2 border-gray-900 p-6">
        <div className="text-center border-b-2 border-gray-900 pb-3 mb-4">
          <div className="text-lg font-bold uppercase tracking-wide">Dispenser Request Form</div>
          <div className="text-sm text-gray-600 mt-0.5">Approved for Warehouse Fulfillment</div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <Field label="Request No." value={req.request_no} />
          <Field label="Request Date" value={fmtDate(req.created_at)} />
          <Field label="Requested By" value={req.users?.name || '—'} />
          <Field label="Department" value={req.department || '—'} />
          <Field label="Required Date" value={fmtDate(req.required_date)} />
          <Field label="Warehouse" value={req.warehouses?.warehouse_name || '—'} />
        </div>

        <div className="border-t border-gray-300 pt-3 mb-4">
          <div className="text-xs font-semibold uppercase text-gray-500 mb-2">Store / Customer</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Customer Code" value={req.customer_code_snapshot || '—'} />
            <Field label="Store / Customer" value={req.customer_name_snapshot || '—'} />
            <Field label="Address" value={req.customer_address_snapshot || '—'} className="col-span-2" />
          </div>
        </div>

        <div className="border-t border-gray-300 pt-3 mb-4">
          <div className="text-xs font-semibold uppercase text-gray-500 mb-2">Dispenser Items</div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-1.5">Item Code</th>
                <th className="text-left py-1.5">Description</th>
                <th className="text-right py-1.5">Qty Requested</th>
                <th className="text-left py-1.5 pl-2">UOM</th>
              </tr>
            </thead>
            <tbody>
              {items.map((li) => (
                <tr key={li.id} className="border-b border-gray-200">
                  <td className="py-1.5 font-mono">{li.dispenser_items?.item_code}</td>
                  <td className="py-1.5">{li.dispenser_items?.item_description}</td>
                  <td className="py-1.5 text-right font-mono">{li.quantity_requested}</td>
                  <td className="py-1.5 pl-2">{li.dispenser_items?.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {req.remarks && (
          <div className="border-t border-gray-300 pt-3 mb-4 text-sm">
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Remarks</div>
            {req.remarks}
          </div>
        )}

        <div className="border-t-2 border-gray-900 pt-3 mb-6 text-sm">
          <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Approval</div>
          Approved {req.approved_at ? fmtDateTime(req.approved_at) : '—'}
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm mt-10">
          <SignatureLine label="Prepared By" />
          <SignatureLine label="Released By" />
          <SignatureLine label="Received By (Customer)" />
          <SignatureLine label="Approving Officer" />
        </div>
      </div>

      <style>{`
        @media print {
          button { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <div className="border-b border-gray-900 h-10" />
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
