import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search…',
}: {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter(
    (o) => o.label.toLowerCase().includes(query.toLowerCase()) || o.sublabel?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left border border-[var(--line)] rounded-md px-3 py-2 text-sm bg-white flex items-center justify-between gap-2"
      >
        {selected ? (
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="text-[var(--ink)] font-semibold font-mono-tag shrink-0">{selected.label}</span>
            {selected.sublabel && <span className="text-[var(--ink-soft)] text-xs truncate">{selected.sublabel}</span>}
          </span>
        ) : (
          <span className="text-[var(--ink-soft)]">{placeholder}</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--ink-soft)] shrink-0">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-[var(--line)] rounded-md shadow-lg max-h-64 overflow-hidden flex flex-col">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search…"
            className="px-3 py-2 text-sm border-b border-[var(--line)] outline-none"
          />
          <div className="overflow-y-auto">
            {filtered.length === 0 && <div className="px-3 py-2.5 text-sm text-[var(--ink-soft)]">No matches.</div>}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#eef1f0] flex flex-col"
              >
                <span className="text-[var(--ink)] font-semibold">{o.label}</span>
                {o.sublabel && <span className="text-xs text-[var(--ink-soft)]">{o.sublabel}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
