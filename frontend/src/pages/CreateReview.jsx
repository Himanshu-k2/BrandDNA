import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { brandsAPI } from '../api/brands';
import { reviewsAPI } from '../api/reviews';
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  FileText,
  ArrowLeft,
  CheckCircle2,
  UploadCloud,
  X,
  File,
  Image as ImageIcon,
  FileType,
  Trash2,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.md', '.docx', '.doc'];

export default function CreateReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBrandId = searchParams.get('brandId') || '';

  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    brandId: preselectedBrandId,
    title: '',
    contentType: 'social_post',
    content: ''
  });

  // Uploaded files queue
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await brandsAPI.getAll();
        const list = Array.isArray(data) ? data : data?.data || [];
        setBrands(list);
        if (!form.brandId && list.length > 0) {
          setForm((prev) => ({ ...prev, brandId: list[0]._id }));
        }
      } catch (err) {
        toast.error('Failed to load brand workspaces');
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (filename, mimeType) => {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    if (ext === '.pdf' || mimeType.includes('pdf')) {
      return <div className="p-2 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs">PDF</div>;
    }
    if (ext === '.docx' || ext === '.doc' || mimeType.includes('word')) {
      return <div className="p-2 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">DOCX</div>;
    }
    if (ext === '.txt' || ext === '.md' || mimeType.includes('text')) {
      return <div className="p-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">TXT</div>;
    }
    return <div className="p-2 rounded-lg bg-teal-100 text-teal-700 font-bold text-xs">IMG</div>;
  };

  const validateAndAddFiles = (filesList) => {
    const newFiles = [];
    for (const file of filesList) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext) && !file.type.startsWith('image/') && !file.type.includes('pdf')) {
        toast.error(`"${file.name}" has an unsupported format. Supported: PDF, PNG, JPG, WebP, DOCX, TXT.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 15MB size limit (${formatFileSize(file.size)}).`);
        continue;
      }

      // Check duplicates
      if (uploadedFiles.some((f) => f.name === file.name && f.size === file.size)) {
        toast.error(`"${file.name}" has already been added.`);
        continue;
      }

      let previewUrl = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        rawFile: file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        previewUrl
      });
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} file(s) for compliance review`);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handlePreloadTestCase = () => {
    const novaFit = brands.find((b) => b.name.toLowerCase().includes('novafit')) || brands[0];
    if (novaFit) {
      setForm({
        brandId: novaFit._id,
        title: 'Summer Bootcamp Promo 2026',
        contentType: 'social_post',
        content: "Hey users! Join NovaFit for ₹799 per month. We are India's No. 1 fitness app!"
      });
      toast.success('Loaded NovaFit test copy (prohibited term, price violation, unsupported claim)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brandId) {
      toast.error('Please select a target brand workspace');
      return;
    }

    const hasText = form.content && form.content.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;

    if (!hasText && !hasFiles) {
      toast.error('Please provide draft copy or upload at least one file to review');
      return;
    }

    setSubmitting(true);
    try {
      // Encode files to Base64
      const processedFilesPayload = [];
      for (const item of uploadedFiles) {
        const base64Data = await readFileAsBase64(item.rawFile);
        processedFilesPayload.push({
          filename: item.name,
          fileType: item.type,
          fileSize: item.size,
          fileData: base64Data
        });
      }

      const payload = {
        brandId: form.brandId,
        title: form.title.trim() || (uploadedFiles[0] ? `Audit: ${uploadedFiles[0].name}` : 'Marketing Campaign Copy'),
        contentType: form.contentType,
        content: form.content.trim(),
        files: processedFilesPayload
      };

      const { data } = await reviewsAPI.create(payload);
      toast.success('Analysis complete! Viewing compliance diagnostic...');
      navigate(`/reviews/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete content review');
      setSubmitting(false);
    }
  };

  const selectedBrandObj = brands.find((b) => b._id === form.brandId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/creator/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-teal-600" />
              Check Content Compliance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit copy, PDF brochures, DOCX documents, TXT drafts, or marketing images to audit against approved brand guidelines.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePreloadTestCase}
          className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100/80 text-teal-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          title="Load official Hackathon NovaFit test scenario"
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          Load NovaFit Test Scenario ✨
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Workspace Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-teal-600" />
                Target Brand Workspace *
              </label>
              <select
                disabled={loadingBrands || submitting}
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {loadingBrands ? (
                  <option>Loading brand workspaces...</option>
                ) : brands.length === 0 ? (
                  <option value="">No brands available</option>
                ) : (
                  brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.industry || 'General'})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Content Format Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-teal-600" />
                Content Format *
              </label>
              <select
                disabled={submitting}
                value={form.contentType}
                onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 capitalize"
              >
                <option value="social_post">Social Media Post</option>
                <option value="advertisement">Paid Advertisement Creative</option>
                <option value="email">Marketing / Retention Email</option>
                <option value="blog_post">Blog Article / Longform</option>
                <option value="press_release">Press Release / Brochure</option>
                <option value="general">General Communication / Document</option>
              </select>
            </div>
          </div>

          {/* Campaign Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Campaign / Document Title (Optional)
            </label>
            <input
              type="text"
              disabled={submitting}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Summer Bootcamp Promo 2026 or Spring Product Brochure"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Active Workspace Info Tag */}
          {selectedBrandObj && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white font-extrabold text-xs"
                  style={{ backgroundColor: selectedBrandObj.primaryColor || '#0f766e' }}
                >
                  {selectedBrandObj.name.charAt(0)}
                </div>
                <span className="text-slate-700 font-semibold">
                  Auditing against <strong>{selectedBrandObj.name}</strong> standards ({selectedBrandObj.industry})
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                Isolated Brand Knowledge Base
              </span>
            </div>
          )}

          {/* MULTI-FORMAT FILE UPLOADS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UploadCloud className="h-4 w-4 text-teal-600" />
                Upload Content Files for Review
              </label>
              <span className="text-[11px] text-slate-400">
                PDF, DOCX, TXT, PNG, JPG, WebP (up to 15MB each)
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-teal-400 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadCloud className="h-10 w-10 text-teal-600 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800">
                Drag and drop files here, or <span className="text-teal-600 hover:underline">Browse Files</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Upload marketing brochures (PDF), proposal copy (DOCX), plain text (TXT), or creative ad banners (PNG, JPG, WebP)
              </p>
            </div>

            {/* Selected Files Listing */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Selected Files ({uploadedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFiles([])}
                    className="text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {uploadedFiles.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          getFileIcon(item.name, item.type)
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatFileSize(item.size)} · <span className="text-teal-600 font-medium">Ready for AI audit</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DIRECT DRAFT TEXT EDITOR */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Draft Copy / Content Text (Optional if files uploaded)
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {form.content.length} characters
              </span>
            </div>
            <textarea
              rows={6}
              disabled={submitting}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Paste draft copy, advertisement text, promotional messaging, or social campaign copy here..."
              className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 leading-relaxed font-sans resize-y"
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              You can submit text alone, files alone, or text together with attached marketing assets.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              to="/creator/dashboard"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || (!form.content.trim() && uploadedFiles.length === 0)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running AI & Multi-Format Verification...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Run Brand Compliance Check
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
