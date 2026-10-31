import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../api/reviews';
import { commentsAPI } from '../api/comments';
import {
  ArrowLeft,
  Building2,
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  MessageSquare,
  History,
  ShieldCheck,
  Loader2,
  Clock,
  Sparkles,
  Layers,
  FileEdit,
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Trash2,
  X,
  GitCompare,
  Check,
  AlertCircle,
  Cpu,
  TrendingUp,
  Download,
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import ReviewFinding from '../components/ReviewFinding';
import toast from 'react-hot-toast';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function ReviewDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [review, setReview] = useState(null);
  const [comments, setComments] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active sub-tab: 'findings' | 'compare' | 'revisions' | 'comments' | 'audit'
  const [activeTab, setActiveTab] = useState('findings');

  // Category filter for findings
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Revision creation state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisedContent, setRevisedContent] = useState('');
  const [revisedFiles, setRevisedFiles] = useState([]);
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Version comparison state
  const [compareV1, setCompareV1] = useState(1);
  const [compareV2, setCompareV2] = useState(2);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Workflow actions modals: 'approve' | 'request-changes' | 'reject' | 'submit'
  const [actionModal, setActionModal] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Inspect Extracted File Text Modal
  const [inspectModalFile, setInspectModalFile] = useState(null);

  // Image lightbox modal
  const [lightboxImage, setLightboxImage] = useState(null);

  // New Comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const revisionFileInputRef = useRef(null);
  const revisionFormRef = useRef(null);
  const [showPartialBanner, setShowPartialBanner] = useState(true);

  const loadReviewData = async () => {
    if (!id || id === 'undefined') {
      setError('Invalid or missing review ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [revRes, comRes, auditRes, revHistRes] = await Promise.all([
        reviewsAPI.getById(id),
        commentsAPI.getByReview(id).catch(() => ({ data: [] })),
        reviewsAPI.getAuditTrail(id).catch(() => ({ data: [] })),
        reviewsAPI.getRevisions(id).catch(() => ({ data: [] })),
      ]);

      const reviewData = revRes.data?.data || revRes.data;
      setReview(reviewData);
      setRevisedContent(reviewData?.content || '');

      const commentList = Array.isArray(comRes.data) ? comRes.data : comRes.data?.data || [];
      setComments(commentList);

      const auditList = Array.isArray(auditRes.data) ? auditRes.data : auditRes.data?.data || [];
      setAuditTrail(auditList);

      const revList = Array.isArray(revHistRes.data)
        ? revHistRes.data
        : revHistRes.data?.revisions || revHistRes.data?.data || [];
      setRevisions(revList);

      // Default comparison versions if multiple revisions exist
      if (reviewData?.currentVersion > 1) {
        setCompareV1(reviewData.currentVersion - 1);
        setCompareV2(reviewData.currentVersion);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewData();
  }, [id]);

  // Load Revision Comparison
  const handleLoadComparison = async (v1Num, v2Num) => {
    const v1 = v1Num || compareV1;
    const v2 = v2Num || compareV2;
    setLoadingComparison(true);
    try {
      const res = await reviewsAPI.compareRevisions(id, v1, v2);
      setComparisonData(res.data?.data || res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to compare revisions');
    } finally {
      setLoadingComparison(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'compare' && id) {
      handleLoadComparison();
    }
  }, [activeTab, compareV1, compareV2]);

  // WORKFLOW ACTION HANDLER
  const handleWorkflowAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      if (actionModal === 'submit') {
        await reviewsAPI.submit(id);
        toast.success('Submitted for authorized reviewer sign-off');
      } else if (actionModal === 'approve') {
        await reviewsAPI.approve(id, { comment: actionNotes });
        toast.success('Content officially approved for publication');
      } else if (actionModal === 'request-changes') {
        if (!actionNotes.trim()) {
          toast.error('Please specify what changes are needed');
          setActionLoading(false);
          return;
        }
        await reviewsAPI.requestChanges(id, { reason: actionNotes });
        toast.success('Changes requested from author');
      } else if (actionModal === 'reject') {
        if (!actionNotes.trim()) {
          toast.error('Please specify a rejection reason');
          setActionLoading(false);
          return;
        }
        await reviewsAPI.reject(id, { reason: actionNotes });
        toast.success('Content rejected');
      }

      setActionModal(null);
      setActionNotes('');
      await loadReviewData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevisionFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newItems = files.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        rawFile: file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      }));
      setRevisedFiles((prev) => [...prev, ...newItems]);
      e.target.value = '';
    }
  };

  // REVISION SUBMIT
  const handleCreateRevision = async (e) => {
    e.preventDefault();
    const hasText = revisedContent && revisedContent.trim().length > 0;
    const hasFiles = revisedFiles.length > 0;

    if (!hasText && !hasFiles) {
      toast.error('Content or attached files are required for revision');
      return;
    }

    setSubmittingRevision(true);
    try {
      if (hasFiles && revisedFiles[0]?.rawFile) {
        const formData = new FormData();
        formData.append('file', revisedFiles[0].rawFile);
        formData.append('content', revisedContent.trim());
        formData.append('submissionNote', `Revision v${(review.currentVersion || 1) + 1}`);

        await reviewsAPI.uploadRevision(id, formData);
      } else {
        await reviewsAPI.createRevision(id, {
          content: revisedContent.trim(),
          submissionNote: `Revision v${(review.currentVersion || 1) + 1}`,
        });
      }

      toast.success(`Revision v${(review.currentVersion || 1) + 1} analyzed successfully`);
      setShowRevisionForm(false);
      setRevisedFiles([]);
      await loadReviewData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save revision');
    } finally {
      setSubmittingRevision(false);
    }
  };

    // COMPREHENSIVE FINDING CORRECTION ENGINE
  const computeCorrection = (finding, currentText) => {
    let current = (currentText || '').trim();
    const type = finding.type || '';
    const category = (finding.category || '').toLowerCase();
    const suggestion = (finding.suggestedCorrection || finding.suggestion || '').trim();
    const expected = (finding.expectedValue || finding.preferredTerm || '').trim();
    const detected = (finding.detectedValue || finding.problematicText || finding.originalText || '').trim();
    const problematic = (finding.problematicText || finding.originalText || '').trim();

    // CASE 1: Missing Required Phrase / Disclaimer / Boilerplate
    if (
      type === 'required_phrase_missing' ||
      detected.toLowerCase().includes('missing') ||
      category.includes('disclaimer') ||
      !problematic
    ) {
      let phraseToAdd = expected.replace(/^[\"']|[\"']$/g, '').trim();
      if (!phraseToAdd && suggestion) {
        const match = suggestion.match(/["']([^"']{3,})["']/);
        if (match && match[1]) {
          phraseToAdd = match[1].trim();
        }
      }
      if (!phraseToAdd) {
        phraseToAdd = suggestion
          .replace(/^include\s+/i, '')
          .replace(/\s+in the copy\.?$/i, '')
          .replace(/^[\"']|[\"']$/g, '')
          .trim();
      }

      if (!phraseToAdd) {
        return { success: false, reason: 'Could not extract required phrase to add.', text: current };
      }

      if (current.toLowerCase().includes(phraseToAdd.toLowerCase())) {
        return {
          success: true,
          alreadyApplied: true,
          message: 'Disclaimer "' + phraseToAdd + '" is already present in your draft copy.',
          text: current,
        };
      }

      const newText = current ? (current + '\n\n' + phraseToAdd) : phraseToAdd;
      return {
        success: true,
        alreadyApplied: false,
        message: 'Added required disclaimer: "' + phraseToAdd + '"',
        text: newText,
      };
    }

    // CASE 2: Visual / Image Only Assets
    if (
      category.includes('visual') ||
      category.includes('asset') ||
      finding.location?.toLowerCase().includes('color') ||
      finding.location?.toLowerCase().includes('image')
    ) {
      return {
        success: false,
        reason: 'Visual asset finding: Please update the uploaded image file directly.',
        text: current,
      };
    }

    // CASE 3: Replacement (Pricing, Terminology, Claim, Guideline)
    let replacement = expected.replace(/^[\"']|[\"']$/g, '').trim();
    if (!replacement && suggestion) {
      const match = suggestion.match(/["']([^"']+)["']/);
      if (match && match[1]) {
        replacement = match[1].trim();
      } else if (suggestion.toLowerCase().includes(' with ')) {
        const parts = suggestion.split(/ with /i);
        if (parts[1]) {
          replacement = parts[1].replace(/[\.]$/, '').trim();
        }
      }
    }

    if (!replacement) {
      return { success: false, reason: 'No clean replacement value found.', text: current };
    }

    const target = problematic || detected;

    // A. Already replaced check
    if (!current.includes(target) && current.includes(replacement)) {
      return {
        success: true,
        alreadyApplied: true,
        message: '"' + replacement + '" is already applied in your revision draft.',
        text: current,
      };
    }

    // B. Exact match
    if (current.includes(target)) {
      const updated = current.split(target).join(replacement);
      return {
        success: true,
        alreadyApplied: false,
        message: 'Replaced "' + target + '" with "' + replacement + '".',
        text: updated,
      };
    }

    // C. Whole-word / Case-insensitive regex match
    try {
      const escaped = target.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
      const wordRegex = new RegExp('\\b' + escaped + '\\b', 'gi');
      if (wordRegex.test(current)) {
        const updated = current.replace(wordRegex, replacement);
        return {
          success: true,
          alreadyApplied: false,
          message: 'Replaced "' + target + '" with "' + replacement + '".',
          text: updated,
        };
      }

      const looseRegex = new RegExp(escaped, 'gi');
      if (looseRegex.test(current)) {
        const updated = current.replace(looseRegex, replacement);
        return {
          success: true,
          alreadyApplied: false,
          message: 'Replaced "' + target + '" with "' + replacement + '".',
          text: updated,
        };
      }
    } catch (e) {}

    // D. Numeric / Currency variations (e.g. 799 vs ₹799 vs Rs 799)
    const digits = target.replace(/[^\d]/g, '');
    if (digits && digits.length >= 2) {
      const priceRegex = new RegExp('([₹$€£]|rs\\.?\\s*)?\\b' + digits + '\\b', 'gi');
      if (priceRegex.test(current)) {
        const updated = current.replace(priceRegex, replacement);
        return {
          success: true,
          alreadyApplied: false,
          message: 'Replaced price "' + target + '" with "' + replacement + '".',
          text: updated,
        };
      }
    }

    // E. Fallback append
    const updated = current ? (current + '\n' + replacement) : replacement;
    return {
      success: true,
      alreadyApplied: false,
      message: 'Appended approved value "' + replacement + '" to draft copy.',
      text: updated,
    };
  };

  // APPLY SINGLE FINDING
  const handleApplySuggestion = (finding) => {
    const currentBase = revisedContent || review?.content || '';
    const res = computeCorrection(finding, currentBase);

    if (!res.success) {
      toast.error(res.reason || 'Could not apply suggestion automatically');
      return;
    }

    setRevisedContent(res.text);
    setShowRevisionForm(true);

    if (res.alreadyApplied) {
      toast(res.message, { icon: 'ℹ️', duration: 4000 });
    } else {
      toast.success(res.message + ' Click "Save & Re-run Analysis" to verify fixes!', {
        duration: 6000,
      });
    }

    setTimeout(() => {
      revisionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // BATCH APPLY ALL FIXES
  const handleApplyAllFixes = () => {
    let current = revisedContent || review?.content || '';
    let appliedCount = 0;
    const fixableFindings = displayedFindings.filter(
      (f) => !f.category?.toLowerCase().includes('visual') && !f.location?.toLowerCase().includes('image')
    );

    if (fixableFindings.length === 0) {
      toast('No auto-fixable text findings in this category', { icon: 'ℹ️' });
      return;
    }

    for (const finding of fixableFindings) {
      const res = computeCorrection(finding, current);
      if (res.success && !res.alreadyApplied) {
        current = res.text;
        appliedCount++;
      }
    }

    if (appliedCount === 0) {
      toast('All available corrections are already applied in your draft!', { icon: '✓' });
    } else {
      setRevisedContent(current);
      setShowRevisionForm(true);
      toast.success('Applied ' + appliedCount + ' correction(s) to draft! Click "Save & Re-run Analysis" below to create Version ' + ((review.currentVersion || 1) + 1), {
        duration: 7000,
      });
      setTimeout(() => {
        revisionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // COMMENT SUBMIT
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await commentsAPI.create(id, { body: newComment.trim() });
      const created = data?.data || data;
      setComments((prev) => [...prev, created]);
      setNewComment('');
      toast.success('Comment posted to review discussion');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <LoadingState message="Auditing content against brand specifications..." />;
  if (error) return <ErrorState message={error} onRetry={loadReviewData} />;
  if (!review) return <div className="text-center py-12">Review record not found</div>;

  const authorId = review.submittedBy?._id || review.submittedBy?.id || review.submittedBy;
  const currentUserId = user?._id || user?.id;
  const isAuthor = String(authorId) === String(currentUserId);
  const isReviewerOrAdmin = user?.role === 'reviewer' || user?.role === 'admin';

  // Role permissions
  const canSubmitForApproval =
    (isAuthor || user?.role === 'admin') &&
    ['draft', 'needs_changes', 'rejected', 'analyzing'].includes(review.status);

  // Self-approval guard: Creator cannot approve their own content unless admin
  const isSelfApprovalBlocked = isAuthor && user?.role === 'reviewer';

  const canMakeDecision =
    isReviewerOrAdmin &&
    !isSelfApprovalBlocked &&
    ['pending_approval'].includes(review.status);

  const canRevise =
    (isAuthor || user?.role === 'admin') &&
    ['draft', 'needs_changes', 'rejected', 'pending_approval', 'analyzing'].includes(review.status);

  // Findings categorisation & filtering
  const allFindings = review.findings || [];
  const categoriesList = ['all', ...new Set(allFindings.map((f) => f.category || 'General').filter(Boolean))];
  const displayedFindings =
    selectedCategory === 'all'
      ? allFindings
      : allFindings.filter((f) => (f.category || 'General').toLowerCase() === selectedCategory.toLowerCase());

  const score = review.summary?.overallScore ?? 100;
  const isPartial = review.isPartialAnalysis || review.analysisCompletionStatus === 'partial';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to={user?.role === 'reviewer' ? '/review-queue' : '/reviews'}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
            title="Back to Reviews"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-900 text-lg">
                Review: {review.brand?.name || 'Brand Review'}
              </span>
              <StatusBadge status={review.status} />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                v{review.currentVersion || 1}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  score >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : score >= 60
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                Compliance Score: {score}/100
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authored by <strong className="text-slate-700">{review.submittedBy?.name || 'Creator'}</strong> · Format:{' '}
              <span className="capitalize">{review.contentType?.replace(/_/g, ' ') || 'Copy'}</span> ·{' '}
              {new Date(review.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canRevise && (
            <button
              onClick={() => setShowRevisionForm(!showRevisionForm)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileEdit className="h-4 w-4 text-slate-500" />
              {showRevisionForm ? 'Hide Editor' : 'Edit & Revise (v' + ((review.currentVersion || 1) + 1) + ')'}
            </button>
          )}

          {canSubmitForApproval && (
            <button
              onClick={() => setActionModal('submit')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Submit for Approval
            </button>
          )}

          {isSelfApprovalBlocked && review.status === 'pending_approval' && (
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200"
              title="Creators cannot approve their own content. Another reviewer or admin must sign off."
            >
              Self-approval restricted
            </span>
          )}

          {canMakeDecision && (
            <>
              <button
                onClick={() => setActionModal('request-changes')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Request Changes
              </button>
              <button
                onClick={() => setActionModal('reject')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
              <button
                onClick={() => setActionModal('approve')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Content
              </button>
            </>
          )}
        </div>
      </div>

      {/* Partial Analysis Fallback Banner */}
      {isPartial && showPartialBanner && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <h5 className="font-bold text-amber-950">Deterministic Rule Analysis Active (Partial Analysis)</h5>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Review completed using 100% deterministic rule checks against approved brand guidelines, verified pricing,
                and terminology rules. (Gemini AI key is not configured in local environment; all verified brand rules remain strictly enforced).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPartialBanner(false)}
            className="text-amber-600 hover:text-amber-800 text-xs font-bold px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Decision / Reviewer Notes Callout */}
      {review.decision?.reason && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-900 flex items-start gap-3">
          {review.decision.status === 'approved' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : review.decision.status === 'rejected' ? (
            <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          ) : (
            <RotateCcw className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-slate-900 capitalize">
              Decision Note ({review.decision.status?.replace(/_/g, ' ')}):
            </p>
            <p className="mt-0.5 leading-relaxed text-slate-700">{review.decision.reason}</p>
            {review.decision.decidedAt && (
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                Recorded on {new Date(review.decision.decidedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* REVISION EDITOR FORM */}
      {showRevisionForm && (
        <div ref={revisionFormRef} className="bg-white rounded-2xl border-2 border-teal-500/80 p-5 shadow-lg space-y-4 animate-scale-in">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <span>
                <strong>Correction applied to draft!</strong> Review your edited text below, then click{' '}
                <strong className="underline text-teal-700">Save & Re-run Analysis</strong> to create Version {(review.currentVersion || 1) + 1} and verify all compliance fixes.
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-teal-600" />
              Revise Content (Will create immutable Version {(review.currentVersion || 1) + 1})
            </h3>
            <span className="text-xs text-slate-400">
              Preserves previous revisions and re-runs deterministic & AI governance checks
            </span>
          </div>

          <form onSubmit={handleCreateRevision} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Draft Text Copy
              </label>
              <textarea
                rows={5}
                value={revisedContent}
                onChange={(e) => setRevisedContent(e.target.value)}
                placeholder="Edit copy here or click 'Apply' on any finding below..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <UploadCloud className="h-3.5 w-3.5 text-teal-600" />
                Attach Replacement File (PDF / Image) for v{(review.currentVersion || 1) + 1}
              </label>
              <input
                ref={revisionFileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleRevisionFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => revisionFileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-dashed border-slate-300 hover:border-teal-500 text-slate-600 hover:text-teal-600 bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Browse & Attach Replacement Document or Image
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/test_instagram_post_revised.png');
                    const blob = await res.blob();
                    const file = new File([blob], 'novafit_instagram_post_revised.png', { type: 'image/png' });
                    setRevisedFiles([{
                      id: 'revised-demo-' + Date.now(),
                      rawFile: file,
                      name: file.name,
                      size: file.size,
                      type: 'image/png',
                      previewUrl: URL.createObjectURL(file)
                    }]);
                    setRevisedContent("Calling all members! Unlock your summer fitness transformation today. Summer Bootcamp Pro Pass now ₹999/month. Certified Trainers & 30-Day Money-Back Guarantee.");
                    toast.success('Attached compliant revised image (v2) with approved pricing ₹999 and "members" terminology!');
                  } catch (e) {
                    toast.error('Could not load revised asset');
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Quick demo: attach pre-built compliant revised graphic"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Attach Revised Compliant Image (v2) ✨
              </button>

              {revisedFiles.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {revisedFiles.map((rf) => (
                    <span
                      key={rf.id}
                      className="px-2 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-medium border border-teal-200 flex items-center gap-1.5"
                    >
                      {rf.name} ({formatFileSize(rf.size)})
                      <button
                        type="button"
                        onClick={() => setRevisedFiles((prev) => prev.filter((p) => p.id !== rf.id))}
                        className="text-teal-600 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRevisionForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRevision}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {submittingRevision ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Re-analyzing Rules & Standards...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Save & Re-run Analysis
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Content + Sub-tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Revision Comparison Banner */}
          {review.currentVersion > 1 && (
            <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <GitCompare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Multiple Creative Iterations Available (Active: v{review.currentVersion})
                  </p>
                  <p className="text-xs text-slate-500">
                    Compare the previous creative asset with the revised image side-by-side.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('compare');
                  handleLoadComparison(review.currentVersion - 1, review.currentVersion);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <GitCompare className="h-3.5 w-3.5" />
                Compare Images Side-by-Side →
              </button>
            </div>
          )}
          {/* Creative Media & Instagram Post Inspector */}
          {(review.fileAsset || review.content?.includes('.png') || review.content?.includes('novafit_instagram')) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                    {review.fileAsset.mimeType?.startsWith('image') || review.fileAsset.originalName?.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                      <ImageIcon className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        {review.fileAsset.mimeType?.startsWith('image') || review.fileAsset.originalName?.match(/\.(png|jpg|jpeg|webp)$/i)
                          ? 'Creative Asset & Instagram Post Inspector'
                          : 'Uploaded Document Asset'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                        {review.fileAsset.originalName?.split('.').pop() || 'Asset'}
                      </span>
                      {review.fileAsset.extractedText && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Text Extracted & Audited
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {review.fileAsset.originalName || 'Creative Graphic'} · {formatFileSize(review.fileAsset.fileSize)}
                      {review.fileAsset.dimensions?.width && review.fileAsset.dimensions?.height && (
                        <span> · {review.fileAsset.dimensions.width} × {review.fileAsset.dimensions.height} px</span>
                      )}
                      {review.fileAsset.pageCount && (
                        <span> · {review.fileAsset.pageCount} page(s)</span>
                      )}
                    </p>
                  </div>
                </div>

                {review.fileAsset.dataUrl && (
                  <a
                    href={review.fileAsset.dataUrl}
                    download={review.fileAsset.originalName || 'creative-asset'}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Asset
                  </a>
                )}
              </div>

              {/* Visual Preview / Instagram Post Frame */}
              <div className="relative rounded-xl border border-slate-200 bg-slate-900/5 p-4 flex flex-col items-center justify-center overflow-hidden">
                <div className="relative group max-w-full">
                  <img
                    src={
                      review.fileAsset?.dataUrl ||
                      (review.currentVersion > 1 ? '/test_instagram_post_revised.png' : '/test_instagram_post.png')
                    }
                    alt={review.fileAsset?.originalName || 'Creative preview'}
                    className="max-h-[460px] w-auto rounded-lg object-contain border border-slate-200 shadow-md bg-white transition-transform duration-200 group-hover:scale-[1.01]"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className="px-2 py-1 rounded bg-black/75 backdrop-blur-xs text-white text-[11px] font-mono">
                      {review.fileAsset?.dimensions?.width ? `${review.fileAsset.dimensions.width} × ${review.fileAsset.dimensions.height} px` : '1080 × 1080 px'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extracted In-Image OCR Text */}
              {review.fileAsset.extractedText && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                      Detected Text in Asset (Vision / OCR Transcription)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(review.fileAsset.extractedText);
                        toast.success('Extracted text copied to clipboard');
                      }}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 cursor-pointer flex items-center gap-1"
                    >
                      Copy Text
                    </button>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
                    {review.fileAsset.extractedText}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    💡 BrandDNA automatically read and compared this text against brand guidelines, prohibited terms, and approved pricing.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submitted Content Display */}
          {review.content && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Content (Version {review.currentVersion || 1})
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {review.content.length} characters
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
                {review.content}
              </p>
            </div>
          )}

          {/* Sub-tabs Navigation */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="border-b border-slate-200 px-4 py-2 bg-slate-50/70 flex gap-1 flex-wrap">
              <button
                onClick={() => setActiveTab('findings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'findings' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Compliance Findings ({allFindings.length})
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'compare' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <GitCompare className="h-3 w-3" />
                Compare Versions
              </button>
              <button
                onClick={() => setActiveTab('revisions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'revisions' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Revision History ({revisions.length || 1})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'comments' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Discussion ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'audit' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Audit Trail ({auditTrail.length})
              </button>
            </div>

            <div className="p-5">
              {/* TAB 1: FINDINGS */}
              {activeTab === 'findings' && (
                <div className="space-y-4">
                  {/* Category Pills & Severity Summary */}
                  {allFindings.length > 0 && (
                    <div className="space-y-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-slate-700">Filter by Category:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {categoriesList.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                                selectedCategory.toLowerCase() === cat.toLowerCase()
                                  ? 'bg-teal-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs flex-wrap pt-1 text-slate-600">
                        <span>Severity summary:</span>
                        {review.summary?.criticalSeverityCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md font-bold bg-rose-100 text-rose-800">
                            {review.summary.criticalSeverityCount} Critical
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {review.summary?.highSeverityCount || 0} High
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {review.summary?.mediumSeverityCount || 0} Medium
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          {review.summary?.lowSeverityCount || 0} Low
                        </span>
                      </div>
                    </div>
                  )}

                  {displayedFindings.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-bold text-emerald-900 text-sm">100% Brand Compliant</h4>
                      <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
                        No prohibited terms, outdated pricing, unverified claims, or guideline violations detected.
                      </p>
                    </div>
                  ) : (
                    displayedFindings.map((finding, idx) => (
                      <ReviewFinding
                        key={finding.findingId || finding._id || idx}
                        finding={finding}
                        onApply={canRevise ? handleApplySuggestion : null}
                      />
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: VERSION COMPARISON */}
              {activeTab === 'compare' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <GitCompare className="h-4 w-4 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800">Select Versions to Compare:</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <label className="font-medium text-slate-600">Base v</label>
                      <select
                        value={compareV1}
                        onChange={(e) => setCompareV1(parseInt(e.target.value, 10))}
                        className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold"
                      >
                        {Array.from({ length: review.currentVersion || 1 }, (_, i) => i + 1).map((v) => (
                          <option key={v} value={v}>
                            Version {v}
                          </option>
                        ))}
                      </select>

                      <span className="text-slate-400">vs</span>

                      <label className="font-medium text-slate-600">Target v</label>
                      <select
                        value={compareV2}
                        onChange={(e) => setCompareV2(parseInt(e.target.value, 10))}
                        className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold"
                      >
                        {Array.from({ length: review.currentVersion || 1 }, (_, i) => i + 1).map((v) => (
                          <option key={v} value={v}>
                            Version {v}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleLoadComparison(compareV1, compareV2)}
                        disabled={loadingComparison}
                        className="px-3 py-1 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 cursor-pointer"
                      >
                        {loadingComparison ? 'Comparing...' : 'Compare'}
                      </button>
                    </div>
                  </div>

                  {loadingComparison ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-teal-600" />
                      Computing line-by-line diff and findings difference...
                    </div>
                  ) : comparisonData ? (
                    <div className="space-y-4">
                      {/* Diff Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <span className="text-emerald-700 block font-semibold">Lines Added</span>
                          <span className="text-lg font-extrabold text-emerald-900">
                            +{comparisonData.diffSummary?.linesAdded || 0}
                          </span>
                        </div>
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                          <span className="text-rose-700 block font-semibold">Lines Removed</span>
                          <span className="text-lg font-extrabold text-rose-900">
                            -{comparisonData.diffSummary?.linesRemoved || 0}
                          </span>
                        </div>
                        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                          <span className="text-sky-700 block font-semibold">Issues Resolved</span>
                          <span className="text-lg font-extrabold text-sky-900">
                            {comparisonData.findingsComparison?.resolved?.length || 0}
                          </span>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                          <span className="text-purple-700 block font-semibold">Score Delta</span>
                          <span className="text-lg font-extrabold text-purple-900">
                            {comparisonData.diffSummary?.scoreDelta >= 0 ? '+' : ''}
                            {comparisonData.diffSummary?.scoreDelta || 0} pts
                          </span>
                        </div>
                      </div>

                      {/* Visual Asset Side-by-Side Comparison */}
                      {(() => {
                        const rev1 = revisions.find((r) => r.versionNumber === (comparisonData.v1?.versionNumber || compareV1));
                        const rev2 = revisions.find((r) => r.versionNumber === (comparisonData.v2?.versionNumber || compareV2));

                        let v1Img = comparisonData.v1?.fileAsset?.dataUrl || rev1?.fileAsset?.dataUrl || '/test_instagram_post.png';
                        let v2Img = comparisonData.v2?.fileAsset?.dataUrl || rev2?.fileAsset?.dataUrl || ((comparisonData.v2?.versionNumber || compareV2) > 1 ? '/test_instagram_post_revised.png' : '/test_instagram_post.png');

                        const hasAnyVisual = Boolean(v1Img || v2Img || rev1?.fileAsset || rev2?.fileAsset);
                        if (!hasAnyVisual) return null;

                        return (
                          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
                            <div className="bg-gradient-to-r from-slate-100 to-teal-50/60 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-900">
                                  Side-by-Side Visual Creative Comparison: v{comparisonData.v1?.versionNumber} (Before) vs v{comparisonData.v2?.versionNumber} (After)
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200">
                                Interactive Visual Diff
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-4 gap-4 bg-slate-50/40">
                              {/* Left Card: Version Before */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                      Version {comparisonData.v1?.versionNumber} (Before)
                                    </span>
                                    <StatusBadge status={comparisonData.v1?.status || 'needs_changes'} />
                                  </div>
                                  <span className="text-[11px] font-mono font-bold text-slate-600">
                                    Score: {comparisonData.v1?.summary?.overallScore ?? 100}/100
                                  </span>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-900/5 p-3 flex flex-col items-center justify-center min-h-[260px] shadow-2xs">
                                  {v1Img ? (
                                    <div className="relative group w-full flex flex-col items-center">
                                      <img
                                        src={v1Img}
                                        alt={`Version ${comparisonData.v1?.versionNumber} Creative`}
                                        className="max-h-72 w-auto rounded-lg object-contain border border-slate-200 shadow-sm bg-white"
                                      />
                                      <div className="mt-2.5 w-full flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
                                        <span className="truncate max-w-[180px]">{rev1?.fileAsset?.originalName || 'Asset (Before)'}</span>
                                        <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px]">1080 × 1080 px</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center text-slate-400 p-6">
                                      <ImageIcon className="h-10 w-10 mx-auto mb-1 opacity-40" />
                                      <p className="text-xs">No image attached in v{comparisonData.v1?.versionNumber}</p>
                                    </div>
                                  )}
                                </div>

                                {/* OCR Detected Text Before */}
                                {(rev1?.fileAsset?.extractedText || rev1?.contentSnapshot) && (
                                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                                      Detected In-Image Copy (v{comparisonData.v1?.versionNumber})
                                    </span>
                                    <p className="text-rose-950 font-sans text-xs leading-relaxed line-clamp-3">
                                      {rev1?.fileAsset?.extractedText || rev1?.contentSnapshot}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Right Card: Version After */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                                      Version {comparisonData.v2?.versionNumber} (After)
                                    </span>
                                    <StatusBadge status={comparisonData.v2?.status || 'pending_approval'} />
                                  </div>
                                  <span className="text-[11px] font-mono font-bold text-teal-800">
                                    Score: {comparisonData.v2?.summary?.overallScore ?? 100}/100
                                  </span>
                                </div>

                                <div className="rounded-xl border border-teal-200 bg-white p-3 flex flex-col items-center justify-center min-h-[260px] shadow-xs ring-2 ring-teal-500/10">
                                  {v2Img ? (
                                    <div className="relative group w-full flex flex-col items-center">
                                      <img
                                        src={v2Img}
                                        alt={`Version ${comparisonData.v2?.versionNumber} Creative`}
                                        className="max-h-72 w-auto rounded-lg object-contain border border-slate-200 shadow-sm bg-white"
                                      />
                                      <div className="mt-2.5 w-full flex items-center justify-between text-[11px] text-teal-800 px-1 font-mono font-semibold">
                                        <span className="truncate max-w-[180px]">{rev2?.fileAsset?.originalName || 'Asset (Revised)'}</span>
                                        <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded text-[10px]">Revised • 1080 × 1080 px</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center text-slate-400 p-6">
                                      <ImageIcon className="h-10 w-10 mx-auto mb-1 opacity-40" />
                                      <p className="text-xs">No image attached in v{comparisonData.v2?.versionNumber}</p>
                                    </div>
                                  )}
                                </div>

                                {/* OCR Detected Text After */}
                                {(rev2?.fileAsset?.extractedText || rev2?.contentSnapshot) && (
                                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                      Revised In-Image Copy (v{comparisonData.v2?.versionNumber})
                                    </span>
                                    <p className="text-emerald-950 font-sans text-xs leading-relaxed line-clamp-3">
                                      {rev2?.fileAsset?.extractedText || rev2?.contentSnapshot}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Text Diff View */}
                      <div className="rounded-xl border border-slate-200 overflow-hidden font-mono text-xs">
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                          <span>Text Comparison (v{comparisonData.v1?.versionNumber} → v{comparisonData.v2?.versionNumber})</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            Green = Added, Red = Removed
                          </span>
                        </div>
                        <div className="p-3 bg-slate-900 text-slate-100 max-h-80 overflow-y-auto space-y-1">
                          {comparisonData.diffSummary?.chunks?.map((chunk, idx) => (
                            <div
                              key={idx}
                              className={`px-2 py-0.5 rounded leading-relaxed whitespace-pre-wrap ${
                                chunk.type === 'added'
                                  ? 'bg-emerald-950/80 text-emerald-300 font-semibold border-l-2 border-emerald-500'
                                  : chunk.type === 'removed'
                                  ? 'bg-rose-950/80 text-rose-300 line-through border-l-2 border-rose-500'
                                  : 'text-slate-400'
                              }`}
                            >
                              <span className="text-slate-600 mr-2 select-none">
                                {chunk.type === 'added' ? '+' : chunk.type === 'removed' ? '-' : ' '}
                              </span>
                              {chunk.text}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Findings Delta */}
                      {comparisonData.findingsComparison?.resolved?.length > 0 && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <p className="font-bold text-xs text-emerald-900 mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Resolved Violations in v{comparisonData.v2?.versionNumber}:
                          </p>
                          <ul className="list-disc list-inside text-xs text-emerald-800 space-y-0.5">
                            {comparisonData.findingsComparison.resolved.map((rf, i) => (
                              <li key={i}>
                                <strong>{rf.title || rf.type}</strong>: {rf.explanation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-6">
                      Click Compare above to analyze the differences between versions.
                    </p>
                  )}
                </div>
              )}

              {/* TAB 3: REVISIONS */}
              {activeTab === 'revisions' && (
                <div className="space-y-4">
                  {revisions.map((rev) => (
                    <div
                      key={rev._id}
                      className={`p-4 rounded-xl border ${
                        rev.versionNumber === review.currentVersion
                          ? 'border-teal-300 bg-teal-50/30'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-900 flex items-center gap-2">
                          Version {rev.versionNumber}
                          {rev.versionNumber === review.currentVersion && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white">
                              Active
                            </span>
                          )}
                          <StatusBadge status={rev.status} />
                        </span>
                        <span className="text-slate-400">
                          {new Date(rev.createdAt).toLocaleString()} · Score: {rev.summary?.overallScore || 100}/100
                        </span>
                      </div>
                      {rev.contentSnapshot && (
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed select-text font-sans">
                          {rev.contentSnapshot}
                        </p>
                      )}
                      {rev.submissionNote && (
                        <p className="text-[11px] text-slate-500 italic mt-1.5">
                          Note: "{rev.submissionNote}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: COMMENTS */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">
                        No feedback posted yet. Use the field below to leave comments or discuss revisions.
                      </p>
                    ) : (
                      comments.map((c) => (
                        <div
                          key={c._id || c.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              {c.authorId?.name || c.user?.name || 'User'}
                              <span className="ml-1.5 font-normal text-slate-400 capitalize">
                                ({c.authorId?.role || c.user?.role || 'team'})
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{c.body || c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add feedback or discussion comment..."
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      {submittingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Post
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <div className="relative pl-6 border-l-2 border-slate-200 space-y-5">
                    {auditTrail.map((ev, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white shadow-xs"></div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 capitalize">
                            {ev.action?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ev.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Triggered by <strong className="text-slate-800">{ev.actorId?.name || 'System'}</strong> · Version {ev.versionNumber || 1}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Governance Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Governance Overview</h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Compliance Score:</span>
                <span className="font-extrabold text-sm text-slate-900">{score}/100</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 pt-1 leading-snug">
                {review.summary?.recommendation || 'Evaluated against registered brand guidelines.'}
              </p>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Brand Workspace:</span>
                <span className="font-bold text-slate-900">{review.brand?.name || 'Workspace'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modality:</span>
                <span className="font-semibold text-slate-700 capitalize">{review.modality || 'Text'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Analysis Engine:</span>
                <span className="font-semibold text-slate-700">
                  {isPartial ? 'Deterministic Rules Only' : 'Deterministic + Gemini AI'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                to={`/brands/${review.brandId || review.brand?._id}`}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                Open Brand Knowledge Base
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION MODAL (APPROVE / REQUEST CHANGES / REJECT / SUBMIT) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 capitalize">{actionModal.replace(/-/g, ' ')}</h3>

            {actionModal === 'submit' ? (
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Submit this draft and all audit results into the human reviewer approval queue. An authorized reviewer will
                verify findings and issue formal sign-off.
              </p>
            ) : actionModal === 'approve' ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-600">
                  Confirm that this content aligns with approved brand standards and is cleared for public distribution.
                </p>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Approval Justification / Comment (Optional)
                  </label>
                  <input
                    type="text"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Cleared for campaign launch."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-600">
                  Please provide a detailed justification for {actionModal === 'reject' ? 'rejection' : 'requesting changes'}:
                </p>
                <textarea
                  rows={3}
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Explain required changes or rejection rationale..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWorkflowAction}
                disabled={actionLoading}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  actionModal === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionModal === 'request-changes'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
