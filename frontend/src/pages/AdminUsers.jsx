import { useState, useEffect } from 'react';
import { adminAPI } from '../api/admin';
import { brandsAPI } from '../api/brands';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  Loader2,
  Building2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserForBrands, setSelectedUserForBrands] = useState(null);
  const [assignedBrandIds, setAssignedBrandIds] = useState([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [userRes, brandRes] = await Promise.all([
        adminAPI.getUsers({ search, role: roleFilter, status: statusFilter }).catch(() => ({ data: { users: [] } })),
        brandsAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);
      setUsers(userRes.data?.users || []);
      setBrands(brandRes.data?.data || []);
    } catch {
      console.warn('[AdminUsers] Load fallback active');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminAPI.updateUserStatus(userId, nextStatus);
      toast.success(`User marked as ${nextStatus}`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const openBrandModal = (targetUser) => {
    setSelectedUserForBrands(targetUser);
    setAssignedBrandIds((targetUser.assignedBrands || []).map((b) => (b._id ? b._id : b)));
  };

  const handleSaveBrands = async () => {
    if (!selectedUserForBrands) return;
    try {
      await adminAPI.updateUserBrands(selectedUserForBrands._id, assignedBrandIds);
      toast.success('Brand permissions updated');
      setSelectedUserForBrands(null);
      loadUsers();
    } catch {
      toast.error('Failed to update brand permissions');
    }
  };

  const toggleBrandSelection = (brandId) => {
    setAssignedBrandIds((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" /> User & Role Management
          </h1>
          <p className="text-xs text-slate-500">
            Control platform role assignments, suspend accounts, and manage multi-brand access
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 self-start sm:self-auto">
          {users.length} Registered Users
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Platform Admin</option>
            <option value="reviewer">Reviewer</option>
            <option value="brand_manager">Brand Manager</option>
            <option value="creator">Content Creator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400">
            No users match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/90 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Brand Access</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="admin">Platform Admin</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="brand_manager">Brand Manager</option>
                        <option value="creator">Content Creator</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
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

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openBrandModal(u)}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Building2 className="h-3 w-3" />
                        {u.assignedBrands?.length || 0} Brands Assigned
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleStatusToggle(u._id, u.status)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
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
        )}
      </div>

      {/* Brand Permission Assignment Modal */}
      {selectedUserForBrands && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Brand Access</h3>
                <p className="text-xs text-slate-500">For {selectedUserForBrands.name}</p>
              </div>
              <button
                onClick={() => setSelectedUserForBrands(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {brands.map((b) => (
                <label
                  key={b._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: b.primaryColor || '#0f766e' }}
                    />
                    <span className="text-xs font-bold text-slate-800">{b.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignedBrandIds.includes(b._id)}
                    onChange={() => toggleBrandSelection(b._id)}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedUserForBrands(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBrands}
                className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
