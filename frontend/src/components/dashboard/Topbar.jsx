import React from 'react';
import { Shield, ShieldCheck, ArrowLeft, LogOut, User } from 'lucide-react';

export default function Topbar({ user, isSuperAdmin = false, onBackToSite, onLogout }) {
  const roleName = user?.role || (isSuperAdmin ? 'SUPER_ADMIN' : 'DEVELOPER');
  const userName = user?.name || (isSuperAdmin ? 'Super Administrator' : 'Technical Developer');
  const userEmail = user?.email || 'admin@skillsense.ai';
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="w-full bg-white border-b border-gray-100 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Breadcrumb / Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToSite}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0B1F1D] text-xs font-bold transition-colors cursor-pointer"
          title="Return to Student Website"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Website</span>
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-500">
            System Live (Port 5000)
          </span>
        </div>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-right">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-[#0B1F1D] leading-tight">{userName}</p>
            <p className="text-[10px] text-gray-400 font-mono">{userEmail}</p>
          </div>
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isSuperAdmin
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-teal-50 text-teal-700 border-teal-200'
            }`}
          >
            {roleName}
          </span>
          <div className="h-8 w-8 rounded-full bg-teal-gradient text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {initials}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          title="Sign out of console"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
