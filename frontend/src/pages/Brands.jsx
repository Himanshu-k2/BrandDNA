import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { brandsAPI } from '../api/brands';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Archive,
  ArrowRight,
  Globe,
  Tag,
  Loader2,
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Brands() {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    primaryColor: '#0f766e',
    secondaryColor: '#14b8a6',
  });

  // Archive state
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const loadBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await brandsAPI.getAll({ search });
      const list = Array.isArray(data) ? data : data?.data || [];
      setBrands(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load brand workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadBrands();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      description: '',
      industry: '',
      website: '',
      primaryColor: '#0f766e',
      secondaryColor: '#14b8a6',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (brand, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      industry: brand.industry || '',
      website: brand.website || '',
      primaryColor: brand.primaryColor || '#0f766e',
      secondaryColor: brand.secondaryColor || '#14b8a6',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingBrand) {
        await brandsAPI.update(editingBrand._id, formData);
        toast.success(`Brand "${formData.name}" updated`);
      } else {
        await brandsAPI.create(formData);
        toast.success(`Brand "${formData.name}" created`);
      }
      setShowModal(false);
      loadBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await brandsAPI.archive(archiveTarget._id);
      toast.success(`Brand "${archiveTarget.name}" archived`);
      setArchiveTarget(null);
      loadBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive brand');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Brand Workspaces
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Isolated environments housing guidelines, approved facts, and terminology.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
            />
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-teal-600/20 flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Brand
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading brand workspaces..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadBrands} />
      ) : brands.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No brand workspaces found"
          description={
            search
              ? `No brands match "${search}". Try clearing your search.`
              : 'Create your first brand workspace to store guidelines, terminology, and facts.'
          }
          action={
            user?.role === 'admin' && (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Brand Workspace
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {brands.map((brand) => {
            const brandId = brand._id || brand.id;
            return (
              <Link
                key={brandId}
                to={`/brands/${brandId}`}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-300 transition-all p-5 flex flex-col justify-between group"
              >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm flex-shrink-0"
                      style={{ backgroundColor: brand.primaryColor || '#0f766e' }}
                    >
                      {brand.name?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-base">
                        {brand.name}
                      </h3>
                      {brand.industry && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Tag className="h-3 w-3" />
                          {brand.industry}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <StatusBadge status={brand.status || 'active'} />
                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => handleOpenEdit(brand, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit brand"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {brand.description && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {brand.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                {brand.website ? (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-slate-400 hover:text-teal-600 flex items-center gap-1 truncate max-w-[160px]"
                  >
                    <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{brand.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                ) : (
                  <span className="text-slate-400">Isolated Workspace</span>
                )}

                <span className="font-bold text-teal-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Enter Workspace
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
        </div>
      )}

      {/* Modal: Create / Edit Brand */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-in">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Create Brand Workspace'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. NovaFit"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Industry / Category
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Health & Fitness"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brand positioning statement..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Official Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono uppercase text-slate-600">
                      {formData.primaryColor}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono uppercase text-slate-600">
                      {formData.secondaryColor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingBrand ? 'Save Changes' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        loading={archiving}
        title="Archive Brand Workspace"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? Its rules and facts will be safely retained in the database.`}
        confirmText="Archive Workspace"
        confirmStyle="warning"
      />
    </div>
  );
}
