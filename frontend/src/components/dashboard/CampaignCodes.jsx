import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tag, Calendar, Users, TicketPercent, AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { developerApi } from '../../api/developerApi';
import { PrimaryButton, GhostButton, Field, inputClasses, ProgressBar, StatusPill } from './ui';
import Modal from './Modal';

const EMPTY_CAMPAIGN = {
  code: '',
  campaign_name: '',
  discount_type: 'PERCENT',
  discount_value: '',
  valid_from: '',
  valid_until: '',
  max_uses: '',
  one_per_account: 1,
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: Math.min(i, 8) * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.18 } },
};

export default function CampaignCodes() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CAMPAIGN);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCampaigns = () => {
    setLoading(true);
    developerApi.getCampaigns()
      .then((res) => {
        setCampaigns(res.campaigns || []);
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load campaigns:', err);
        setError('Failed to load campaign codes from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    const q = searchQuery.toLowerCase().trim();
    return campaigns.filter((c) => {
      const code = (c.code || '').toLowerCase();
      const name = (c.campaign_name || '').toLowerCase();
      const type = (c.discount_type || '').toLowerCase();
      const val = String(c.discount_value || '').toLowerCase();
      const status = (c.is_active === 1 || c.is_active === true ? 'active' : 'expired').toLowerCase();
      return code.includes(q) || name.includes(q) || type.includes(q) || val.includes(q) || status.includes(q);
    });
  }, [campaigns, searchQuery]);

  function handleSave(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.code.trim()) {
      alert('Discount code is required.');
      return;
    }
    if (!form.discount_value || isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) {
      alert('Please enter a valid positive discount value.');
      return;
    }

    setActionLoading(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      campaign_name: form.campaign_name.trim() || form.code.trim().toUpperCase(),
      discount_type: form.discount_type === 'PERCENT' ? 'PERCENTAGE' : form.discount_type,
      discount_value: Number(form.discount_value),
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      max_uses: form.max_uses ? Number(form.max_uses) : 300,
      one_use_per_user: Number(form.one_per_account),
      one_per_account: Number(form.one_per_account),
    };

    developerApi.createCampaign(payload)
      .then(() => {
        setModalOpen(false);
        setForm(EMPTY_CAMPAIGN);
        loadCampaigns();
      })
      .catch((err) => {
        alert(err.message || 'Failed to create campaign code.');
      })
      .finally(() => setActionLoading(false));
  }

  function handleToggle(c) {
    const nextStatus = c.is_active === 1 ? 0 : 1;
    developerApi.toggleCampaign(c.id, nextStatus)
      .then(() => {
        setCampaigns((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, is_active: nextStatus } : item))
        );
      })
      .catch((err) => {
        alert(err.message || 'Failed to update campaign status.');
      });
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 shrink-0">
          <TicketPercent className="h-5 w-5 text-[#09A3A3]" />
          <div>
            <span className="text-sm font-bold text-[#0B1F1D]">
              {searchQuery.trim()
                ? `Showing ${filteredCampaigns.length} of ${campaigns.length} Referral / Campaign Codes`
                : `${campaigns.length} Referral / Campaign Code${campaigns.length === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 lg:max-w-xl justify-end">
          {/* Working Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaign code, name, or discount..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white focus:bg-white focus:border-[#09A3A3] focus:ring-2 focus:ring-[#09A3A3]/20 transition-all outline-none text-[#0B1F1D] placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <GhostButton onClick={loadCampaigns} className="flex items-center gap-1.5 py-2 px-3 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </GhostButton>
            <PrimaryButton onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold">
              <Plus className="h-4 w-4" /> Create Campaign Code
            </PrimaryButton>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && campaigns.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#09A3A3] border-t-transparent rounded-full animate-spin" />
          <span>Loading campaign codes from server...</span>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-[#0B1F1D]">No campaign codes match "{searchQuery}"</p>
            <p className="text-xs text-gray-400">Try searching with a different coupon code name, discount, or status.</p>
          </div>
          <GhostButton onClick={() => setSearchQuery('')} className="text-xs mt-2">
            Clear Search
          </GhostButton>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredCampaigns.map((c, i) => {
              const active = c.is_active === 1 || c.is_active === true;
              const uses = c.redemptions_used ?? c.times_redeemed ?? c.real_redemption_count ?? c.used_count ?? 0;
              const max = c.redemption_limit ?? c.max_uses ?? null;
              const pctUsed = c.redemption_percentage ?? (max > 0 ? Math.min(100, Math.round((uses / max) * 100)) : 0);

              return (
                <motion.div
                  key={c.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={i}
                  layout
                  className={`relative bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                    active ? 'border-[#04302e]/10' : 'border-gray-200 opacity-60 bg-gray-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg text-[#04302e] tracking-wider px-2 py-0.5 bg-[#CFEDED]/40 rounded-lg border border-[#09A3A3]/20">
                            {c.code}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-1">{c.campaign_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle(c)}
                        className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        title="Click to toggle active status"
                      >
                        <StatusPill status={active ? 'Active' : 'Expired'} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 my-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {c.discount_type === 'PERCENT' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                      </span>
                      {c.one_per_account === 1 && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          1 use / user
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 my-3 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-[#09A3A3]" /> Redemptions:
                        </span>
                        <span className="font-bold text-[#0B1F1D]">
                          {uses} {max ? `/ ${max}` : '(Unlimited)'}
                        </span>
                      </div>
                      {max ? <ProgressBar value={pctUsed} max={100} /> : null}
                    </div>

                    {(c.valid_from || c.valid_until) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 border-t border-gray-100 pt-2.5">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>
                          {c.valid_until ? `Valid till ${new Date(c.valid_until).toLocaleDateString()}` : 'No expiration date'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Campaign / Referral Code"
        footer={
          <>
            <GhostButton onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </GhostButton>
            <PrimaryButton onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Code'}
            </PrimaryButton>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Discount Code (uppercase alphanumeric)">
            <input
              className={inputClasses}
              placeholder="e.g. WORKSHOP100 or DIWALI50"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
            />
          </Field>

          <Field label="Campaign Description / Name">
            <input
              className={inputClasses}
              placeholder="e.g. College Workshop Free Access"
              value={form.campaign_name}
              onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount Type">
              <select
                className={inputClasses}
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </Field>

            <Field label={form.discount_type === 'PERCENT' ? 'Discount % (e.g. 100 for free)' : 'Discount Amount (₹)'}>
              <input
                type="number"
                min="1"
                max={form.discount_type === 'PERCENT' ? 100 : 10000}
                className={inputClasses}
                placeholder={form.discount_type === 'PERCENT' ? '100' : '50'}
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Max Redemptions (blank for unlimited)">
              <input
                type="number"
                min="1"
                className={inputClasses}
                placeholder="Unlimited"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              />
            </Field>

            <Field label="One redemption per account">
              <select
                className={inputClasses}
                value={form.one_per_account}
                onChange={(e) => setForm({ ...form, one_per_account: Number(e.target.value) })}
              >
                <option value={1}>Yes (Strict)</option>
                <option value={0}>No (Multiple allowed)</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid From">
              <input
                type="date"
                className={inputClasses}
                value={form.valid_from}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
              />
            </Field>

            <Field label="Valid Until (Expiry)">
              <input
                type="date"
                className={inputClasses}
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
