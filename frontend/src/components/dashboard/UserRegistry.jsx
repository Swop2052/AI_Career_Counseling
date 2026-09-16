import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Coins, GraduationCap, CalendarDays, RefreshCw, AlertCircle } from 'lucide-react';
import { developerApi } from '../../api/developerApi';
import { inputClasses, Avatar } from './ui';

const ROLE_FILTERS = ['All', 'USER', 'DEVELOPER', 'SUPER_ADMIN'];

export default function UserRegistry() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const loadUsers = () => {
    setLoading(true);
    developerApi.getUsers()
      .then((res) => {
        setUsers(res.users || []);
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        setError('Failed to load user registry from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const name = (u.name || u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const q = query.toLowerCase();
      const matchesQuery = name.includes(q) || email.includes(q);
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            className={`${inputClasses} pl-10`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {ROLE_FILTERS.map((rf) => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === rf ? 'bg-white text-[#04302e] shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {rf}
              </button>
            ))}
          </div>

          <button
            onClick={loadUsers}
            className="p-2 text-gray-500 hover:text-[#09A3A3] hover:bg-[#E7F7F7] rounded-xl transition-colors cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#09A3A3] border-t-transparent rounded-full animate-spin" />
          <span>Loading user accounts from server...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F7F6] border-b border-gray-100 text-[#04302e] font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Assessments</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((u) => {
                  const initials = (u.name || u.full_name || u.email || 'US').slice(0, 2).toUpperCase();
                  const roleBadgeColor =
                    u.role === 'SUPER_ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : u.role === 'DEVELOPER'
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200';

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar initials={initials} size="sm" />
                          <div>
                            <p className="font-bold text-gray-900">{u.name || u.full_name || 'Student Account'}</p>
                            <p className="text-gray-400 font-mono text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${roleBadgeColor}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <span className="flex items-center gap-1">
                          <Coins className="h-3.5 w-3.5 text-[#09A3A3]" />
                          {u.balance !== undefined ? u.balance : (u.wallet_balance !== undefined ? u.wallet_balance : 0)} credits
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                          {u.attempt_count || u.assessments_completed || 0} completed
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-gray-400">
              No matching user accounts found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
