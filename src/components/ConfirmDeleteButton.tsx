import { useState } from 'react';

export function ConfirmDeleteButton({
  label = 'Delete',
  confirmText,
  onConfirm,
}: {
  label?: string;
  confirmText: string;
  onConfirm: () => Promise<{ error: string | null } | void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="inline-flex flex-col items-end gap-1">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-md p-1.5">
          <span className="text-xs text-red-800 max-w-[220px]">{confirmText}</span>
          <button onClick={() => { setConfirming(false); setError(null); }} className="text-xs px-2 py-1 rounded border border-[var(--line)] bg-white shrink-0">
            No
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await onConfirm();
              setBusy(false);
              if (result && result.error) {
                setError(result.error);
              } else {
                setConfirming(false);
              }
            }}
            className="text-xs px-2 py-1 rounded bg-[var(--rust)] text-white font-semibold shrink-0 disabled:opacity-60"
          >
            {busy ? '…' : 'Yes, delete'}
          </button>
        </div>
        {error && <div className="text-xs text-[var(--rust)] max-w-[240px] text-right">{error}</div>}
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs font-semibold text-[var(--rust)] hover:underline">
      {label}
    </button>
  );
}
