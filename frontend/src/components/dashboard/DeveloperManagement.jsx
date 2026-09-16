import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Shield,
  ShieldCheck,
  Trash2,
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Clock,
  Send,
  Power
} from 'lucide-react';
import { developerApi } from '../../api/developerApi';
import { PrimaryButton, GhostButton, DangerButton, Field, inputClasses, StatusPill, Avatar } from './ui';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

const EMPTY_INVITE = { email: '', full_name: '', role: 'DEVELOPER', can_manage_developers: 0 };

export default function DeveloperManagement() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_INVITE);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(null);
  const [bannerSuccess, setBannerSuccess] = useState(null);

  const loadDevelopers = () => {
    setLoading(true);
    developerApi.getAccounts()
      .then((res) => {
        setDevelopers(res.developers || res.accounts || []);
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load accounts:', err);
        setError(err.message || 'Failed to load user accounts. Super Admin authorization required.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDevelopers();
  }, []);

  function handleInvite(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.full_name.trim()) return;

    setActionLoading(true);
    setError('');
    setBannerSuccess(null);

    developerApi.inviteDeveloper(form.email.trim(), form.full_name.trim(), form.role, form.can_manage_developers)
      .then((res) => {
        setBannerSuccess(res.message || `Invitation email sent successfully to ${form.email.trim()}.`);
        setForm(EMPTY_INVITE);
        setModalOpen(false);
        loadDevelopers();
      })
      .catch((err) => {
        setError(err.message || 'Failed to send account invitation.');
      })
      .finally(() => setActionLoading(false));
  }

  function handleResend(dev) {
    if (resendingEmail) return;
    setResendingEmail(dev.email);
    setError('');
    setBannerSuccess(null);

    developerApi.resendInvitation(dev.email)
      .then((res) => {
        setBannerSuccess(res.message || `Invitation successfully resent to ${dev.email}.`);
        loadDevelopers();
      })
      .catch((err) => {
        setError(err.message || `Failed to resend invitation to ${dev.email}.`);
      })
      .finally(() => setResendingEmail(null));
  }

  function handleToggleStatus(dev) {
    const nextStatus = dev.is_active === 1 || dev.is_active === true ? 0 : 1;
    setError('');
    setBannerSuccess(null);

    developerApi.setAccountStatus(dev.id, nextStatus)
      .then((res) => {
        setDevelopers((prev) =>
          prev.map((d) => (d.id === dev.id ? { ...d, is_active: nextStatus } : d))
        );
        setBannerSuccess(res.message || `Account status updated to ${nextStatus ? 'Active' : 'Disabled'}.`);
      })
      .catch((err) => {
        setError(err.message || 'Failed to update account status.');
      });
  }

  function handleTogglePermissions(dev) {
    const nextPerm = dev.can_manage_developers ? 0 : 1;
    setError('');
    setBannerSuccess(null);

    developerApi.updatePermissions(dev.id, nextPerm)
      .then(() => {
        setDevelopers((prev) =>
          prev.map((d) => (d.id === dev.id ? { ...d, can_manage_developers: Boolean(nextPerm) } : d))
        );
        setBannerSuccess(`Updated management permissions for ${dev.full_name || dev.email}.`);
      })
      .catch((err) => {
        setError(err.message || 'Failed to update user permissions.');
      });
  }

  function handleDeleteConfirm() {
    if (!confirmDeleteId) return;
    setActionLoading(true);
    setError('');
    setBannerSuccess(null);

    developerApi.deleteAccount(confirmDeleteId)
      .then((res) => {
        setConfirmDeleteId(null);
        setBannerSuccess(res.message || 'Account successfully deleted.');
        loadDevelopers();
      })
      .catch((err) => {
        setError(err.message || 'Failed to delete account.');
      })
      .finally(() => setActionLoading(false));
  }

  const filteredDevs = useMemo(() => {
    if (!searchQuery.trim()) return developers;
    const q = searchQuery.toLowerCase().trim();
    return developers.filter(
      (d) =>
        (d.full_name || '').toLowerCase().includes(q) ||
        (d.email || '').toLowerCase().includes(q) ||
        (d.role || '').toLowerCase().includes(q)
    );
  }, [developers, searchQuery]);

  function formatDate(dtStr) {
    if (!dtStr) return '—';
    try {
      const dt = new Date(dtStr);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dtStr;
    }
  }

  function renderStatusBadge(dev) {
    const active = dev.is_active === 1 || dev.is_active === true;
    if (active) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }

    if (dev.invitation_status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Pending Invite
        </span>
      );
    }

    if (dev.invitation_status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-500" />
          Invite Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
        <Power className="w-3 h-3 text-gray-400" />
        Disabled
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Primary Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#0B1F1D] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-700" />
            User & Role Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Super Admin Console — provision Developer or Super Admin accounts, monitor invitation delivery, and manage access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <GhostButton onClick={loadDevelopers} className="flex items-center gap-1.5 py-2 px-3 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </GhostButton>
          <PrimaryButton onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 py-2 px-4 text-xs font-bold shadow-md shadow-emerald-600/10">
            <UserPlus className="h-4 w-4" /> Add User
          </PrimaryButton>
        </div>
      </div>

      {/* Success Banner */}
      {bannerSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{bannerSuccess}</span>
          </div>
          <button
            onClick={() => setBannerSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-3 cursor-pointer text-sm leading-none"
          >
            &times;
          </button>
        </motion.div>
      )}

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-red-50 text-red-800 rounded-xl text-xs border border-red-200 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900 font-bold ml-3 cursor-pointer text-sm leading-none"
          >
            &times;
          </button>
        </motion.div>
      )}

      {/* Filter / Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by name, email, or role..."
          className={`${inputClasses} pl-10`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Accounts Table */}
      {loading && developers.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-gray-100">
          <div className="w-8 h-8 border-3 border-[#09A3A3] border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading administrative accounts...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F7F6] border-b border-gray-100 text-[#04302e] font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Manage Devs</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredDevs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">
                      No matching accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredDevs.map((dev) => {
                    const active = dev.is_active === 1 || dev.is_active === true;
                    const isSuperAdmin = dev.role === 'SUPER_ADMIN';
                    const initials = (dev.full_name || dev.email || 'US').slice(0, 2).toUpperCase();
                    const isPendingOrExpired = !active && (dev.invitation_status === 'PENDING' || dev.invitation_status === 'EXPIRED');

                    return (
                      <tr key={dev.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* User Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar initials={initials} size="sm" />
                            <div>
                              <p className="font-bold text-gray-900">{dev.full_name || dev.email.split('@')[0]}</p>
                              <p className="text-gray-400 font-mono text-[11px]">{dev.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                              isSuperAdmin
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-teal-50 text-teal-700 border-teal-200'
                            }`}
                          >
                            {dev.role}
                          </span>
                        </td>

                        {/* Account Status Badge */}
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(dev)}
                        </td>

                        {/* Creation Date */}
                        <td className="py-3.5 px-4 text-gray-500 font-medium">
                          {formatDate(dev.created_at)}
                        </td>

                        {/* Manage Devs Permission */}
                        <td className="py-3.5 px-4">
                          {isSuperAdmin ? (
                            <span className="text-gray-400 italic text-[11px]">Full Authority</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTogglePermissions(dev)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                dev.can_manage_developers
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              {dev.can_manage_developers ? 'Granted (Revoke)' : 'Revoked (Grant)'}
                            </button>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Resend Invitation (for inactive pending/expired accounts) */}
                            {isPendingOrExpired && (
                              <button
                                type="button"
                                onClick={() => handleResend(dev)}
                                disabled={resendingEmail === dev.email}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#E7F7F7] text-[#076865] hover:bg-[#CFEDED] border border-[#09A3A3]/20 transition-all cursor-pointer disabled:opacity-50"
                                title="Resend account setup email invitation"
                              >
                                {resendingEmail === dev.email ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                Resend Invite
                              </button>
                            )}

                            {/* Toggle Active / Disabled status */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(dev)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                active
                                  ? 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-700 border-gray-200 hover:border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                              }`}
                              title={active ? 'Disable account' : 'Reactivate account'}
                            >
                              {active ? 'Deactivate' : 'Reactivate'}
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(dev.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Administrator / Developer Account"
        footer={
          <>
            <GhostButton onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </GhostButton>
            <PrimaryButton onClick={handleInvite} disabled={actionLoading}>
              {actionLoading ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Sending Invitation...
                </span>
              ) : (
                'Send Invitation Email'
              )}
            </PrimaryButton>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            The recipient will receive an official SkillSense email invitation with a secure, single-use 24-hour setup link to set their password.
          </p>

          <Field label="Full Name">
            <input
              className={inputClasses}
              placeholder="e.g. Alex Rivera"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </Field>

          <Field label="Email Address">
            <input
              type="email"
              className={inputClasses}
              placeholder="administrator@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>

          <Field label="Assigned System Role">
            <select
              className={inputClasses}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="DEVELOPER">Developer (Technical Console Access)</option>
              <option value="SUPER_ADMIN">Super Admin (Full Administrative Authority)</option>
            </select>
          </Field>

          {form.role === 'DEVELOPER' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="can_manage_devs"
                checked={form.can_manage_developers === 1}
                onChange={(e) => setForm({ ...form, can_manage_developers: e.target.checked ? 1 : 0 })}
                className="rounded border-gray-300 text-[#09A3A3] focus:ring-[#09A3A3]"
              />
              <label htmlFor="can_manage_devs" className="text-xs text-gray-700 font-medium cursor-pointer">
                Grant permission to manage developer accounts
              </label>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Account?"
        description="Are you sure you want to permanently delete this administrative account? All console access will be revoked immediately."
      />
    </div>
  );
}
