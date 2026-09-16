import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, CreditCard, Tag, Coins, Users,
  FileText, ArrowLeft, RefreshCw, Plus, Check, X,
  Trash2, Mail, Shield, AlertCircle, ChevronDown, CheckCircle2
} from 'lucide-react';
import { developerApi } from '../../api/developerApi';

export default function DeveloperPortal({ onBack, currentUser }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [plans, setPlans] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modals & Inputs
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'DEVELOPER', can_manage: 0 });

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({ email: '', amount: 1, description: '' });

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, email, role }

  // Notification helper
  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, plansRes, campRes, accRes, auditRes] = await Promise.allSettled([
        developerApi.getStats(),
        developerApi.getPlans(),
        developerApi.getCampaigns(),
        developerApi.getAccounts(),
        developerApi.getAuditLogs(50)
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.plans || []);
      if (campRes.status === 'fulfilled') setCampaigns(campRes.value.campaigns || []);
      if (accRes.status === 'fulfilled') setAccounts(accRes.value.accounts || []);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.logs || []);
    } catch (err) {
      showToast(err.message || 'Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePlan = async (planId, currentActive) => {
    try {
      await developerApi.togglePlan(planId, currentActive ? 0 : 1);
      setPlans(plans.map(p => p.id === planId ? { ...p, is_active: currentActive ? 0 : 1 } : p));
      showToast('Plan status updated.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleCampaign = async (codeId, currentActive) => {
    try {
      await developerApi.toggleCampaign(codeId, currentActive ? 0 : 1);
      setCampaigns(campaigns.map(c => c.id === codeId ? { ...c, is_active: currentActive ? 0 : 1 } : c));
      showToast('Campaign status updated.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAdjustCredit = async (e) => {
    e.preventDefault();
    try {
      await developerApi.adjustCredits(creditForm.email, creditForm.amount, creditForm.description);
      showToast(`Adjusted credits for ${creditForm.email} successfully.`);
      setIsCreditModalOpen(false);
      setCreditForm({ email: '', amount: 1, description: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleInviteDeveloper = async (e) => {
    e.preventDefault();
    try {
      await developerApi.inviteDeveloper(
        inviteForm.email,
        inviteForm.full_name,
        inviteForm.role,
        parseInt(inviteForm.can_manage, 10)
      );
      showToast(`Invitation sent to ${inviteForm.email}.`);
      setIsInviteOpen(false);
      setInviteForm({ email: '', full_name: '', role: 'DEVELOPER', can_manage: 0 });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSetStatus = async (targetId, newStatus) => {
    try {
      await developerApi.setAccountStatus(targetId, parseInt(newStatus, 10));
      setAccounts(accounts.map(a => a.id === targetId ? { ...a, is_active: parseInt(newStatus, 10) } : a));
      showToast('Developer status updated.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await developerApi.deleteAccount(deleteTarget.id);
      showToast(`Account ${deleteTarget.email} deleted.`);
      setAccounts(accounts.filter(a => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message, 'error');
      setDeleteTarget(null);
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || stats?.caller_role === 'SUPER_ADMIN';
  const canManage = isSuperAdmin || Boolean(currentUser?.can_manage_developers || stats?.caller_can_manage);

  return (
    <div className="min-h-screen w-full bg-[#CFEDED] py-6 sm:py-8 px-4 sm:px-6 md:px-10 flex flex-col items-center">
      {/* Toast Alert */}
      {message.text && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 ${message.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#04302E] text-white'}`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-[#09A3A3]" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header Container */}
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-sm border border-white/80 p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-gray-200 hover:bg-[#CFEDED]/50 text-[#04211F] transition-all cursor-pointer"
            title="Back to website"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#04211F] tracking-tight">
                Developer Dashboard
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-800'}`}>
                {isSuperAdmin ? 'Super Admin' : 'Developer'}
              </span>
            </div>
            <p className="text-xs text-[#0B3D3D]/60 mt-0.5">
              Platform administration, pricing plans, referral codes, and security governance.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#04302E] text-white text-xs font-bold hover:bg-[#064643] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-6xl w-full flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'plans', label: 'Pricing Plans', icon: CreditCard },
          { id: 'campaigns', label: 'Campaign Codes', icon: Tag },
          { id: 'credits', label: 'Credit Adjustments', icon: Coins },
          { id: 'accounts', label: 'Developer Accounts', icon: Users },
          { id: 'audit', label: 'Audit Trail', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-[#04302E] text-white shadow-sm'
                  : 'bg-white/80 text-[#04211F] hover:bg-white border border-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#09A3A3]' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: 'Total Revenue', value: `₹${stats?.total_revenue?.toLocaleString() ?? '0'}`, sub: 'Captured payments' },
                { label: 'Paid Orders', value: stats?.successful_payments ?? 0, sub: 'Fulfilled orders' },
                { label: 'Assessments', value: stats?.total_assessments ?? 0, sub: 'Total test runs' },
                { label: 'Unlocked Reports', value: stats?.unlocked_assessments ?? 0, sub: 'Roadmaps revealed' },
                { label: 'Credits Sold', value: stats?.credits_sold ?? 0, sub: 'Ledger fulfilled' },
                { label: 'Conversion', value: `${stats?.conversion_rate ?? 0}%`, sub: 'Visitor to unlocked' },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-white/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase text-[#0B3D3D]/50 tracking-wider block mb-1">
                    {card.label}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#04211F] tracking-tight">
                    {card.value}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-white/80 shadow-sm">
              <h2 className="text-sm font-black text-[#04211F] mb-3">Live Platform System Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAFDFC] border border-gray-100">
                  <span className="text-gray-400 block font-bold mb-0.5">Database Engine</span>
                  <span className="font-extrabold text-[#04211F]">PostgreSQL 18 (Threaded Pool)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFDFC] border border-gray-100">
                  <span className="text-gray-400 block font-bold mb-0.5">Payment Gateway</span>
                  <span className="font-extrabold text-[#04211F]">Razorpay Standard SDK & Webhooks</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFDFC] border border-gray-100">
                  <span className="text-gray-400 block font-bold mb-0.5">Session Security</span>
                  <span className="font-extrabold text-[#04211F]">Flask HTTPOnly Signed Cookies</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRICING PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-[#04211F]">Configured Pricing Plans</h2>
                <p className="text-xs text-gray-500">Live active plans loaded from PostgreSQL pricing_plans table.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[#0B3D3D]/60 font-black uppercase">
                    <th className="pb-3 px-2">Plan ID</th>
                    <th className="pb-3 px-2">Name</th>
                    <th className="pb-3 px-2">Price (₹)</th>
                    <th className="pb-3 px-2">Credits</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {plans.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-mono text-gray-500">{p.id}</td>
                      <td className="py-3 px-2 font-bold text-[#04211F]">{p.name}</td>
                      <td className="py-3 px-2 font-extrabold text-[#09A3A3]">₹{p.price}</td>
                      <td className="py-3 px-2 font-bold">{p.credits}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleTogglePlan(p.id, p.is_active)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-bold hover:bg-gray-100 transition-all cursor-pointer"
                        >
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CAMPAIGN CODES TAB */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-[#04211F]">Referral & Campaign Codes</h2>
                <p className="text-xs text-gray-500">Manage promotional discounts and redemption rules.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[#0B3D3D]/60 font-black uppercase">
                    <th className="pb-3 px-2">Code</th>
                    <th className="pb-3 px-2">Name</th>
                    <th className="pb-3 px-2">Discount</th>
                    <th className="pb-3 px-2">Uses / Limit</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-mono font-bold text-[#09A3A3]">{c.code}</td>
                      <td className="py-3 px-2 font-bold text-[#04211F]">{c.campaign_name}</td>
                      <td className="py-3 px-2 font-extrabold">{c.discount_value}%</td>
                      <td className="py-3 px-2">{c.used_count} / {c.max_uses || '∞'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleToggleCampaign(c.id, c.is_active)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-bold hover:bg-gray-100 transition-all cursor-pointer"
                        >
                          {c.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CREDIT ADJUSTMENTS TAB */}
        {activeTab === 'credits' && (
          <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-6">
            <h2 className="text-base font-black text-[#04211F] mb-1">Manual Credit Ledger Adjustment</h2>
            <p className="text-xs text-gray-500 mb-6">Manually grant or deduct credits for user support. Every adjustment is recorded in the audit trail.</p>

            <form onSubmit={handleAdjustCredit} className="max-w-xl space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">User Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={creditForm.email}
                  onChange={(e) => setCreditForm({ ...creditForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#09A3A3] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Credit Amount (+ to grant, - to deduct)</label>
                <input
                  type="number"
                  required
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#09A3A3] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Audit Description Reason (Mandatory)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer support resolution / manual promotion"
                  value={creditForm.description}
                  onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#09A3A3] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#04302E] text-white font-extrabold hover:bg-[#064643] transition-all cursor-pointer"
              >
                Apply Credit Adjustment
              </button>
            </form>
          </div>
        )}

        {/* DEVELOPER ACCOUNTS TAB */}
        {activeTab === 'accounts' && (
          <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-[#04211F]">Staff & Developer Registry</h2>
                <p className="text-xs text-gray-500">Super Admins and authorized Developers with permission.</p>
              </div>

              {canManage && (
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#09A3A3] text-white text-xs font-bold hover:bg-[#078585] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite Developer</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[#0B3D3D]/60 font-black uppercase">
                    <th className="pb-3 px-2">Name / Email</th>
                    <th className="pb-3 px-2">Role</th>
                    <th className="pb-3 px-2">Can Manage Staff</th>
                    <th className="pb-3 px-2">Status</th>
                    {canManage && <th className="pb-3 px-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2">
                        <div className="font-bold text-[#04211F]">{acc.full_name || acc.name || 'Staff Member'}</div>
                        <div className="text-[11px] text-gray-400">{acc.email}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${acc.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-800'}`}>
                          {acc.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {acc.role === 'SUPER_ADMIN' || acc.can_manage_developers ? 'Yes' : 'No'}
                      </td>
                      <td className="py-3 px-2">
                        {canManage ? (
                          <select
                            value={acc.is_active ? 1 : 0}
                            onChange={(e) => handleSetStatus(acc.id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] font-bold bg-white cursor-pointer"
                          >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${acc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {acc.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => setDeleteTarget(acc)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT TRAIL TAB */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-6">
            <h2 className="text-base font-black text-[#04211F] mb-1">Administrative Audit Trail</h2>
            <p className="text-xs text-gray-500 mb-5">Immutable log of security, permissions, and financial actions.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[#0B3D3D]/60 font-black uppercase">
                    <th className="pb-3 px-2">Timestamp</th>
                    <th className="pb-3 px-2">Action</th>
                    <th className="pb-3 px-2">Actor</th>
                    <th className="pb-3 px-2">Target</th>
                    <th className="pb-3 px-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2 text-gray-400 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-[#09A3A3]">{log.action}</td>
                      <td className="py-3 px-2 font-medium text-gray-600">{log.actor_email}</td>
                      <td className="py-3 px-2 font-medium text-gray-600">{log.target_email || '-'}</td>
                      <td className="py-3 px-2 text-gray-500 text-[11px] max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Invite Developer */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04211F]/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 text-xs">
            <h3 className="text-base font-black text-[#04211F] mb-4">Invite New Developer</h3>
            <form onSubmit={handleInviteDeveloper} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#09A3A3]"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#09A3A3]"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#09A3A3]"
                >
                  <option value="DEVELOPER">DEVELOPER</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Can Manage Developers?</label>
                <select
                  value={inviteForm.can_manage}
                  onChange={(e) => setInviteForm({ ...inviteForm, can_manage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#09A3A3]"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#09A3A3] font-bold text-white hover:bg-[#078585] cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Account Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04211F]/50 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 text-xs">
            <h3 className="text-base font-black text-red-600 mb-2">Delete Account Confirmation</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to delete this <strong>{deleteTarget.role}</strong> ({deleteTarget.email})?
              All created functionality like pricing models and referral codes will not be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
