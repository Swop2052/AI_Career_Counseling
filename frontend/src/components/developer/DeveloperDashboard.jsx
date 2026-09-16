import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Layers, TicketPercent, Wallet, Users2, FileText, ShieldCheck } from 'lucide-react';
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
import { isSuperAdmin } from '../../utils/roleUtils';

export default function DeveloperDashboard({ currentUser, onBackToSite, onLogout }) {
  const [section, setSection] = useState('pricing');
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const userIsSuperAdmin = isSuperAdmin(currentUser);

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
    pricing: {
      title: 'Pricing Plans Management',
      description: 'Create, update, or retire assessment pricing plans available in the student checkout flow.',
      Component: PricingPlans,
    },
    campaigns: {
      title: 'Campaign Referral Codes',
      description: 'Generate discount codes, usage limits, and manage partner promotions.',
      Component: CampaignCodes,
    },
    credits: {
      title: 'Student Credit Management',
      description: 'Manually grant or deduct assessment wallet credits with reason verification.',
      Component: CreditAdjustment,
    },
    developers: {
      title: 'User & Role Management',
      description: 'Provision new Developer or Super Admin accounts, monitor invitation delivery via SMTP, and manage system privileges.',
      Component: DeveloperManagement,
    },
    registry: {
      title: 'Registered Student Directory',
      description: 'Complete list of all registered platform students, registration dates, and test history.',
      Component: UserRegistry,
    },
    audit: {
      title: 'System Audit Log',
      description: 'Immutable historical record of financial credit transactions and administrative updates.',
      Component: AuditLog,
    },
  };

  const currentMeta = metaMap[section] || metaMap.pricing;
  const ActiveComponent = currentMeta.Component;

  return (
    <div className="min-h-screen w-full bg-[#E7F7F7]/40 flex flex-col lg:flex-row text-[#0B1F1D]">
      <Sidebar
        active={section}
        onChange={setSection}
        isSuperAdmin={userIsSuperAdmin}
        onBackToSite={onBackToSite}
      />

      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F8FCFC]">
        <Topbar
          user={currentUser}
          isSuperAdmin={userIsSuperAdmin}
          onBackToSite={onBackToSite}
          onLogout={onLogout}
        />

        <div className="w-full px-4 sm:px-8 lg:px-12 py-6 lg:py-8 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 ${
                userIsSuperAdmin ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-[#CFEDED]/60 text-[#04302e]'
              }`}>
                {userIsSuperAdmin ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-purple-700" /> Super Admin Console
                  </>
                ) : (
                  'Developer Console'
                )}
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
                label="Total Registered Users"
                value={stats.total_users ?? 0}
                caption="Registered student accounts"
                id="total-users"
                index={0}
              />
              <StatCard
                label="Assessments Taken"
                value={stats.total_assessments ?? stats.assessments_completed ?? stats.total_attempts ?? 0}
                caption="Completed questionnaires"
                id="assessments"
                index={1}
              />
              <StatCard
                label="Unlocked Reports"
                value={stats.unlocked_assessments ?? stats.unlocked_reports ?? stats.total_unlocked ?? 0}
                caption="Full roadmap unlocks"
                id="unlocked"
                index={2}
              />
              <StatCard
                label="Verified Revenue"
                value={stats.total_revenue_formatted || `₹${(stats.total_revenue ?? 0).toLocaleString('en-IN')}`}
                caption="Captured payments"
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
