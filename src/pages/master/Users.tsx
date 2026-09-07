import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AppUser, Warehouse } from '../../lib/types';

const ROLE_LABEL: Record<string, string> = {
  insti_team: 'Insti Team',
  warehouse_officer: 'Warehouse Officer',
  admin: 'Admin / Inventory Analyst',
};

export function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [u, w] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('warehouses').select('*').order('warehouse_name'),
    ]);
    setUsers(u.data || []);
    setWarehouses(w.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateUser(id: string, patch: Partial<AppUser>) {
    await supabase.from('users').update(patch).eq('id', id);
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Users</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          People create their own accounts via the Sign Up screen. Manage their role, warehouse assignment, and access here.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-48 animate-pulse" />
      ) : (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[#f9faf9]">
                {['Name', 'Email', 'Role', 'Department', 'Warehouse', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-[var(--ink-soft)] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[#f9faf9]">
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{u.name}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value as AppUser['role'] })}
                      className="border border-[var(--line)] rounded-md px-2 py-1 text-xs bg-white"
                    >
                      {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{u.department || '—'}</td>
                  <td className="px-4 py-3">
                    {u.role === 'warehouse_officer' ? (
                      <select
                        value={u.warehouse_id || ''}
                        onChange={(e) => updateUser(u.id, { warehouse_id: e.target.value || null })}
                        className="border border-[var(--line)] rounded-md px-2 py-1 text-xs bg-white"
                      >
                        <option value="">Unassigned</option>
                        {warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouse_name}</option>)}
                      </select>
                    ) : (
                      <span className="text-[var(--ink-soft)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateUser(u.id, { active: !u.active })}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {u.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
