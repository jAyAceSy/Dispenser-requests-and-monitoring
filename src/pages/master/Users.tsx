import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AppUser, UserRole, Warehouse } from '../../lib/types';
import { ROLE_LABEL } from '../../lib/types';

const ALL_ROLES: UserRole[] = ['insti_team', 'warehouse_officer', 'approving_officer', 'admin'];

export function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRolesFor, setOpenRolesFor] = useState<string | null>(null);

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
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Users</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          People create their own accounts via the Sign Up screen (Admin accounts must be granted here). Click a user's roles to assign more than one.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl h-48 animate-pulse" />
      ) : (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[#f9faf9]">
                {['Name', 'Email', 'Roles', 'Department', 'Warehouse', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-[var(--ink-soft)] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[#f9faf9] align-top">
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{u.name}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{u.email}</td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setOpenRolesFor(openRolesFor === u.id ? null : u.id)}
                      className="flex flex-wrap gap-1 text-left"
                    >
                      {u.roles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded text-xs font-medium bg-[#eef1f0] text-[var(--ink)]">
                          {ROLE_LABEL[r]}
                        </span>
                      ))}
                      <span className="text-xs text-[var(--brand)] font-semibold self-center ml-1">edit</span>
                    </button>
                    {openRolesFor === u.id && (
                      <div className="absolute z-20 mt-1 bg-white border border-[var(--line)] rounded-md shadow-lg p-2 w-56">
                        {ALL_ROLES.map((r) => (
                          <label key={r} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-[#eef1f0] rounded cursor-pointer">
                            <input type="checkbox" checked={u.roles.includes(r)} onChange={() => toggleRole(u, r)} />
                            {ROLE_LABEL[r]}
                          </label>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{u.department || '—'}</td>
                  <td className="px-4 py-3">
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
