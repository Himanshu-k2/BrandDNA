import { useState, useEffect } from 'react';
import { brandsAPI } from '../api/brands';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BrandManagerUploads() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Form for raw text upload fallback
  const [textInput, setTextInput] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'text'

  const loadData = async () => {
    try {
      const { data: brandRes } = await brandsAPI.getAll();
      const list = brandRes.data || [];
      setBrands(list);
      if (list.length > 0) {
        setSelectedBrand(list[0]);
        await loadDocs(list[0]._id);
      }
    } catch {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const loadDocs = async (brandId) => {
    try {
      const { data } = await brandsAPI.getDocuments(brandId);
      const docs = data.documents || [];
      setDocuments(docs);
      if (docs.length > 0) {
        // Load details of the first document with staged candidate items
        const { data: fullDocRes } = await brandsAPI.getDocument(brandId, docs[0]._id);
        setSelectedDoc(fullDocRes.document);
      } else {
        setSelectedDoc(null);
      }
    } catch {
      toast.error('Failed to load documents');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBrandChange = async (brandId) => {
    const b = brands.find((x) => x._id === brandId);
    if (!b) return;
    setSelectedBrand(b);
    await loadDocs(b._id);
  };

  const handleDocSelect = async (docId) => {
    try {
      const { data } = await brandsAPI.getDocument(selectedBrand._id, docId);
      setSelectedDoc(data.document);
    } catch {
      toast.error('Error fetching document items');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBrand) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const { data } = await brandsAPI.uploadDocument(selectedBrand._id, formData);
      toast.success('Document uploaded and candidate rules extracted!');
      await loadDocs(selectedBrand._id);
      setSelectedDoc(data.document);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleTextUpload = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || !selectedBrand) {
      toast.error('Please enter guidelines text');
      return;
    }

    setUploading(true);
    try {
      const { data } = await brandsAPI.uploadDocumentData(selectedBrand._id, {
        filename: docTitle.trim() || 'brand_guidelines_text.txt',
        rawText: textInput
      });
      toast.success('Guidelines analyzed! Candidate rules extracted.');
      setTextInput('');
      setDocTitle('');
      await loadDocs(selectedBrand._id);
      setSelectedDoc(data.document);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Processing failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReviewItem = async (itemId, action) => {
    if (!selectedDoc || !selectedBrand) return;
    setActionLoading(itemId);
    try {
      const { data } = await brandsAPI.reviewExtractedItem(
        selectedBrand._id,
        selectedDoc._id,
        itemId,
        { action }
      );
      toast.success(
        action === 'approve'
          ? 'Approved! Added to official brand guidelines.'
          : 'Item marked as rejected.'
      );

      // Update local state
      setSelectedDoc((prev) => {
        if (!prev) return null;
        const updatedItems = prev.extractedItems.map((item) =>
          item._id === itemId ? { ...item, status: data.item.status } : item
        );
        return { ...prev, extractedItems: updatedItems, status: data.docStatus };
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review item');
    } finally {
      setActionLoading(null);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-navy-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Document Intelligence & Rule Staging
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Upload Guidelines & Extract Rules
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Upload PDF brand guidelines or paste text. The AI parser identifies proposed rules, facts, and terminology.
              <strong> You review and approve before adding them to official brand guidelines.</strong>
            </p>
          </div>

          {brands.length > 0 && (
            <div className="bg-navy-800 p-2 rounded-xl border border-navy-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block px-2">Active Brand</span>
              <select
                value={selectedBrand?._id || ''}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="bg-transparent text-white font-bold text-sm px-2 py-1 outline-none cursor-pointer"
              >
                {brands.map((b) => (
                  <option key={b._id} value={b._id} className="bg-navy-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Upload Guideline Source</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'file'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              PDF / File Upload
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'text'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Paste Guideline Text
            </button>
          </div>
        </div>

        {activeTab === 'file' ? (
          <div className="border-2 border-dashed border-teal-200 hover:border-teal-400 rounded-2xl p-8 text-center bg-teal-50/30 transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <UploadCloud className="h-10 w-10 text-teal-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">
                {uploading ? 'Analyzing document with AI...' : 'Click to upload PDF or brand guidelines document'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports PDF, PNG, JPG, and Markdown (up to 15MB)</p>
            </label>
            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-teal-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing text and extracting candidate rules...
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleTextUpload} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Q3 Brand Guidelines Addendum"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Paste Guidelines Text</label>
              <textarea
                rows={4}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste guideline text, approved prices (e.g. ₹999/month), banned words, or tone directives..."
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Extract Candidate Rules
            </button>
          </form>
        )}
      </div>

      {/* Staged Review Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Document List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" /> Uploaded Documents ({documents.length})
          </h3>
          <p className="text-xs text-slate-500">Select a document to review its extracted candidate items</p>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No documents uploaded</p>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => handleDocSelect(doc._id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                    selectedDoc?._id === doc._id
                      ? 'bg-teal-50 border border-teal-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 truncate block max-w-[180px]">
                      {doc.filename}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        doc.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'partially_approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Extracted Candidate Items for Review */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-teal-600" />
                Staged Candidate Rules
              </h3>
              <p className="text-xs text-slate-500">
                {selectedDoc
                  ? `Extracted from "${selectedDoc.filename}"`
                  : 'Select an uploaded document to review candidate items'}
              </p>
            </div>
            {selectedDoc && (
              <span className="text-xs text-slate-500">
                {selectedDoc.extractedItems?.length || 0} candidate items found
              </span>
            )}
          </div>

          {!selectedDoc ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select or upload a document to inspect candidate rules.
            </div>
          ) : selectedDoc.extractedItems?.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No candidate rules could be automatically extracted from this document text.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDoc.extractedItems.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.status === 'approved'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : item.status === 'rejected'
                      ? 'bg-rose-50/40 border-rose-200 opacity-70'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{item.title}</span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : item.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        item.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : item.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mb-3 leading-relaxed">{item.content}</p>

                  {/* Fact or Terminology values */}
                  {item.factKey && (
                    <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 mb-3 flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{item.factKey}:</span>
                      <span className="font-bold text-teal-700">{item.factValue}</span>
                    </div>
                  )}

                  {item.prohibitedTerm && (
                    <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 mb-3 flex items-center justify-between">
                      <span className="text-rose-600 font-semibold line-through">Prohibited: {item.prohibitedTerm}</span>
                      <span className="text-emerald-700 font-bold">Preferred: {item.preferredTerm}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {item.status === 'approved' ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Added to Official Guidelines
                      </span>
                    ) : item.status === 'rejected' ? (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> Rejected (Not added to brand)
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading === item._id}
                          onClick={() => handleReviewItem(item._id, 'reject')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === item._id}
                          onClick={() => handleReviewItem(item._id, 'approve')}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === item._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve & Add to Brand
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
