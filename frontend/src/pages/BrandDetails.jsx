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
  DollarSign,
  Filter,
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

  // Facts filter (all vs pricing vs specs)
  const [factFilter, setFactFilter] = useState('all');

  // Modals for CRUD
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const [guidelineForm, setGuidelineForm] = useState({
    title: '',
    category: 'Tone of voice',
    ruleText: '',
    severity: 'medium',
  });
  const [editingGuideline, setEditingGuideline] = useState(null);

  const [showFactModal, setShowFactModal] = useState(false);
  const [factForm, setFactForm] = useState({
    key: '',
    value: '',
    category: 'pricing',
    sourceReference: '',
    description: '',
  });
  const [editingFact, setEditingFact] = useState(null);

  const [showTermModal, setShowTermModal] = useState(false);
  const [termForm, setTermForm] = useState({
    prohibitedTerm: '',
    preferredTerm: '',
    replacementSuggestion: '',
    explanation: '',
  });
  const [editingTerm, setEditingTerm] = useState(null);

  // Delete Confirm Dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
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
        reviewsAPI.getAll({ brandId: id }).catch(() => ({ data: [] })),
      ]);

      const brandData = brandRes.data?.data || brandRes.data;
      setBrand(brandData);

      const guideData = Array.isArray(guideRes.data)
        ? guideRes.data
        : guideRes.data?.data || [];
      setGuidelines(guideData);

      const factData = Array.isArray(factRes.data)
        ? factRes.data
        : factRes.data?.data || [];
      setFacts(factData);

      const termData = Array.isArray(termRes.data)
        ? termRes.data
        : termRes.data?.data || [];
      setTerminology(termData);

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
      const payload = {
        title: guidelineForm.title.trim(),
        category: guidelineForm.category,
        ruleText: guidelineForm.ruleText.trim(),
        severity: guidelineForm.severity,
      };

      if (editingGuideline) {
        await guidelinesAPI.update(editingGuideline._id || editingGuideline.id, payload);
        toast.success('Guideline updated successfully');
      } else {
        await guidelinesAPI.create(id, payload);
        toast.success('Guideline created successfully');
      }
      setShowGuidelineModal(false);
      const res = await guidelinesAPI.getByBrand(id);
      setGuidelines(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save guideline');
    }
  };

  // FACT ACTIONS
  const handleSaveFact = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        key: factForm.key.trim().toLowerCase(),
        value: factForm.value.trim(),
        category: factForm.category,
        sourceReference: factForm.sourceReference.trim() || 'Internal Brand Registry',
        description: factForm.description?.trim() || '',
      };

      if (editingFact) {
        await factsAPI.update(editingFact._id || editingFact.id, payload);
        toast.success('Approved fact updated successfully');
      } else {
        await factsAPI.create(id, payload);
        toast.success('Approved fact created successfully');
      }
      setShowFactModal(false);
      const res = await factsAPI.getByBrand(id);
      setFacts(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save fact');
    }
  };

  // TERMINOLOGY ACTIONS
  const handleSaveTerm = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        prohibitedTerm: termForm.prohibitedTerm.trim(),
        preferredTerm: termForm.preferredTerm.trim(),
        replacementSuggestion: termForm.replacementSuggestion?.trim() || termForm.preferredTerm.trim(),
        explanation: termForm.explanation?.trim() || 'Brand voice compliance',
      };

      if (editingTerm) {
        await terminologyAPI.update(editingTerm._id || editingTerm.id, payload);
        toast.success('Terminology rule updated successfully');
      } else {
        await terminologyAPI.create(id, payload);
        toast.success('Terminology rule created successfully');
      }
      setShowTermModal(false);
      const res = await terminologyAPI.getByBrand(id);
      setTerminology(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save terminology');
    }
  };

  // DELETE CONFIRMATION
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const targetId = deleteTarget.item._id || deleteTarget.item.id;
      if (deleteTarget.type === 'guideline') {
        await guidelinesAPI.delete(targetId);
        setGuidelines((prev) => prev.filter((g) => (g._id || g.id) !== targetId));
        toast.success('Guideline deleted');
      } else if (deleteTarget.type === 'fact') {
        await factsAPI.delete(targetId);
        setFacts((prev) => prev.filter((f) => (f._id || f.id) !== targetId));
        toast.success('Approved fact deleted');
      } else if (deleteTarget.type === 'term') {
        await terminologyAPI.delete(targetId);
        setTerminology((prev) => prev.filter((t) => (t._id || t.id) !== targetId));
        toast.success('Terminology rule deleted');
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete operation failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <LoadingState message="Loading brand knowledge base..." />;
  if (error) return <ErrorState message={error} onRetry={loadAllData} />;
  if (!brand) return <EmptyState title="Brand Workspace not found" />;

  const canManageBrand = user?.role === 'admin' || user?.role === 'brand_manager';

  // Filtered facts
  const displayedFacts =
    factFilter === 'all'
      ? facts
      : factFilter === 'pricing'
      ? facts.filter(
          (f) =>
            f.category === 'pricing' ||
            (f.key || '').includes('price') ||
            (f.key || '').includes('fee') ||
            (f.key || '').includes('subscription')
        )
      : facts.filter((f) => f.category !== 'pricing');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/brands"
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
            title="Back to All Brands"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
            {brand.name?.charAt(0) || 'B'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{brand.name}</h1>
              <StatusBadge status={brand.status || 'active'} />
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {brand.description || 'Enterprise brand knowledge base and governance workspace.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/reviews/new?brandId=${brand._id || brand.id}`}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            Check Content Against {brand.name}
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'guidelines', label: `Guidelines (${guidelines.length})`, icon: BookOpen },
          { id: 'facts', label: `Approved Facts (${facts.length})`, icon: Database },
          { id: 'terminology', label: `Terminology Rules (${terminology.length})`, icon: SpellCheck },
          { id: 'reviews', label: `Review History (${reviews.length})`, icon: FileCheck2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-900 bg-teal-50/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Brand Governance Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Brand Tone of Voice
                  </span>
                  <p className="font-semibold text-slate-800 text-sm">{brand.tone || 'Professional & Consistent'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Industry Sector
                  </span>
                  <p className="font-semibold text-slate-800 text-sm">{brand.industry || 'Technology & Services'}</p>
                </div>
              </div>

              {brand.visualIdentity && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Visual Brand Identity Standards
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Primary Colors:</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {brand.visualIdentity.primaryColors?.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shadow-2xs"
                            style={{ backgroundColor: c }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Prohibited Colors:</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {brand.visualIdentity.prohibitedColors?.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Typography:</span>
                      <p className="font-semibold text-slate-800 mt-1">
                        {brand.visualIdentity.typography?.primaryFont || 'Inter'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900">Knowledge Base Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Active Guidelines</span>
                  <span className="font-extrabold text-slate-900">{guidelines.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Approved Facts</span>
                  <span className="font-extrabold text-slate-900">{facts.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Terminology Rules</span>
                  <span className="font-extrabold text-slate-900">{terminology.length}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Total Reviews</span>
                  <span className="font-extrabold text-slate-900">{reviews.length}</span>
                </div>
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
              <h2 className="text-base font-bold text-slate-900">Brand Guidelines & Rules</h2>
              <p className="text-xs text-slate-500">
                Official rules evaluated during deterministic and AI contextual analysis.
              </p>
            </div>
            {canManageBrand && (
              <button
                onClick={() => {
                  setEditingGuideline(null);
                  setGuidelineForm({
                    title: '',
                    category: 'Tone of voice',
                    ruleText: '',
                    severity: 'medium',
                  });
                  setShowGuidelineModal(true);
                }}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Guideline
              </button>
            )}
          </div>

          {guidelines.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No guidelines configured"
              description="Add your first brand guideline rule to verify copywriting and messaging standards."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guidelines.map((g) => (
                <div
                  key={g._id || g.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{g.title}</h4>
                      <StatusBadge status={g.severity || 'medium'} type="severity" />
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {g.category}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{g.ruleText || g.rule}</p>
                  </div>

                  {canManageBrand && (
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setEditingGuideline(g);
                          setGuidelineForm({
                            title: g.title,
                            category: g.category || 'Tone of voice',
                            ruleText: g.ruleText || g.rule || '',
                            severity: g.severity || 'medium',
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

      {/* 3. APPROVED FACTS TAB (WITH PRICES MANAGEMENT) */}
      {activeTab === 'facts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Approved Facts & Pricing Registry</h2>
              <p className="text-xs text-slate-500">
                Ground-truth database for deterministic price verification and factual claim enforcement.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFactFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    factFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  All ({facts.length})
                </button>
                <button
                  onClick={() => setFactFilter('pricing')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    factFilter === 'pricing' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  <DollarSign className="h-3 w-3" />
                  Prices & Rates
                </button>
                <button
                  onClick={() => setFactFilter('other')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    factFilter === 'other' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Specs & Details
                </button>
              </div>

              {canManageBrand && (
                <button
                  onClick={() => {
                    setEditingFact(null);
                    setFactForm({
                      key: '',
                      value: '',
                      category: factFilter === 'pricing' ? 'pricing' : 'general',
                      sourceReference: '',
                      description: '',
                    });
                    setShowFactModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Approved Fact / Price
                </button>
              )}
            </div>
          </div>

          {displayedFacts.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No facts match the selected filter"
              description="Add verified pricing rates, specifications, and company details to prevent hallucinations."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Fact / Parameter</th>
                    <th className="py-3 px-4">Approved Value</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Source Reference</th>
                    {canManageBrand && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {displayedFacts.map((f) => (
                    <tr key={f._id || f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 capitalize">
                        {(f.key || f.factKey || '').replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800 bg-emerald-50/40">
                        {f.value || f.factValue}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            f.category === 'pricing'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {f.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {f.sourceReference || f.source || 'Official Brand Records'}
                      </td>
                      {canManageBrand && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingFact(f);
                              setFactForm({
                                key: f.key || f.factKey || '',
                                value: f.value || f.factValue || '',
                                category: f.category || 'pricing',
                                sourceReference: f.sourceReference || f.source || '',
                                description: f.description || '',
                              });
                              setShowFactModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors mr-1 cursor-pointer"
                            title="Edit fact"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'fact', item: f })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                            title="Delete fact"
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
                Deterministic dictionary: flags prohibited phrasing and enforces preferred terminology.
              </p>
            </div>
            {canManageBrand && (
              <button
                onClick={() => {
                  setEditingTerm(null);
                  setTermForm({
                    prohibitedTerm: '',
                    preferredTerm: '',
                    replacementSuggestion: '',
                    explanation: '',
                  });
                  setShowTermModal(true);
                }}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
              description="Configure prohibited vs preferred words (e.g. enforce 'members' instead of 'users')."
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
                    <tr key={t._id || t.id} className="hover:bg-slate-50/60 transition-colors">
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
                                replacementSuggestion: t.replacementSuggestion || t.preferredTerm,
                                explanation: t.explanation || '',
                              });
                              setShowTermModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors mr-1 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'term', item: t })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
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
              to={`/reviews/new?brandId=${brand._id || brand.id}`}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
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
                  key={rev._id || rev.id}
                  to={`/reviews/${rev._id || rev.id}`}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors block"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400 capitalize font-medium">
                        {rev.contentType?.replace(/_/g, ' ') || 'Copy'}
                      </span>
                      {typeof rev.summary?.overallScore === 'number' && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            rev.summary.overallScore >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : rev.summary.overallScore >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rev.summary.overallScore}/100
                        </span>
                      )}
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        {rev.findings?.length || 0} findings
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                      {rev.content || '[Document / File Review]'}
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
                  placeholder="e.g. Required Physician Medical Disclaimer"
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
                    onChange={(e) => setGuidelineForm({ ...guidelineForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Tone of voice">Tone of voice</option>
                    <option value="Writing style">Writing style</option>
                    <option value="Messaging">Messaging</option>
                    <option value="Required phrases">Required phrases</option>
                    <option value="Prohibited content">Prohibited content</option>
                    <option value="Claims and disclaimers">Claims and disclaimers</option>
                    <option value="Formatting">Formatting</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={guidelineForm.severity}
                    onChange={(e) => setGuidelineForm({ ...guidelineForm, severity: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Rule Specification *
                </label>
                <textarea
                  rows={3}
                  required
                  value={guidelineForm.ruleText}
                  onChange={(e) => setGuidelineForm({ ...guidelineForm, ruleText: e.target.value })}
                  placeholder="Describe the exact brand standard or required quoted phrase..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-sans"
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
              {editingFact ? 'Edit Approved Fact / Price' : 'Add Approved Fact or Price'}
            </h2>
            <form onSubmit={handleSaveFact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Fact Key / Field Name *
                </label>
                <input
                  type="text"
                  required
                  value={factForm.key}
                  onChange={(e) => setFactForm({ ...factForm, key: e.target.value })}
                  placeholder="e.g. monthly_subscription_price"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Approved Fact / Price Value *
                </label>
                <input
                  type="text"
                  required
                  value={factForm.value}
                  onChange={(e) => setFactForm({ ...factForm, value: e.target.value })}
                  placeholder="e.g. ₹999 or NovaFit Premium"
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
                    <option value="pricing">Pricing & Fees</option>
                    <option value="product">Product Details</option>
                    <option value="specifications">Specifications</option>
                    <option value="legal">Legal & Registration</option>
                    <option value="general">General Corporate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Source Document / Memo
                  </label>
                  <input
                    type="text"
                    value={factForm.sourceReference}
                    onChange={(e) => setFactForm({ ...factForm, sourceReference: e.target.value })}
                    placeholder="e.g. Official Board Memo 2026"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={factForm.description}
                  onChange={(e) => setFactForm({ ...factForm, description: e.target.value })}
                  placeholder="Brief context on when this price or fact applies..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-sans"
                />
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
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-sans"
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
