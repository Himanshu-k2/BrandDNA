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
  X
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

  // Active sub-tab
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'revisions' | 'comments' | 'audit'

  // Revision creation state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisedContent, setRevisedContent] = useState('');
  const [revisedFiles, setRevisedFiles] = useState([]);
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Workflow actions modals
  const [actionModal, setActionModal] = useState(null); // 'approve' | 'request-changes' | 'reject' | 'submit'
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
        reviewsAPI.getRevisions(id).catch(() => ({ data: { revisions: [] } })),
      ]);

      const reviewData = revRes.data?.data || revRes.data;
      setReview(reviewData);
      setRevisedContent(reviewData?.content || '');
      setComments(Array.isArray(comRes.data) ? comRes.data : comRes.data?.data || []);
      setAuditTrail(Array.isArray(auditRes.data) ? auditRes.data : auditRes.data?.data || []);
      setRevisions(revHistRes.data?.revisions || revHistRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewData();
  }, [id]);

  // WORKFLOW ACTION HANDLER
  const handleWorkflowAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      if (actionModal === 'submit') {
        await reviewsAPI.submit(id);
        toast.success('Submitted for authorized reviewer sign-off');
      } else if (actionModal === 'approve') {
        await reviewsAPI.approve(id, { reviewerNotes: actionNotes });
        toast.success('Content approved for publication');
      } else if (actionModal === 'request-changes') {
        if (!actionNotes.trim()) {
          toast.error('Please specify what changes are needed');
          setActionLoading(false);
          return;
        }
        await reviewsAPI.requestChanges(id, { reviewerNotes: actionNotes });
        toast.success('Changes requested from author');
      } else if (actionModal === 'reject') {
        if (!actionNotes.trim()) {
          toast.error('Please specify a rejection reason');
          setActionLoading(false);
          return;
        }
        await reviewsAPI.reject(id, { reviewerNotes: actionNotes });
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

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleRevisionFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newItems = files.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        rawFile: file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream'
      }));
      setRevisedFiles((prev) => [...prev, ...newItems]);
      e.target.value = '';
    }
  };

  // REVISION SUBMIT
  const handleCreateRevision = async (e) => {
    e.preventDefault();
    const hasText = revisedContent && revisedContent.trim().length > 0;
    const hasFiles = revisedFiles.length > 0 || (review.files && review.files.length > 0);

    if (!hasText && !hasFiles) {
      toast.error('Content or attached files are required for revision');
      return;
    }

    setSubmittingRevision(true);
    try {
      const processedFilesPayload = [];
      for (const item of revisedFiles) {
        const base64Data = await readFileAsBase64(item.rawFile);
        processedFilesPayload.push({
          filename: item.name,
          fileType: item.type,
          fileSize: item.size,
          fileData: base64Data
        });
      }

      const payload = {
        content: revisedContent.trim()
      };
      if (processedFilesPayload.length > 0) {
        payload.files = processedFilesPayload;
      }

      const { data } = await reviewsAPI.createRevision(id, payload);
      toast.success(`Revision v${data.currentVersion} analyzed successfully`);
      setShowRevisionForm(false);
      setRevisedFiles([]);
      await loadReviewData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save revision');
    } finally {
      setSubmittingRevision(false);
    }
  };

  // APPLY SUGGESTION TO REVISION TEXTAREA
  const handleApplySuggestion = (finding) => {
    if (!finding.originalText || !finding.suggestion) return;
    let replacement = finding.suggestion;
    const match = finding.suggestion.match(/["']([^"']+)["']/);
    if (match && match[1]) {
      replacement = match[1];
    }

    const updated = revisedContent.replace(finding.originalText, replacement);
    setRevisedContent(updated);
    setShowRevisionForm(true);
    toast.success(`Replaced "${finding.originalText}" with "${replacement}" in draft`);
  };

  // COMMENT SUBMIT
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await commentsAPI.create(id, { content: newComment });
      setComments([...comments, data]);
      setNewComment('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <LoadingState message="Auditing content against brand specifications..." />;
  if (error) return <ErrorState message={error} onRetry={loadReviewData} />;
  if (!review) return <div className="text-center py-12">Review record not found</div>;

  const isAuthor = review.submittedBy?._id === user?._id;
  const isReviewerOrAdmin = user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'platform_admin';
  const canSubmitForApproval =
    (isAuthor || user?.role === 'admin' || user?.role === 'platform_admin') &&
    ['analyzed', 'changes_requested', 'needs_changes', 'draft', 'rejected'].includes(review.status);
  const canMakeDecision =
    isReviewerOrAdmin &&
    (!isAuthor || user?.role === 'admin' || user?.role === 'platform_admin') &&
    ['submitted', 'in_review', 'pending_approval'].includes(review.status);
  const canRevise =
    (isAuthor || user?.role === 'admin' || user?.role === 'platform_admin') &&
    ['analyzed', 'changes_requested', 'needs_changes', 'draft', 'rejected'].includes(review.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to={user?.role === 'brand_manager' ? '/brand-manager/dashboard' : user?.role === 'reviewer' ? '/review-queue' : '/creator/dashboard'}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
                {review.brand?.name || 'Brand Workspace'}
              </span>
              <StatusBadge status={review.status} />
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-600">
                v{review.currentVersion || 1}
              </span>
              {typeof review.overallScore === 'number' && (
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${
                    review.overallScore >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : review.overallScore >= 50
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Score: {review.overallScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authored by <strong className="text-slate-700">{review.submittedBy?.name || 'Creator'}</strong> · Format:{' '}
              <span className="capitalize">{review.contentType?.replace(/_/g, ' ')}</span> ·{' '}
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
              {showRevisionForm ? 'Hide Editor' : 'Edit & Revise'}
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

      {/* Reviewer Feedback Callout */}
      {review.reviewerNotes && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Reviewer Feedback Notes:</p>
            <p className="mt-0.5 leading-relaxed text-amber-800">{review.reviewerNotes}</p>
            {review.reviewedBy && (
              <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                — {review.reviewedBy.name} ({review.reviewedBy.role})
              </p>
            )}
          </div>
        </div>
      )}

      {/* REVISION EDITOR FORM (Slide down) */}
      {showRevisionForm && (
        <div className="bg-white rounded-2xl border-2 border-teal-500/80 p-5 shadow-lg space-y-4 animate-scale-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-teal-600" />
              Revise Content (Will become v{(review.currentVersion || 1) + 1})
            </h3>
            <span className="text-xs text-slate-400">
              Editing creates a new version and preserves previous version history
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
                placeholder="Edit copy here or apply corrections from findings..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans leading-relaxed"
              />
            </div>

            {/* Attach Replacement or Additional Files */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <UploadCloud className="h-3.5 w-3.5 text-teal-600" />
                Attach Replacement Files for v{(review.currentVersion || 1) + 1} (Optional)
              </label>
              <input
                ref={revisionFileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.docx,.doc"
                onChange={handleRevisionFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => revisionFileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-dashed border-slate-300 hover:border-teal-500 text-slate-600 hover:text-teal-600 bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Browse & Attach Revised Files
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
                    Re-analyzing Rules...
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

      {/* MAIN TWO-COLUMN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Content, Files, and Findings Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Direct Text Content Card */}
          {review.content ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Submitted Text Content
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {review.content.length} characters
                </span>
              </div>
              <p className="text-base text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                {review.content}
              </p>
            </div>
          ) : null}

          {/* UPLOADED MULTI-FORMAT FILES & ASSETS CARD */}
          {review.files && review.files.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-teal-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Uploaded Content Files ({review.files.length})
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Multi-Format Content Corpus
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {review.files.map((file, idx) => {
                  const isImage = file.fileType?.startsWith('image/') || file.filename?.match(/\.(png|jpg|jpeg|webp)$/i);
                  const isPdf = file.filename?.endsWith('.pdf') || file.fileType?.includes('pdf');
                  const isDocx = file.filename?.match(/\.(docx|doc)$/i) || file.fileType?.includes('word');
                  const isTxt = file.filename?.match(/\.(txt|md)$/i) || file.fileType?.includes('text');

                  return (
                    <div
                      key={file._id || idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        {isImage && file.fileData ? (
                          <img
                            src={file.fileData}
                            alt={file.filename}
                            onClick={() => setLightboxImage(file)}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-90 flex-shrink-0"
                            title="Click to view creative image"
                          />
                        ) : isPdf ? (
                          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-rose-200">
                            PDF
                          </div>
                        ) : isDocx ? (
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-blue-200">
                            DOCX
                          </div>
                        ) : isTxt ? (
                          <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-slate-300">
                            TXT
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-teal-200">
                            FILE
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatFileSize(file.fileSize)}
                            {file.pageCount ? ` · ${file.pageCount} page(s)` : ''}
                          </p>

                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {file.status === 'processed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> Extracted & Audited
                              </span>
                            ) : file.status === 'extraction_failed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <AlertTriangle className="h-3 w-3" /> Extraction Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <AlertTriangle className="h-3 w-3" /> Unsupported
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* File error message if any */}
                      {file.errorMessage && (
                        <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          {file.errorMessage}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                        {file.extractedText && (
                          <button
                            type="button"
                            onClick={() => setInspectModalFile(file)}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3 w-3" /> Inspect Extracted Text
                          </button>
                        )}
                        {isImage && file.fileData && (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(file)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="h-3 w-3" /> View Creative
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tabs: Findings, Revisions, Comments, Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="border-b border-slate-200 px-4 py-2 bg-slate-50/70 flex gap-1 flex-wrap">
              <button
                onClick={() => setActiveTab('findings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'findings'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Compliance Findings ({review.findings?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('revisions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'revisions'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Revisions ({revisions.length + 1})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'comments'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Discussion ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Audit Trail ({auditTrail.length})
              </button>
            </div>

            <div className="p-5">
              {/* TAB 1: FINDINGS */}
              {activeTab === 'findings' && (
                <div className="space-y-4">
                  {review.findings?.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-bold text-emerald-900 text-sm">
                        100% Brand Compliant
                      </h4>
                      <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
                        No prohibited terms, outdated pricing, unverified promotional claims, or tone deviations detected across all submitted text and files.
                      </p>
                    </div>
                  ) : (
                    review.findings.map((finding, idx) => (
                      <ReviewFinding
                        key={finding._id || idx}
                        finding={finding}
                        onApply={canRevise ? handleApplySuggestion : null}
                      />
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: REVISIONS */}
              {activeTab === 'revisions' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-teal-900">
                        Version {review.currentVersion} (Current Active)
                      </span>
                      <span className="text-teal-700">
                        {new Date(review.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.content && (
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{review.content}</p>
                    )}
                    {review.files && review.files.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-teal-200/60 flex items-center gap-2 flex-wrap text-xs text-teal-900">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Attached files: {review.files.map((f) => f.filename).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {revisions.map((rev) => (
                    <div key={rev._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-800">
                          Version {rev.versionNumber}
                        </span>
                        <span className="text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {rev.content && (
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">{rev.content}</p>
                      )}
                      {rev.files && rev.files.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap text-xs text-slate-500">
                          <Paperclip className="h-3.5 w-3.5" />
                          <span>Files snapshot: {rev.files.map((f) => f.filename).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: COMMENTS */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">
                        No comments posted yet. Start the conversation below.
                      </p>
                    ) : (
                      comments.map((c) => (
                        <div
                          key={c._id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              {c.user?.name || 'User'}
                              <span className="ml-1.5 font-normal text-slate-400 capitalize">
                                ({c.user?.role})
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add reviewer notes or feedback..."
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      {submittingComment ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Post
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <div className="relative pl-6 border-l-2 border-slate-200 space-y-5">
                    {auditTrail.map((ev, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white shadow-xs"></div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{ev.event}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ev.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{ev.description}</p>
                        <span className="text-[10px] text-slate-400 mt-1 inline-block">
                          Actor: <strong>{ev.user}</strong> ({ev.role})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Brand Rules Summary Card */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-600" />
              Brand Workspace Reference
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Brand Name:</span>
                <span className="font-bold text-slate-900">{review.brand?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Industry:</span>
                <span className="font-semibold text-slate-700">{review.brand?.industry || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-2">
              <p className="font-bold text-slate-800">Review Checklist Summary</p>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>PDF & Word text extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Deterministic terminology match</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Approved pricing database lookup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Superlative claim verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Gemini multimodal vision & tone scan</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                to={`/brands/${review.brand?._id}`}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                Open Brand Workspace
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* EXTRACTED TEXT INSPECTOR MODAL */}
      {inspectModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  Extracted Content: {inspectModalFile.filename}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalFile(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Status: <strong className="text-emerald-700 capitalize">{inspectModalFile.status}</strong></span>
              <span>Size: <strong>{formatFileSize(inspectModalFile.fileSize)}</strong></span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
              {inspectModalFile.extractedText || 'No readable text was extracted from this file.'}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalFile(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR MARKETING IMAGES */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-800">{lightboxImage.filename}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={lightboxImage.fileData}
              alt={lightboxImage.filename}
              className="max-h-[70vh] object-contain rounded-xl mx-auto"
            />
          </div>
        </div>
      )}

      {/* ACTION MODAL (APPROVE / REQUEST CHANGES / REJECT / SUBMIT) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 capitalize">
              {actionModal.replace(/-/g, ' ')}
            </h3>

            {actionModal === 'submit' ? (
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you ready to submit this revised draft and all attached documents into the formal reviewer approval queue? Authorized human reviewers will examine the findings and issue final sign-off.
              </p>
            ) : actionModal === 'approve' ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-600">
                  Confirm that this content and all attached files align with brand guidelines and are ready for public release.
                </p>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Approval Notes (Optional)
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
                  Please provide notes explaining why this content requires changes or was rejected:
                </p>
                <textarea
                  rows={3}
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Explain required revisions across files or text..."
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
