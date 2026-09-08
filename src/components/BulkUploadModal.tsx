import { useRef, useState } from 'react';
import { parseCsv, downloadCsv } from '../lib/utils';

interface Props {
  title: string;
  templateFilename: string;
  templateSampleRow: Record<string, string>;
  requiredHeaders: string[];
  onUpload: (rows: Record<string, string>[]) => Promise<{ success: number; failed: { row: number; reason: string }[] }>;
  onDone: () => void;
  onClose: () => void;
}

export function BulkUploadModal({ title, templateFilename, templateSampleRow, requiredHeaders, onUpload, onDone, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: { row: number; reason: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function downloadTemplate() {
    downloadCsv(templateFilename, [templateSampleRow]);
  }

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) return setError('The file appears to be empty.');
    const headers = Object.keys(rows[0]);
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) return setError(`Missing required column(s): ${missing.join(', ')}. Download the template to see the expected format.`);

    setBusy(true);
    const res = await onUpload(rows);
    setBusy(false);
    setResult(res);
    if (res.failed.length === 0) onDone();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-[var(--line)] max-w-lg w-full p-6">
        <h2 className="text-sm font-semibold text-[var(--ink)] mb-1">{title}</h2>
        <p className="text-xs text-[var(--ink-soft)] mb-4">
          Upload a CSV file to add or update records in bulk. Matching rows (by code) update existing records; new codes are added.
        </p>

        <button onClick={downloadTemplate} className="text-xs font-semibold text-[var(--brand)] hover:underline mb-4">
          Download CSV template
        </button>

        <div className="border-2 border-dashed border-[var(--line)] rounded-lg p-6 text-center mb-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="text-sm font-semibold text-[var(--brand)] hover:underline disabled:opacity-60"
          >
            {busy ? 'Uploading…' : 'Choose CSV file to upload'}
          </button>
          <p className="text-xs text-[var(--ink-soft)] mt-1">Required columns: {requiredHeaders.join(', ')}</p>
        </div>

        {error && <div className="text-sm text-[var(--rust)] bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">{error}</div>}

        {result && (
          <div className="text-sm mb-3">
            <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 mb-2">
              {result.success} row(s) uploaded successfully.
            </div>
            {result.failed.length > 0 && (
              <div className="text-[var(--rust)] bg-red-50 border border-red-200 rounded-md px-3 py-2 max-h-40 overflow-y-auto">
                <div className="font-semibold mb-1">{result.failed.length} row(s) failed:</div>
                {result.failed.map((f, i) => (
                  <div key={i} className="text-xs">Row {f.row}: {f.reason}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-[var(--line)]">
            {result && result.failed.length === 0 ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
