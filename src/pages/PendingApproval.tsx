import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function PendingApproval() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  async function handleRefresh() {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] px-4">
      <div className="max-w-sm w-full bg-[var(--panel)] border border-[var(--line)] rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b5670a" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
        <h1 className="text-base font-semibold text-[var(--ink)]">Account Pending Approval</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-2">
          Hi {profile?.name?.split(' ')[0] || 'there'}, your account has been created but an Admin needs to approve it before you can access the system.
          You'll be notified once approved — there's nothing else you need to do right now.
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold rounded-md py-2.5 disabled:opacity-60"
          >
            {checking ? 'Checking…' : "Check again — I've been approved"}
          </button>
          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="text-sm font-medium text-[var(--ink-soft)] hover:underline py-1"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
