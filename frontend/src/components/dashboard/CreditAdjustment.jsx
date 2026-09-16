import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldAlert, Wallet, AlertCircle } from 'lucide-react';
import { developerApi } from '../../api/developerApi';
import { SectionCard, PrimaryButton, Field, inputClasses } from './ui';

const EMPTY_FORM = { email: '', amount: '', reason: '' };

export default function CreditAdjustment() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const next = {};
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = 'Enter a valid student email address';
    }
    if (!form.amount || Number(form.amount) === 0) {
      next.amount = 'Enter a non-zero amount (+ to grant, - to deduct)';
    }
    if (!form.reason.trim()) {
      next.reason = 'Audit reason is strictly required by regulatory policy';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSuccess(null);
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    developerApi.adjustCredits(form.email.trim(), Number(form.amount), form.reason.trim())
      .then((res) => {
        setSuccess({
          email: form.email.trim(),
          amount: Number(form.amount),
          newBalance: res.new_balance,
        });
        setForm(EMPTY_FORM);
      })
      .catch((err) => {
        setServerError(err.message || 'Failed to adjust credits. Please check email address.');
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="max-w-xl mx-auto">
      <SectionCard className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="p-3 bg-[#E7F7F7] rounded-2xl text-[#09A3A3]">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#0B1F1D]">Manual Wallet Credit Adjustment</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Instantly credit or debit student assessment attempts with persistent audit logging.
            </p>
          </div>
        </div>

        {serverError && (
          <div className="mb-5 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
          </div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Credits Adjusted Successfully</p>
              <p className="mt-1">
                Account <strong>{success.email}</strong> was {success.amount > 0 ? 'credited' : 'debited'} with{' '}
                <strong>{success.amount > 0 ? `+${success.amount}` : success.amount}</strong> credits.
              </p>
              {success.newBalance !== undefined && (
                <p className="mt-1 font-semibold text-emerald-900">
                  New Live Balance: {success.newBalance} credit{success.newBalance === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Student Account Email" error={errors.email}>
            <input
              type="email"
              placeholder="student@example.com"
              className={inputClasses}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>

          <Field label="Credit Amount (+ to grant, - to deduct)" error={errors.amount}>
            <input
              type="number"
              step="1"
              placeholder="e.g. 1 or 3 (or -1)"
              className={inputClasses}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>

          <Field label="Mandatory Reason (Recorded in Immutable Audit Log)" error={errors.reason}>
            <textarea
              rows={3}
              placeholder="e.g. Customer support compensation for assessment disconnect"
              className={inputClasses}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>

          <div className="pt-3">
            <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center py-3 text-sm font-bold">
              {submitting ? 'Applying Adjustment...' : 'Apply Wallet Adjustment'}
            </PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
