import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reviewsAPI } from '../api/reviews';
import { brandsAPI } from '../api/brands';
import { useAuth } from '../context/AuthContext';
import {
  PenTool,
  PlusCircle,
  FileCheck2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  RefreshCw,
  UploadCloud,
  FileText,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isDropHover, setIsDropHover] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: revRes }, { data: brandRes }] = await Promise.all([
        reviewsAPI.getAll({ limit: 50 }),
        brandsAPI.getAll()
      ]);
      setReviews(revRes.data || []);
      setBrands(brandRes.data || []);
    } catch {
      toast.error('Failed to load creator dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.content?.toLowerCase().includes(search.toLowerCase()) ||
      r.files?.some((f) => f.filename?.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'needs_changes') {
      return matchesSearch && (r.status === 'needs_changes' || r.status === 'changes_requested');
    }
    if (statusFilter === 'pending_approval') {
      return matchesSearch && (r.status === 'pending_approval' || r.status === 'submitted' || r.status === 'in_review');
    }
    return matchesSearch && r.status === statusFilter;
  });

  // KPI counts
  const draftCount = reviews.filter((r) => r.status === 'draft').length;
  const underReviewCount = reviews.filter((r) => r.status === 'under_review' || r.status === 'analyzing').length;
  const needsChangesCount = reviews.filter((r) => r.status === 'needs_changes' || r.status === 'changes_requested').length;
  const pendingCount = reviews.filter((r) => r.status === 'pending_approval' || r.status === 'submitted' || r.status === 'in_review').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;

  // Status badge styling helper
  const renderStatusBadge = (status) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="h-3 w-3" /> Rejected
        </span>
      );
    }
    if (status === 'pending_approval' || status === 'submitted' || status === 'in_review') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3" /> Pending Approval
        </span>
      );
    }
    if (status === 'needs_changes' || status === 'changes_requested') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
          <AlertTriangle className="h-3 w-3" /> Needs Changes
        </span>
      );
    }
    if (status === 'under_review' || status === 'analyzing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <RefreshCw className="h-3 w-3 animate-spin" /> Under AI Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        Draft
      </span>
    );
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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <PenTool className="h-3.5 w-3.5" />
              Content Creator Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Creator'}!
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Upload marketing brochures (PDF), Word docs (DOCX), plain text (TXT), or ad banners (PNG, WebP) to audit against approved brand guidelines and submit for reviewer sign-off.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/reviews/new"
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-navy-950 font-extrabold text-sm shadow-lg shadow-teal-500/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <PlusCircle className="h-4 w-4" /> Check New Content
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK UPLOAD CONTENT FOR REVIEW CALLOUT */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDropHover(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDropHover(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDropHover(false);
          navigate('/reviews/new');
        }}
        className={`bg-white rounded-2xl border-2 border-dashed p-6 transition-all shadow-xs ${
          isDropHover
            ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-teal-400 bg-white'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Upload Content for Brand Compliance Review
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag and drop files here or start a new compliance check with multiple files
              </p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">PDF</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">DOCX</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">TXT</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">PNG / JPG</span>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">WebP</span>
                <span className="text-[11px] text-slate-400 ml-1">· Up to 15MB each</span>
              </div>
            </div>
          </div>

          <Link
            to="/reviews/new"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all flex-shrink-0"
          >
            <UploadCloud className="h-4 w-4" />
            Browse Files & Start Audit
          </Link>
        </div>
      </div>

      {/* 6-State Workflow KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Draft */}
        <button
          onClick={() => setStatusFilter('draft')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'draft'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">1. Drafts</span>
          <span className="text-xl font-black text-slate-800">{draftCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">In progress</span>
        </button>

        {/* 2. Under AI Review */}
        <button
          onClick={() => setStatusFilter('under_review')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'under_review'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20'
              : 'bg-white border-slate-200/90 hover:border-blue-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block">2. AI Review</span>
          <span className="text-xl font-black text-blue-700">{underReviewCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Automated scan</span>
        </button>

        {/* 3. Needs Changes */}
        <button
          onClick={() => setStatusFilter('needs_changes')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'needs_changes'
              ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/20'
              : 'bg-white border-slate-200/90 hover:border-orange-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 block">3. Needs Changes</span>
          <span className="text-xl font-black text-orange-700">{needsChangesCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Issues to fix</span>
        </button>

        {/* 4. Pending Approval */}
        <button
          onClick={() => setStatusFilter('pending_approval')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'pending_approval'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">4. Pending Sign-off</span>
          <span className="text-xl font-black text-amber-700">{pendingCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">With Reviewer</span>
        </button>

        {/* 5. Approved */}
        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'approved'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200/90 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">5. Approved</span>
          <span className="text-xl font-black text-emerald-700">{approvedCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Ready to publish</span>
        </button>

        {/* 6. Rejected */}
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'rejected'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200/90 hover:border-rose-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">6. Rejected</span>
          <span className="text-xl font-black text-rose-700">{rejectedCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Returned with notes</span>
        </button>
      </div>

      {/* Submissions & Reviews Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Content Submissions</h2>
            <p className="text-xs text-slate-500">Track multi-file diagnostics, reviewer feedback, and revision history</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns or files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <PenTool className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No content found</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 mb-3">
              {statusFilter !== 'all'
                ? `You have zero reviews matching the "${statusFilter}" status.`
                : 'Upload your first PDF brochure, DOCX document, marketing creative, or text copy to audit against official brand rules.'}
            </p>
            <Link
              to="/reviews/new"
              className="px-4 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 inline-block"
            >
              Start New Content Check
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Campaign / File Title</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3">Compliance Score</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Version</th>
                  <th className="py-3 px-3">Reviewer Notes</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((rev) => {
                  const revId = rev._id || rev.id;
                  return (
                    <tr key={revId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/reviews/${revId}`} className="font-bold text-slate-800 hover:text-teal-600">
                            {rev.title}
                          </Link>
                          {rev.files && rev.files.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                              <Paperclip className="h-2.5 w-2.5" />
                              {rev.files.length} file{rev.files.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 truncate max-w-xs block mt-0.5">
                          {rev.content ? `${rev.content.slice(0, 60)}...` : (rev.files?.[0]?.filename || 'Uploaded Document')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-700">{rev.brand?.name || 'NovaFit'}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        {rev.overallScore !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-black text-xs ${
                                rev.overallScore >= 85
                                  ? 'text-emerald-600'
                                  : rev.overallScore >= 70
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {rev.overallScore}/100
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({rev.findings?.length || 0} issues)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Pending Scan</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">{renderStatusBadge(rev.status)}</td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          v{rev.currentVersion || 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 max-w-[200px]">
                        {rev.reviewerNotes ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-1 rounded text-[11px] block truncate font-medium border border-amber-200" title={rev.reviewerNotes}>
                            "{rev.reviewerNotes}"
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <Link
                          to={`/reviews/${revId}`}
                          className="inline-flex items-center gap-1 font-bold text-teal-600 hover:text-teal-700 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                        >
                          Inspect & Edit <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
