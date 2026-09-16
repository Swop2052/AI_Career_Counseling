import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Coins, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { developerApi } from '../../api/developerApi';
import { PrimaryButton, GhostButton, Field, inputClasses, StatusPill } from './ui';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

const EMPTY_FORM = { id: '', name: '', price: '', credits: '', type: 'SINGLE_ASSESSMENT', is_active: 1 };

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

export default function PricingPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPlans = () => {
    setLoading(true);
    developerApi.getPlans()
      .then((res) => {
        setPlans(res.plans || []);
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load plans:', err);
        setError('Failed to load pricing plans from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function handleOpenEdit(plan) {
    setEditingId(plan.id);
    setForm({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      credits: plan.credits,
      type: plan.type || 'SINGLE_ASSESSMENT',
      is_active: plan.is_active !== undefined ? plan.is_active : 1,
    });
    setModalOpen(true);
  }

  function handleSave(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.name.trim()) {
      alert('Plan name is required.');
      return;
    }
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) {
      alert('Please enter a valid non-negative price.');
      return;
    }
    if (form.credits === '' || isNaN(Number(form.credits)) || Number(form.credits) < 1) {
      alert('Please enter at least 1 assessment credit.');
      return;
    }

    setActionLoading(true);
    const payload = {
      id: form.id?.trim() || undefined,
      name: form.name.trim(),
      price: Number(form.price),
      credits: Number(form.credits),
      type: form.type,
      is_active: Number(form.is_active),
    };

    const action = editingId
      ? developerApi.updatePlan(editingId, payload)
      : developerApi.createPlan(payload);

    action
      .then(() => {
        setModalOpen(false);
        loadPlans();
      })
      .catch((err) => {
        alert(err.message || 'Failed to save pricing plan.');
      })
      .finally(() => setActionLoading(false));
  }

  function handleToggleStatus(plan) {
    const nextStatus = plan.is_active === 1 ? 0 : 1;
    developerApi.togglePlan(plan.id, nextStatus)
      .then(() => {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, is_active: nextStatus } : p))
        );
      })
      .catch((err) => {
        alert(err.message || 'Failed to update plan status.');
      });
  }

  function handleDeleteConfirm() {
    if (!confirmId) return;
    setActionLoading(true);
    developerApi.deletePlan(confirmId)
      .then(() => {
        setConfirmId(null);
        loadPlans();
      })
      .catch((err) => {
        alert(err.message || 'Failed to delete plan.');
      })
      .finally(() => setActionLoading(false));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#09A3A3]" />
          <span className="text-sm font-semibold text-[#0B1F1D]">
            {plans.length} Live Pricing Tier{plans.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <GhostButton onClick={loadPlans} className="flex items-center gap-1.5 py-2 px-3 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </GhostButton>
          <PrimaryButton onClick={handleOpenCreate} className="flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold">
            <Plus className="h-4 w-4" /> Create Pricing Plan
          </PrimaryButton>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && plans.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#09A3A3] border-t-transparent rounded-full animate-spin" />
          <span>Loading plans from server...</span>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {plans.map((plan, i) => {
              const active = plan.is_active === 1 || plan.is_active === true;
              return (
                <motion.div
                  key={plan.id}
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
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-base text-[#0B1F1D]">{plan.name}</h3>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{plan.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(plan)}
                        className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        title="Click to toggle active status"
                      >
                        <StatusPill status={active ? 'Active' : 'Retired'} />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-2xl font-black text-[#04302e]">
                        ₹{Number(plan.price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">/ purchase</span>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#E7F7F7]/60 border border-[#09A3A3]/20 mb-4">
                      <Coins className="h-4 w-4 text-[#09A3A3] shrink-0" />
                      <span className="text-xs font-bold text-[#04302e]">
                        {plan.credits} Assessment Credit{plan.credits === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(plan)}
                      className="p-2 text-gray-500 hover:text-[#09A3A3] hover:bg-[#E7F7F7] rounded-lg transition-colors cursor-pointer"
                      title="Edit Plan"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(plan.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Pricing Plan' : 'Create Pricing Plan'}
        footer={
          <>
            <GhostButton onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </GhostButton>
            <PrimaryButton onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : editingId ? 'Update Plan' : 'Create Plan'}
            </PrimaryButton>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editingId && (
            <Field label="Plan ID (unique slug, e.g. plan_career_plus)">
              <input
                className={inputClasses}
                placeholder="e.g. plan_career_plus"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
              />
            </Field>
          )}

          <Field label="Plan Title">
            <input
              className={inputClasses}
              placeholder="e.g. 3 Assessment Career Pack"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹ INR)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClasses}
                placeholder="299"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </Field>

            <Field label="Credits Granted">
              <input
                type="number"
                min="1"
                step="1"
                className={inputClasses}
                placeholder="3"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan Type">
              <select
                className={inputClasses}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="SINGLE_ASSESSMENT">Single Assessment</option>
                <option value="MULTI_ASSESSMENT">Multi Assessment Pack</option>
                <option value="SUBSCRIPTION">Subscription</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                className={inputClasses}
                value={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}
              >
                <option value={1}>Active</option>
                <option value={0}>Retired (Inactive)</option>
              </select>
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Pricing Plan?"
        description="Are you sure you want to delete this pricing plan? If it has historical purchase records, it will be marked retired instead."
      />
    </div>
  );
}
