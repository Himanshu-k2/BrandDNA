import { useState, useEffect } from 'react';
import { brandsAPI } from '../api/brands';
import {
  Palette,
  Image,
  Type,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BrandManagerAssets() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'logo',
    url: '',
    data: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const { data } = await brandsAPI.getAll();
      const list = data.data || [];
      setBrands(list);
      if (list.length > 0) {
        setSelectedBrand(list[0]);
      }
    } catch {
      toast.error('Failed to load brand assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBrandChange = (brandId) => {
    const b = brands.find((x) => x._id === brandId);
    if (b) setSelectedBrand(b);
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !selectedBrand) {
      toast.error('Asset name is required');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await brandsAPI.addAsset(selectedBrand._id, form);
      toast.success('Asset added to brand library');
      setSelectedBrand({ ...selectedBrand, assets: data.assets });
      setShowModal(false);
      setForm({ name: '', type: 'logo', url: '', data: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!selectedBrand) return;
    try {
      const { data } = await brandsAPI.deleteAsset(selectedBrand._id, assetId);
      toast.success('Asset removed');
      setSelectedBrand({ ...selectedBrand, assets: data.assets });
    } catch {
      toast.error('Failed to remove asset');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const assets = selectedBrand?.assets || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-navy-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <Palette className="h-3.5 w-3.5" />
              Design System & Brand Assets
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Brand Asset Library
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Manage approved logos, official color hex codes, verified typography standards, and official product imagery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {brands.length > 1 && (
              <select
                value={selectedBrand?._id || ''}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="bg-navy-800 text-white border border-navy-700 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-navy-950 font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Asset
            </button>
          </div>
        </div>
      </div>

      {/* Brand Design Specs Overview */}
      {selectedBrand && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colors */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Palette className="h-4 w-4 text-teal-600" /> Core Brand Colors
            </h3>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg shadow-xs border border-slate-200"
                    style={{ backgroundColor: selectedBrand.primaryColor || '#0f766e' }}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Primary Brand Color</span>
                    <span className="text-[11px] text-slate-400 font-mono">{selectedBrand.primaryColor || '#0f766e'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg shadow-xs border border-slate-200"
                    style={{ backgroundColor: selectedBrand.secondaryColor || '#14b8a6' }}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Secondary Accent Color</span>
                    <span className="text-[11px] text-slate-400 font-mono">{selectedBrand.secondaryColor || '#14b8a6'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Type className="h-4 w-4 text-teal-600" /> Typography Standards
            </h3>
            <div className="space-y-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Display / Headings</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">
                  {selectedBrand.fonts?.heading || 'Inter, sans-serif'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Body & Content</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">
                  {selectedBrand.fonts?.primary || 'Plus Jakarta Sans, sans-serif'}
                </span>
              </div>
            </div>
          </div>

          {/* Tone & Style */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Verified Claims ({selectedBrand.officialClaims?.length || 0})
            </h3>
            <div className="space-y-2 pt-1 max-h-36 overflow-y-auto">
              {(selectedBrand.officialClaims || []).map((c, i) => (
                <div key={i} className="text-xs p-2 rounded-lg bg-teal-50 text-teal-900 border border-teal-100 font-medium">
                  "{c.claim}"
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Asset Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Approved Assets Catalog ({assets.length})</h2>

        {assets.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Image className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No assets registered yet</p>
            <p className="text-[11px] text-slate-500 mt-1 mb-3">Add official logos and product photography.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Add First Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset._id}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-teal-300 transition-all bg-white shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {asset.type}
                    </span>
                    <button
                      onClick={() => handleDeleteAsset(asset._id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title="Remove asset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1">{asset.name}</h4>
                  <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{asset.description || 'Brand asset item'}</p>

                  {asset.type === 'color' && asset.data && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg border shadow-xs" style={{ backgroundColor: asset.data }} />
                      <span className="text-xs font-mono font-bold text-slate-700">{asset.data}</span>
                    </div>
                  )}

                  {asset.url && (
                    <div className="h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-2 flex items-center justify-center">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Approved for publishing</span>
                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-600 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      Link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Brand Asset</h3>
            <form onSubmit={handleAddAsset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. NovaFit Vector Logo"
                  className="w-full px-3 py-2 text-sm border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-white"
                >
                  <option value="logo">Logo</option>
                  <option value="color">Color Swatch (Hex code)</option>
                  <option value="product_image">Product Photography / Image</option>
                  <option value="font">Font / Typography</option>
                  <option value="document">Guideline Document</option>
                </select>
              </div>

              {form.type === 'color' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color Hex Code</label>
                  <input
                    type="text"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    placeholder="#f59e0b"
                    className="w-full px-3 py-2 text-sm border rounded-xl font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset URL / Image Link</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Usage Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Official lockup for dark headers and ads"
                  className="w-full p-2.5 text-sm border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
