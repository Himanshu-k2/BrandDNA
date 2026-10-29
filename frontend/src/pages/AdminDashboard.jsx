import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../api/admin';
import { reviewsAPI } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Building2,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  Activity,
  ClipboardList,
  UserCheck,
  UserX,
  Lock,
  Layers,
  Inbox
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, revRes] = await Promise.all([
        adminAPI.getStats().catch(() => ({ data: {} })),
        adminAPI.getUsers({ limit: 10 }).catch(() => ({ data: { users: [] } })),
        reviewsAPI.getAll({ status: 'pending_approval', limit: 5 }).catch(() => ({ data: { data: [] } }))
      ]);
      setStats(statsRes.data || null);
      setUsers(usersRes.data?.users || []);
      setPendingReviews(revRes.data?.data || []);
    } catch (err) {
      console.warn('[AdminDashboard] Non-critical load issue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminAPI.updateUserStatus(userId, nextStatus);
      toast.success(`Account marked as ${nextStatus}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const metrics = stats?.metrics || {
    totalUsers: 0,
    totalBrands: 0,
    totalReviews: 0,
    pendingApprovals: 0,
    approvedReviews: 0,
    rejectedReviews: 0
  };

  const recentActivity = stats?.recentActivity || [];
  const topViolations = stats?.topViolations || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mb-2">
              <Lock className="h-3.5 w-3.5" />
              Platform Admin & Reviewer Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Enterprise Governance & User Control
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Oversee platform security, manage role assignments, inspect pending reviews for formal approval, and audit system actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/review-queue"
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-navy-950 font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Inbox className="h-4 w-4" /> Open Review Queue ({metrics.pendingApprovals})
            </Link>
            <Link
              to="/admin/users"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20"
            >
              Manage Users
            </Link>
          </div>
        </div>
      </div>

      {/* Platform Real KPI Cards (Live DB Counts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics.totalUsers}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Across all roles</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Brands</span>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics.totalBrands}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Active workspaces</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Submissions</span>
            <FileCheck2 className="h-4 w-4 text-teal-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics.totalReviews}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Total content audits</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Sign-off</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600">{metrics.pendingApprovals}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Requires Reviewer</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600">{metrics.approvedReviews}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Certified copy</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-600">{metrics.rejectedReviews}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Returned with notes</span>
        </div>
      </div>

      {/* Review Queue Triage Strip (Submissions Awaiting Approval) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="h-4 w-4 text-teal-600" /> Review Queue: Submissions Awaiting Approval
            </h2>
            <p className="text-xs text-slate-500">Authorized reviewers verify diff and grant publication sign-off</p>
          </div>
          <Link to="/review-queue" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            View All Pending ({metrics.pendingApprovals}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingReviews.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Zero submissions awaiting approval</p>
            <p className="text-[11px] text-slate-500">All creator submissions have been reviewed and decided.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingReviews.map((rev) => (
              <div key={rev._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{rev.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Pending Sign-off
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Brand: <strong>{rev.brand?.name || 'NovaFit'}</strong> • Submitted by: {rev.submittedBy?.name || 'Creator'} • Version v{rev.currentVersion} • Score: {rev.overallScore || 'N/A'}/100
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/reviews/${rev._id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                  >
                    Inspect Diff & Decide
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User & Role Management Table (First 10 Users) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" /> Registered Users & Role Enforcement
            </h2>
            <p className="text-xs text-slate-500">Assign roles, toggle account activation, and enforce permissions</p>
          </div>
          <Link to="/admin/users" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            Full User Management <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-bold text-slate-800">{u.name}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="admin">Platform Admin</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="brand_manager">Brand Manager</option>
                      <option value="creator">Content Creator</option>
                    </select>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleStatusToggle(u._id, u.status)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        u.status === 'active'
                          ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                          : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics & Platform Audit Log Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rule Violations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Repeated Brand Rule Violations
          </h3>
          <p className="text-xs text-slate-500">Most frequent non-compliance categories across all drafts</p>

          <div className="space-y-3 pt-2">
            {topViolations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Zero violations detected so far</p>
            ) : (
              topViolations.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-800 capitalize">{v.name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    {v.count} violations
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log Feed */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-teal-600" /> Recent Audit Ledger Events
            </h3>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-teal-600 hover:underline">
              Full Ledger
            </Link>
          </div>
          <p className="text-xs text-slate-500">Immutable log of role updates, guideline edits, and sign-offs</p>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No audit activity logged</p>
            ) : (
              recentActivity.map((act) => (
                <div key={act._id} className="py-2.5 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block capitalize">
                      {act.action?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      By {act.userName} ({act.userRole}) • {act.entityName || act.entityType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
