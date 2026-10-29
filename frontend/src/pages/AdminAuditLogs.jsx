import { useState, useEffect } from 'react';
import { adminAPI } from '../api/admin';
import {
  ClipboardList,
  Search,
  Filter,
  ShieldAlert,
  Loader2,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAuditLogs({
        action: actionFilter,
        entityType: entityFilter,
        limit: 100
      });
      setLogs(data.logs || []);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-teal-600" /> Platform Audit Trail & Activity Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Immutable, append-only record of administrative role changes, guideline edits, document uploads, and review approvals
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 self-start sm:self-auto">
          {logs.length} Recorded Events
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Filter by Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Actions</option>
              <option value="user_registered">User Registered</option>
              <option value="user_logged_in">User Logged In</option>
              <option value="user_role_updated">Role Changed</option>
              <option value="user_status_suspended">Account Suspended</option>
              <option value="document_uploaded">Document Uploaded</option>
              <option value="document_extracted_approved">Document Rule Approved</option>
              <option value="review_submitted">Review Submitted</option>
              <option value="review_approved">Review Approved</option>
              <option value="review_rejected">Review Rejected</option>
              <option value="review_changes_requested">Changes Requested</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Filter by Entity</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Entities</option>
              <option value="user">User</option>
              <option value="brand">Brand</option>
              <option value="review">Review</option>
              <option value="document">Document</option>
              <option value="guideline">Guideline</option>
              <option value="fact">Fact</option>
            </select>
          </div>
        </div>

        {(actionFilter !== 'all' || entityFilter !== 'all') && (
          <button
            onClick={() => {
              setActionFilter('all');
              setEntityFilter('all');
            }}
            className="text-xs font-bold text-teal-600 hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400">
            No audit events found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/90 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Actor (User)</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Entity Affected</th>
                  <th className="py-3 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 font-sans">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px] font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block capitalize">
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.userName || 'System'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {log.userRole}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">{log.entityType}</span>
                      {log.entityName || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
