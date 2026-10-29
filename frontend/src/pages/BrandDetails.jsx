import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { brandsAPI } from '../api/brands';
import { guidelinesAPI } from '../api/guidelines';
import { factsAPI } from '../api/facts';
import { terminologyAPI } from '../api/terminology';
import { reviewsAPI } from '../api/reviews';
import {
  Building2,
  BookOpen,
  Database,
  SpellCheck,
  FileCheck2,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  ExternalLink,
  PlusCircle,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export default function BrandDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [brand, setBrand] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab Data States
  const [guidelines, setGuidelines] = useState([]);
  const [facts, setFacts] = useState([]);
  const [terminology, setTerminology] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Modals for CRUD
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const [guidelineForm, setGuidelineForm] = useState({
    title: '',
    category: 'tone',
    rule: '',
    severity: 'warning',
  });
  const [editingGuideline, setEditingGuideline] = useState(null);

  const [showFactModal, setShowFactModal] = useState(false);
  const [factForm, setFactForm] = useState({
    factKey: '',
    factValue: '',
    category: 'pricing',
    source: '',
  });
  const [editingFact, setEditingFact] = useState(null);

  const [showTermModal, setShowTermModal] = useState(false);
  const [termForm, setTermForm] = useState({
    prohibitedTerm: '',
    preferredTerm: '',
    explanation: '',
  });
  const [editingTerm, setEditingTerm] = useState(null);

  // Delete Confirm Dialog state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Brand and Subresources
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandRes, guideRes, factRes, termRes, revRes] = await Promise.all([
        brandsAPI.getById(id),
        guidelinesAPI.getByBrand(id).catch(() => ({ data: [] })),
        factsAPI.getByBrand(id).catch(() => ({ data: [] })),
        terminologyAPI.getByBrand(id).catch(() => ({ data: [] })),
        reviewsAPI.getAll({ brandId: id }).catch(() => ({ data: { data: [] } })),
      ]);

      setBrand(brandRes.data);
      setGuidelines(Array.isArray(guideRes.data) ? guideRes.data : []);
      setFacts(Array.isArray(factRes.data) ? factRes.data : []);
      setTerminology(Array.isArray(termRes.data) ? termRes.data : []);
      const reviewList = Array.isArray(revRes.data)
        ? revRes.data
        : revRes.data?.data || [];
      setReviews(reviewList);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load brand workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  // GUIDELINE ACTIONS
  const handleSaveGuideline = async (e) => {
    e.preventDefault();
    try {
      if (editingGuideline) {
        await guidelinesAPI.update(editingGuideline._id, guidelineForm);
        toast.success('Guideline updated');
      } else {
        await guidelinesAPI.create(id, guidelineForm);
        toast.success('Guideline created');
      }
      setShowGuidelineModal(false);
      const res = await guidelinesAPI.getByBrand(id);
      setGuidelines(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save guideline');
    }
  };

  // FACT ACTIONS
  const handleSaveFact = async (e) => {
    e.preventDefault();
    try {
      if (editingFact) {
        await factsAPI.update(editingFact._id, factForm);
        toast.success('Approved fact updated');
      } else {
        await factsAPI.create(id, factForm);
        toast.success('Approved fact created');
      }
      setShowFactModal(false);
      const res = await factsAPI.getByBrand(id);
      setFacts(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save fact');
    }
  };

  // TERMINOLOGY ACTIONS
  const handleSaveTerm = async (e) => {
    e.preventDefault();
    try {
      if (editingTerm) {
        await terminologyAPI.update(editingTerm._id, termForm);
        toast.success('Terminology rule updated');
      } else {
        await terminologyAPI.create(id, termForm);
        toast.success('Terminology rule created');
      }
      setShowTermModal(false);
      const res = await terminologyAPI.getByBrand(id);
      setTerminology(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save terminology');
    }
  };

  // DELETE CONFIRMATION
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'guideline') {
        await guidelinesAPI.delete(deleteTarget.item._id);
        setGuidelines(guidelines.filter((g) => g._id !== deleteTarget.item._id));
        toast.success('Guideline deleted');
      } else if (deleteTarget.type === 'fact') {
        await factsAPI.delete(deleteTarget.item._id);
        setFacts(facts.filter((f) => f._id !== deleteTarget.item._id));
        toast.success('Approved fact deleted');
      } else if (deleteTarget.type === 'term') {
        await terminologyAPI.delete(deleteTarget.item._id);
        setTerminology(terminology.filter((t) => t._id !== deleteTarget.item._id));
        toast.success('Terminology rule deleted');
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete operation failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <LoadingState message="Loading workspace assets..." />;
  if (error) return <ErrorState message={error} onRetry={loadAllData} />;
  if (!brand) return <EmptyState title="Brand Workspace not found" />;

  const canManageBrand =
    user?.role === 'admin' || user?.role === 'platform_admin' || user?.role === 'brand_manager';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'guidelines', label: `Guidelines (${guidelines.length})`, icon: BookOpen },
    { id: 'facts', label: `Approved Facts (${facts.length})`, icon: Database },
    { id: 'terminology', label: `Terminology (${terminology.length})`, icon: SpellCheck },
    { id: 'reviews', label: `Content Reviews (${reviews.length})`, icon: FileCheck2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/brands"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
            title="Back to Brands"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-xs"
              style={{ backgroundColor: brand.primaryColor || '#0f766e' }}
            >
              {brand.name?.charAt(0) || 'B'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {brand.name}
                </h1>
                <StatusBadge status={brand.status} />
              </div>
              <p className="text-xs text-slate-500">{brand.industry || 'Workspace'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/reviews/new?brandId=${brand._id}`}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            Check Content Against Brand
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 bg-white rounded-2xl px-3 py-1.5 shadow-2xs">
        <nav className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-teal-50 text-teal-800 shadow-xs border border-teal-200/80'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Brand Identity & Strategy</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {brand.description || 'No description provided for this brand.'}
            </p>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Industry
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">{brand.industry || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Official Website
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {brand.website ? (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:underline inline-flex items-center gap-1"
                    >
                      {brand.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Brand Colors
              </span>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg shadow-2xs border border-slate-200"
                    style={{ backgroundColor: brand.primaryColor || '#0f766e' }}
                  ></div>
                  <span className="text-xs font-mono font-medium text-slate-700">
                    {brand.primaryColor || '#0f766e'} (Primary)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg shadow-2xs border border-slate-200"
                    style={{ backgroundColor: brand.secondaryColor || '#14b8a6' }}
                  ></div>
                  <span className="text-xs font-mono font-medium text-slate-700">
                    {brand.secondaryColor || '#14b8a6'} (Secondary)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Governance Footprint</h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Active Guidelines</span>
                <span className="font-extrabold text-slate-900">{guidelines.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Approved Facts</span>
                <span className="font-extrabold text-slate-900">{facts.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Terminology Rules</span>
                <span className="font-extrabold text-slate-900">{terminology.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Content Reviews Audited</span>
                <span className="font-extrabold text-slate-900">{reviews.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GUIDELINES TAB */}
      {activeTab === 'guidelines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Approved Brand Guidelines</h2>
              <p className="text-xs text-slate-500">
                Core rules enforced during AI tone, messaging, and compliance analysis.
              </p>
            </div>
            {canManageBrand && (
              <button
                onClick={() => {
                  setEditingGuideline(null);
                  setGuidelineForm({
                    title: '',
                    category: 'tone',
                    rule: '',
                    severity: 'warning',
                  });
                  setShowGuidelineModal(true);
                }}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Guideline
              </button>
            )}
          </div>

          {guidelines.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No guidelines created yet"
              description="Define tone of voice, forbidden words, and legal requirements for this brand."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guidelines.map((g) => (
                <div
                  key={g._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{g.title}</h4>
                      <StatusBadge status={g.severity} type="severity" />
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {g.category}
                    </span>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{g.rule}</p>
                  </div>

                  {canManageBrand && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => {
                          setEditingGuideline(g);
                          setGuidelineForm({
                            title: g.title,
                            category: g.category,
                            rule: g.rule,
                            severity: g.severity,
                          });
                          setShowGuidelineModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Edit guideline"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'guideline', item: g })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete guideline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. APPROVED FACTS TAB */}
      {activeTab === 'facts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Approved Facts Database</h2>
              <p className="text-xs text-slate-500">
                Ground-truth database for deterministic price verification and factual claims.
              </p>
            </div>
            {canManageBrand && (
              <button
                onClick={() => {
                  setEditingFact(null);
                  setFactForm({
                    factKey: '',
                    factValue: '',
                    category: 'pricing',
                    source: '',
                  });
                  setShowFactModal(true);
                }}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Approved Fact
              </button>
            )}
          </div>

          {facts.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No approved facts stored"
              description="Add verified pricing rates, specs, and corporate figures to avoid hallucinations."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Fact / Parameter</th>
                    <th className="py-3 px-4">Approved Value</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Source Document</th>
                    {canManageBrand && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {facts.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{f.factKey}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-teal-800 bg-teal-50/30">
                        {f.factValue}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {f.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{f.source || 'Official Database'}</td>
                      {canManageBrand && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingFact(f);
                              setFactForm({
                                factKey: f.factKey,
                                factValue: f.factValue,
                                category: f.category,
                                source: f.source || '',
                              });
                              setShowFactModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors mr-1"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'fact', item: f })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. TERMINOLOGY TAB */}
      {activeTab === 'terminology' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Approved Terminology Rules</h2>
              <p className="text-xs text-slate-500">
                Deterministic dictionary: flags prohibited phrasing and suggests approved alternatives.
              </p>
            </div>
            {canManageBrand && (
              <button
                onClick={() => {
                  setEditingTerm(null);
                  setTermForm({ prohibitedTerm: '', preferredTerm: '', explanation: '' });
                  setShowTermModal(true);
                }}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Term Rule
              </button>
            )}
          </div>

          {terminology.length === 0 ? (
            <EmptyState
              icon={SpellCheck}
              title="No terminology rules configured"
              description="Configure banned vs preferred words (e.g. use 'members' instead of 'users')."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Prohibited Phrasing</th>
                    <th className="py-3 px-4">Mandatory Preferred Term</th>
                    <th className="py-3 px-4">Brand Rationale</th>
                    {canManageBrand && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {terminology.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">
                        "{t.prohibitedTerm}"
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        "{t.preferredTerm}"
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.explanation || 'Preserve corporate brand voice.'}
                      </td>
                      {canManageBrand && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingTerm(t);
                              setTermForm({
                                prohibitedTerm: t.prohibitedTerm,
                                preferredTerm: t.preferredTerm,
                                explanation: t.explanation || '',
                              });
                              setShowTermModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors mr-1"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'term', item: t })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Content Reviews for {brand.name}</h2>
            <Link
              to={`/reviews/new?brandId=${brand._id}`}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Review
            </Link>
          </div>

          {reviews.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="No content reviewed for this brand yet"
              description="Run your first compliance check to identify violations and suggested fixes."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {reviews.map((rev) => (
                <Link
                  key={rev._id}
                  to={`/reviews/${rev._id}`}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors block"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400 capitalize font-medium">
                        {rev.contentType?.replace(/_/g, ' ')}
                      </span>
                      {typeof rev.overallScore === 'number' && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            rev.overallScore >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : rev.overallScore >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rev.overallScore}/100
                        </span>
                      )}
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        {rev.findings?.length || 0} findings
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                      {rev.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Version {rev.currentVersion || 1} · {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={rev.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GUIDELINE MODAL */}
      {showGuidelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-in">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              {editingGuideline ? 'Edit Brand Guideline' : 'Add Brand Guideline'}
            </h2>
            <form onSubmit={handleSaveGuideline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={guidelineForm.title}
                  onChange={(e) => setGuidelineForm({ ...guidelineForm, title: e.target.value })}
                  placeholder="e.g. Tone of Voice: Authoritative"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={guidelineForm.category}
                    onChange={(e) =>
                      setGuidelineForm({ ...guidelineForm, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="tone">Tone</option>
                    <option value="messaging">Messaging</option>
                    <option value="visual">Visual</option>
                    <option value="terminology">Terminology</option>
                    <option value="compliance">Compliance</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={guidelineForm.severity}
                    onChange={(e) =>
                      setGuidelineForm({ ...guidelineForm, severity: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Rule Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={guidelineForm.rule}
                  onChange={(e) => setGuidelineForm({ ...guidelineForm, rule: e.target.value })}
                  placeholder="Describe the exact brand standard..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGuidelineModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  Save Guideline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACT MODAL */}
      {showFactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-in">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              {editingFact ? 'Edit Approved Fact' : 'Add Approved Fact'}
            </h2>
            <form onSubmit={handleSaveFact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Fact Key / Title *
                </label>
                <input
                  type="text"
                  required
                  value={factForm.factKey}
                  onChange={(e) => setFactForm({ ...factForm, factKey: e.target.value })}
                  placeholder="e.g. Monthly Pro Tier Price"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Approved Value *
                </label>
                <input
                  type="text"
                  required
                  value={factForm.factValue}
                  onChange={(e) => setFactForm({ ...factForm, factValue: e.target.value })}
                  placeholder="e.g. ₹999 / month"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={factForm.category}
                    onChange={(e) => setFactForm({ ...factForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="pricing">Pricing</option>
                    <option value="product">Product</option>
                    <option value="company">Company</option>
                    <option value="legal">Legal</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Source Document
                  </label>
                  <input
                    type="text"
                    value={factForm.source}
                    onChange={(e) => setFactForm({ ...factForm, source: e.target.value })}
                    placeholder="e.g. Q1 Master Pricing Sheet"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFactModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMINOLOGY MODAL */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-in">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              {editingTerm ? 'Edit Terminology Rule' : 'Add Terminology Rule'}
            </h2>
            <form onSubmit={handleSaveTerm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Prohibited Term *
                </label>
                <input
                  type="text"
                  required
                  value={termForm.prohibitedTerm}
                  onChange={(e) => setTermForm({ ...termForm, prohibitedTerm: e.target.value })}
                  placeholder="e.g. users"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mandatory Preferred Term *
                </label>
                <input
                  type="text"
                  required
                  value={termForm.preferredTerm}
                  onChange={(e) => setTermForm({ ...termForm, preferredTerm: e.target.value })}
                  placeholder="e.g. members"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Brand Rationale / Explanation
                </label>
                <textarea
                  rows={2}
                  value={termForm.explanation}
                  onChange={(e) => setTermForm({ ...termForm, explanation: e.target.value })}
                  placeholder="Why is this term prohibited for this brand?"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete this ${deleteTarget?.type}?`}
        confirmText="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
