import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { brandsAPI } from '../api/brands';
import { reviewsAPI } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Palette,
  ExternalLink,
  Layers,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BrandManagerDashboard() {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: brandRes } = await brandsAPI.getAll();
      const brandList = brandRes.data || [];
      setBrands(brandList);

      const active = brandList[0] || null;
      setSelectedBrand(active);

      if (active) {
        const [{ data: docRes }, { data: revRes }] = await Promise.all([
          brandsAPI.getDocuments(active._id),
          reviewsAPI.getAll({ brandId: active._id, limit: 5 })
        ]);
        setDocuments(docRes.documents || []);
        setReviews(revRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load brand manager workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBrandChange = async (brandId) => {
    const brand = brands.find((b) => b._id === brandId);
    if (!brand) return;
    setSelectedBrand(brand);
    try {
      const [{ data: docRes }, { data: revRes }] = await Promise.all([
        brandsAPI.getDocuments(brand._id),
        reviewsAPI.getAll({ brandId: brand._id, limit: 5 })
      ]);
      setDocuments(docRes.documents || []);
      setReviews(revRes.data || []);
    } catch {
      toast.error('Error switching brand');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-navy-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
              <Building2 className="h-3.5 w-3.5" />
              Brand Manager Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {selectedBrand ? selectedBrand.name : 'Brand'} Identity & Governance
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Maintain verified facts, official pricing tiers, brand guidelines, and review staged candidate rules extracted from uploaded PDFs and images.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Brand Switcher */}
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

            <Link
              to="/brand-manager/uploads"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-teal-500 hover:bg-teal-600 text-navy-950 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              Upload PDF Guidelines
            </Link>

            <Link
              to="/brands"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/15 text-white transition-all border border-white/20"
            >
              Manage Rules
            </Link>
          </div>
        </div>
      </div>

      {selectedBrand ? (
        <>
          {/* Brand Identity Overview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Brand Overview</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Core identity, industry positioning, and target community</p>
                </div>
                <Link
                  to={`/brands/${selectedBrand._id}`}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  Edit Profile <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Industry</span>
                  <span className="text-sm font-bold text-slate-800">{selectedBrand.industry || 'Health & Fitness'}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Official Website</span>
                  <a
                    href={selectedBrand.website || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-teal-600 hover:underline truncate block"
                  >
                    {selectedBrand.website || 'https://novafit.in'}
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Target Audience</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedBrand.targetAudience || 'Health-conscious urban professionals, athletic enthusiasts, and dedicated community members.'}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Approved Tone of Voice</span>
                <div className="flex flex-wrap gap-2">
                  {(selectedBrand.toneOfVoice || ['Energizing', 'Direct', 'Science-backed']).map((tone) => (
                    <span
                      key={tone}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 border border-teal-200"
                    >
                      {tone}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Asset & Visual Summary Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-teal-600" /> Brand Assets
                  </h3>
                  <Link to="/brand-manager/assets" className="text-xs font-bold text-teal-600 hover:underline">
                    View Library
                  </Link>
                </div>
                <p className="text-xs text-slate-500 mb-4">Official logos, colors, fonts, and product photography</p>

                {/* Color Swatches */}
                <div className="space-y-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Color Palette</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg shadow-xs border border-slate-200"
                        style={{ backgroundColor: selectedBrand.primaryColor || '#0f766e' }}
                      />
                      <span className="text-xs font-semibold text-slate-700">{selectedBrand.primaryColor || '#0f766e'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg shadow-xs border border-slate-200"
                        style={{ backgroundColor: selectedBrand.secondaryColor || '#14b8a6' }}
                      />
                      <span className="text-xs font-semibold text-slate-700">{selectedBrand.secondaryColor || '#14b8a6'}</span>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Typography</span>
                  <div>Heading: <span className="font-bold">{selectedBrand.fonts?.heading || 'Inter'}</span></div>
                  <div>Body: <span className="font-bold">{selectedBrand.fonts?.primary || 'Plus Jakarta Sans'}</span></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 block mb-2">Total Approved Assets: <strong>{selectedBrand.assets?.length || 3} items</strong></span>
                <Link
                  to="/brand-manager/assets"
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Asset
                </Link>
              </div>
            </div>
          </div>

          {/* Staged Document Extraction Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Brand Guideline Uploads & Staged Extraction</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                    Human-in-the-Loop Verification
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted information requires your explicit approval before adding it to official brand guidelines.
                </p>
              </div>

              <Link
                to="/brand-manager/uploads"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700"
              >
                Open Extraction Studio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No documents uploaded yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 mb-3">
                  Upload brand identity PDFs, slide decks, or cheat sheets to automatically extract candidate rules.
                </p>
                <Link
                  to="/brand-manager/uploads"
                  className="px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Upload First Document
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div key={doc._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{doc.filename}</h4>
                        <p className="text-[11px] text-slate-500">
                          {doc.fileType} • {Math.round((doc.fileSize || 0) / 1024)} KB • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          doc.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : doc.status === 'partially_approved'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : doc.status === 'extracted'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {doc.status}
                      </span>

                      <Link
                        to="/brand-manager/uploads"
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                      >
                        Review Staged Rules
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Content Reviews for this Brand */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Content Reviews ({selectedBrand.name})</h2>
                <p className="text-xs text-slate-500">Marketing submissions evaluated against official guidelines</p>
              </div>
              <Link to="/reviews" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No content reviews created yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev._id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{rev.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        By {rev.submittedBy?.name || 'Creator'} • Version v{rev.currentVersion} • Score: {rev.overallScore || 'N/A'}/100
                      </p>
                    </div>
                    <Link
                      to={`/reviews/${rev._id}`}
                      className="text-xs font-bold text-slate-600 hover:text-teal-600 px-2.5 py-1 rounded border border-slate-200"
                    >
                      Inspect Diff
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Brand Workspace Assigned</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create your first brand profile to set up official facts, guidelines, and uploaded documents.
          </p>
          <Link
            to="/brands"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
          >
            Create Brand Profile
          </Link>
        </div>
      )}
    </div>
  );
}
