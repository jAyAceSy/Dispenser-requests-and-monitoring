import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AppUser, UserRole, Warehouse } from '../../lib/types';
import { ROLE_LABEL } from '../../lib/types';

const ALL_ROLES: UserRole[] = ['insti_team', 'warehouse_officer', 'approving_officer', 'admin'];

export function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRolesFor, setEditingRolesFor] = useState<AppUser | null>(null);

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

  async function toggleRole(u: AppUser, role: UserRole) {
    const has = u.roles.includes(role);
    let next = has ? u.roles.filter((r) => r !== role) : [...u.roles, role];
    if (next.length === 0) next = ['insti_team'];
    await updateUser(u.id, { roles: next, role: next[0] });
    setEditingRolesFor((current) => (current && current.id === u.id ? { ...current, roles: next } : current));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Users</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          People create their own accounts via the Sign Up screen (Admin accounts must be granted here). Tap a user's roles to assign more than one.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-48 animate-pulse" />
      ) : (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[#f9faf9]">
                  {['Name', 'Email', 'Roles', 'Department', 'Warehouse', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs uppercase tracking-wide text-[var(--ink-soft)] px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[#f9faf9] align-top">
                    <td className="px-4 py-3 font-medium text-[var(--ink)] whitespace-nowrap">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--ink-soft)] whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditingRolesFor(u)} className="flex flex-wrap gap-1 text-left items-center">
                        {u.roles.map((r) => (
                          <span key={r} className="px-2 py-0.5 rounded text-xs font-medium bg-[#eef1f0] text-[var(--ink)] whitespace-nowrap">
                            {ROLE_LABEL[r]}
                          </span>
                        ))}
                        <span className="text-xs text-[var(--brand)] font-semibold ml-1 whitespace-nowrap">edit</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-soft)] whitespace-nowrap">{u.department || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.roles.includes('warehouse_officer') ? (
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
                    <td className="px-4 py-3 whitespace-nowrap">
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
        </div>
      )}

      {editingRolesFor && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setEditingRolesFor(null)}>
          <div className="bg-white rounded-xl border border-[var(--line)] max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-semibold text-[var(--ink)] mb-1">Edit roles</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-4">{editingRolesFor.name} · {editingRolesFor.email}</p>
            <div className="flex flex-col gap-1">
              {ALL_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 px-2 py-2.5 text-sm hover:bg-[#eef1f0] rounded cursor-pointer">
                  <input type="checkbox" checked={editingRolesFor.roles.includes(r)} onChange={() => toggleRole(editingRolesFor, r)} />
                  {ROLE_LABEL[r]}
                </label>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setEditingRolesFor(null)} className="px-4 py-2 text-sm rounded-md bg-[var(--brand)] text-white font-semibold">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
