import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, RefreshCw, AlertCircle, Shield, Clock } from 'lucide-react';
import { developerApi } from '../../api/developerApi';
import { GhostButton } from './ui';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = () => {
    setLoading(true);
    developerApi.getAuditLogs(150)
      .then((res) => {
        setLogs(res.logs || []);
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load audit logs:', err);
        setError('Failed to load audit logs from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0B1F1D] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#09A3A3]" /> Chronological Audit Log
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable log of all financial credit adjustments, pricing updates, and permissions changes.
          </p>
        </div>
        <GhostButton onClick={loadLogs} className="flex items-center gap-1.5 py-2 px-3 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </GhostButton>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && logs.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#09A3A3] border-t-transparent rounded-full animate-spin" />
          <span>Loading audit log records...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F7F6] border-b border-gray-100 text-[#04302e] font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target Email</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#04302e]">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{log.actor_email || 'System'}</td>
                    <td className="py-3 px-4 text-gray-600">{log.target_email || '—'}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate font-sans text-xs">
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="py-12 text-center text-xs text-gray-400">
              No audit log events recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
