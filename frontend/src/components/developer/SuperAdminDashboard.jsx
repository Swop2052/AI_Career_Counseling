import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ShieldCheck, Layers, TicketPercent, Wallet, Users2, FileText, UserPlus } from 'lucide-react';
import Sidebar from '../dashboard/Sidebar';
import Topbar from '../dashboard/Topbar';
import StatCard from '../dashboard/StatCard';
import PricingPlans from '../dashboard/PricingPlans';
import CampaignCodes from '../dashboard/CampaignCodes';
import CreditAdjustment from '../dashboard/CreditAdjustment';
import UserRegistry from '../dashboard/UserRegistry';
import DeveloperManagement from '../dashboard/DeveloperManagement';
import AuditLog from '../dashboard/AuditLog';
import { developerApi } from '../../api/developerApi';

export default function SuperAdminDashboard({ currentUser, onBackToSite, onLogout }) {
  const [section, setSection] = useState('developers');
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = () => {
    setRefreshing(true);
    developerApi.getStats()
      .then((res) => setStats(res.stats || res))
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const metaMap = {
    developers: {
      title: 'User & Role Management',
      description: 'Provision new Developer or Super Admin accounts, monitor invitation delivery via SMTP, and manage system privileges.',
      Component: DeveloperManagement,
    },
    pricing: {
      title: 'Platform Pricing Plans',
      description: 'Configure active pricing plans, rates, and credit packages available to all platform students.',
      Component: PricingPlans,
    },
    campaigns: {
      title: 'Partner & Campaign Referral Codes',
      description: 'Manage institutional referral codes, coupon discounts, usage caps, and redemption schedules.',
      Component: CampaignCodes,
    },
    credits: {
      title: 'Direct Credit Adjustment & Granting',
      description: 'Manually grant or deduct assessment wallet credits with reason-verified audit logging.',
      Component: CreditAdjustment,
    },
    registry: {
      title: 'Complete User Directory',
      description: 'Audit every student account registered across the platform, including completion and transaction history.',
      Component: UserRegistry,
    },
    audit: {
      title: 'Platform Immutable Audit Log',
      description: 'Review chronological records of administrative modifications, credit grants, and authorization changes.',
      Component: AuditLog,
    },
  };

  const currentMeta = metaMap[section] || metaMap.developers;
  const ActiveComponent = currentMeta.Component;

  return (
    <div className="min-h-screen w-full bg-[#E7F7F7]/40 flex flex-col lg:flex-row text-[#0B1F1D]">
      <Sidebar
        active={section}
        onChange={setSection}
        isSuperAdmin={true}
        onBackToSite={onBackToSite}
      />

      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F8FCFC]">
        <Topbar
          user={currentUser}
          isSuperAdmin={true}
          onBackToSite={onBackToSite}
          onLogout={onLogout}
        />

        <div className="w-full px-4 sm:px-8 lg:px-12 py-6 lg:py-8 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-100 text-[10px] font-black text-purple-900 uppercase tracking-wider mb-2 border border-purple-200">
                <ShieldCheck className="h-3 w-3 text-purple-700" /> Super Admin Console
              </div>
              <h1 className="font-extrabold text-2xl sm:text-3xl text-[#0B1F1D] tracking-tight">
                {currentMeta.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
                {currentMeta.description}
              </p>
            </div>

            <button
              onClick={loadStats}
              disabled={refreshing}
              className="inline-flex items-center gap-2 self-start sm:self-auto text-xs font-bold text-white
              bg-teal-gradient rounded-full px-4 py-2.5 shadow-sm hover:brightness-105 transition-all shrink-0 cursor-pointer"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </button>
          </div>

          {/* Quick Metrics Bar */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Registered Students"
                value={stats.total_users ?? 0}
                caption="Total consumer accounts"
                id="total-users"
                index={0}
              />
              <StatCard
                label="Assessments Finished"
                value={stats.total_assessments ?? stats.assessments_completed ?? stats.total_attempts ?? 0}
                caption="Completed RIASEC tests"
                id="assessments"
                index={1}
              />
              <StatCard
                label="Unlocked Roadmaps"
                value={stats.unlocked_assessments ?? stats.unlocked_reports ?? stats.total_unlocked ?? 0}
                caption="1-credit unlocked reports"
                id="unlocked"
                index={2}
              />
              <StatCard
                label="Platform Revenue"
                value={stats.total_revenue_formatted || `₹${(stats.total_revenue ?? 0).toLocaleString('en-IN')}`}
                caption="Captured Razorpay funds"
                id="revenue"
                index={3}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
