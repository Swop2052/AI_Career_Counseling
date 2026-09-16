import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tags,
  TicketPercent,
  Wallet,
  Users2,
  Compass,
  Menu,
  X,
  Shield,
  FileText,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({ active, onChange, isSuperAdmin = false, onBackToSite }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const developerTabs = [
    { id: 'pricing', label: 'Pricing Plans', icon: Tags },
    { id: 'campaigns', label: 'Campaign Codes', icon: TicketPercent },
    { id: 'credits', label: 'Credit Adjustment', icon: Wallet },
    { id: 'registry', label: 'User Registry', icon: Users2 },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
  ];

  const adminTabs = [
    { id: 'pricing', label: 'Pricing Plans', icon: Tags },
    { id: 'campaigns', label: 'Campaign Codes', icon: TicketPercent },
    { id: 'credits', label: 'Credit Adjustment', icon: Wallet },
    { id: 'developers', label: 'User Management', icon: ShieldCheck },
    { id: 'registry', label: 'User Registry', icon: Users2 },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
  ];

  const tabs = isSuperAdmin ? adminTabs : developerTabs;

  function renderContent(onNav) {
    return (
      <div className="flex flex-col h-full text-white/90 p-5 justify-between">
        <div>
          {/* Brand */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Compass className="h-4 w-4 text-white" strokeWidth={2.2} />
                <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-[#04302e] ${isSuperAdmin ? 'bg-purple-400' : 'bg-amber-400'}`} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate">
                  SkillSense<span className="text-[#CFEDED]">.</span>
                </p>
                <p className="text-[11px] text-white/60 truncate font-semibold">
                  {isSuperAdmin ? 'Super Admin Console' : 'Developer Console'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <p className="text-[10px] font-bold tracking-wider text-white/40 uppercase px-3.5 mb-2">
            Console Navigation
          </p>
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const isActive = active === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onChange(tab.id);
                    if (onNav) onNav();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold
                  text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white shadow-sm font-bold border border-white/15'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? (isSuperAdmin ? 'text-purple-300' : 'text-amber-300') : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Return to website */}
        <div className="pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onBackToSite}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Website</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-teal-gradient min-h-screen">
        {renderContent()}
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between gap-2 bg-teal-gradient px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Compass className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">
            {isSuperAdmin ? 'Super Admin' : 'Developer'}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 rounded-full px-3 py-1.5 cursor-pointer"
        >
          {tabs.find((t) => t.id === active)?.label}
          <Menu className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 z-50 bg-teal-gradient shadow-2xl overflow-hidden"
            >
              <div className="relative h-full">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-3 top-3 p-2 rounded-full bg-white/10 text-white/70 z-10 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                {renderContent(() => setMobileOpen(false))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
