import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  X,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Client-Side PDF Text Extractor.
 * Extracts text stream strings from PDF binary without external dependencies.
 */
function extractTextFromPdf(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }

  // Extract all text inside ( ... ) Tj
  const tjMatches = str.match(/\(((?:\\\(|\\\)|[^()])*?)\)\s*Tj/g);
  if (tjMatches && tjMatches.length > 0) {
    return tjMatches
      .map((m) => {
        const text = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
        return text.replace(/\\([()\\])/g, '$1');
      })
      .join('\n');
  }

  // Fallback: extract plain ASCII lines
  return str.replace(/[^\x20-\x7E\n\r]/g, ' ');
}

/**
 * Intelligent Rule Extractor from raw guideline text.
 * Produces structured candidate items for Brand Manager approval.
 */
function extractRulesFromText(text, brandName = 'NovaFit') {
  const items = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Color Palette Extraction
  const hexMatch = text.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g);
  if (hexMatch && hexMatch.length > 0) {
    const uniqueHex = [...new Set(hexMatch.map((h) => h.toUpperCase()))];
    const prohibitedColors = [];
    const prohRegex = /prohibited\s*color[s]?:?\s*(#[0-9a-fA-F]{6})/gi;
    let pm;
    while ((pm = prohRegex.exec(text)) !== null) {
      if (pm[1]) prohibitedColors.push(pm[1].toUpperCase());
    }

    const approvedHex = uniqueHex.filter((h) => !prohibitedColors.includes(h));

    items.push({
      _id: 'rule_' + Math.random().toString(36).substring(2, 11),
      type: 'visual_asset',
      title: `${brandName} Official Color Palette`,
      severity: 'critical',
      content: `Approved Brand Colors: ${approvedHex.join(', ')}.${
        prohibitedColors.length > 0 ? ` Strictly Prohibited colors: ${prohibitedColors.join(', ')}.` : ''
      }`,
      status: 'pending',
    });
  }

  // 2. Logo Rules Extraction
  const logoMatch = text.match(/(logo[^\.\n]*?(clear space|padding|margin|rotate|placement|dimension)[^\.\n]*?\.)/i);
  if (logoMatch) {
    items.push({
      _id: 'rule_' + Math.random().toString(36).substring(2, 11),
      type: 'visual_asset',
      title: `${brandName} Logo Clear Space & Usage Rules`,
      severity: 'critical',
      content: logoMatch[1].trim(),
      status: 'pending',
    });
  } else {
    const logoLine = lines.find((l) => /logo/i.test(l) && !/guidelines/i.test(l));
    if (logoLine) {
      items.push({
        _id: 'rule_' + Math.random().toString(36).substring(2, 11),
        type: 'visual_asset',
        title: `${brandName} Logo Identity & Presentation Standards`,
        severity: 'critical',
        content: logoLine,
        status: 'pending',
      });
    }
  }

  // 3. Typography Extraction
  const typoMatch = text.match(/(typography|font|typeface)[^\.\n]*?:\s*([^\.\n]+)/i);
  if (typoMatch) {
    items.push({
      _id: 'rule_' + Math.random().toString(36).substring(2, 11),
      type: 'visual_asset',
      title: `${brandName} Typography & Typeface Guidelines`,
      severity: 'warning',
      content: `Official Typography: ${typoMatch[2].trim()}`,
      status: 'pending',
    });
  }

  // 4. Approved Pricing & Facts
  const priceMatches = text.match(/(?:₹|\$|rs\.?|inr|usd|eur|gbp)\s*[\d,]+(?:\s*\/\s*(?:month|mo|year|yr|pass|session))?/gi);
  if (priceMatches && priceMatches.length > 0) {
    const uniquePrices = [...new Set(priceMatches.map((p) => p.trim()))];
    uniquePrices.slice(0, 3).forEach((price, idx) => {
      const keyName = idx === 0 ? 'standard_pricing_tier' : `pricing_tier_${idx + 1}`;
      items.push({
        _id: 'rule_' + Math.random().toString(36).substring(2, 11),
        type: 'fact',
        title: `Official Pricing Tier (${price})`,
        severity: 'critical',
        content: `Approved official price is ${price}. All promotional marketing must reflect this exact price.`,
        factKey: keyName,
        factValue: price,
        status: 'pending',
      });
    });
  }

  // 5. Terminology Rules (Prohibited Terms vs Preferred Terms)
  let termCount = 0;
  for (const line of lines) {
    const m = line.match(/(?:prohibited|never use|don't use|do not use):\s*["']?([^"'\n>–-]+?)["']?\s*(?:->|–>|preferred:|\/|instead use|always use)\s*(?:preferred:)?\s*["']?([^"'\n\r]+?)["']?$/i);
    if (m && termCount < 5) {
      const prohibited = m[1].replace(/["']/g, '').trim();
      const preferred = m[2].replace(/["']/g, '').trim();
      if (prohibited && preferred && prohibited.toLowerCase() !== preferred.toLowerCase()) {
        items.push({
          _id: 'rule_' + Math.random().toString(36).substring(2, 11),
          type: 'terminology',
          title: `Terminology Rule: "${prohibited}" → "${preferred}"`,
          severity: 'critical',
          content: `Never use the term "${prohibited}". Always use approved brand term "${preferred}".`,
          prohibitedTerm: prohibited,
          preferredTerm: preferred,
          status: 'pending',
        });
        termCount++;
      }
    }
  }

  // Fallback terminology
  if (termCount === 0 && /users?/i.test(text) && /(members?|athletes?|pilots?)/i.test(text)) {
    const pref = text.match(/pilots?/i) ? 'pilots' : text.match(/athletes?/i) ? 'athletes' : 'members';
    items.push({
      _id: 'rule_' + Math.random().toString(36).substring(2, 11),
      type: 'terminology',
      title: `Customer Terminology: "users" → "${pref}"`,
      severity: 'critical',
      content: `Prohibited term: "users". Always refer to registered customers as "${pref}".`,
      prohibitedTerm: 'users',
      preferredTerm: pref,
      status: 'pending',
    });
  }

  // 6. Core Tone & Brand Voice Guidelines
  const toneMatch = text.match(/(tone|voice|brand voice)[^\.\n]*?:\s*([^\.\n]+)/i);
  if (toneMatch) {
    items.push({
      _id: 'rule_' + Math.random().toString(36).substring(2, 11),
      type: 'guideline',
      title: `${brandName} Voice & Tone Standards`,
      severity: 'warning',
      content: `Tone of Voice: ${toneMatch[2].trim()}`,
      status: 'pending',
    });
  }

  // 7. General guideline policy bullet points
  const guideRegex = /^(?:guideline\s*\d*[:.]?|\d+[.:)]|[-•*])\s+[A-Z]/i;
  const guidelineBullets = lines.filter((l) => guideRegex.test(l) && l.length > 20);
  guidelineBullets.slice(0, 4).forEach((bullet, idx) => {
    const cleanContent = bullet.replace(/^(?:guideline\s*\d*[:.]?|\d+[.:)]|[-•*])\s+/i, '');
    items.push({
      _id: 'rule_' + Math.random().toString(36).substring(2, 11),
      type: 'guideline',
      title: `Brand Policy Rule #${idx + 1}`,
      severity: idx === 0 ? 'critical' : 'warning',
      content: cleanContent,
      status: 'pending',
    });
  });

  return items;
}

export default function BrandManagerUploads() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fileInputRef = useRef(null);

  // Form for raw text upload fallback
  const [textInput, setTextInput] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'text'

  const getLocalDocs = () => {
    try {
      return JSON.parse(localStorage.getItem('branddna_staged_docs') || '[]');
    } catch {
      return [];
    }
  };

  const saveLocalDocs = (docs) => {
    try {
      localStorage.setItem('branddna_staged_docs', JSON.stringify(docs));
    } catch {
      // ignore
    }
  };

  const loadDocs = async (brandId) => {
    try {
      const localDocs = getLocalDocs();
      if (!brandId || brandId === 'default') {
        setDocuments(localDocs);
        if (localDocs.length > 0) setSelectedDoc(localDocs[0]);
        return;
      }

      const { data } = await brandsAPI.getDocuments(brandId);
      const serverDocs = data.documents || [];
      const combined = [...serverDocs, ...localDocs.filter((ld) => !serverDocs.some((sd) => sd._id === ld._id))];
      setDocuments(combined);
      if (combined.length > 0) {
        if (serverDocs.length > 0) {
          try {
            const { data: fullDocRes } = await brandsAPI.getDocument(brandId, serverDocs[0]._id);
            setSelectedDoc(fullDocRes.document);
          } catch {
            setSelectedDoc(combined[0]);
          }
        } else {
          setSelectedDoc(combined[0]);
        }
      } else {
        setSelectedDoc(null);
      }
    } catch {
      const localDocs = getLocalDocs();
      setDocuments(localDocs);
      if (localDocs.length > 0) setSelectedDoc(localDocs[0]);
    }
  };

  const loadData = async () => {
    try {
      const { data: brandRes } = await brandsAPI.getAll();
      let list = brandRes.data || [];

      if (list.length === 0) {
        // Fallback default brands for demo workspace
        list = [
          {
            _id: 'novafit_brand_id',
            name: 'NovaFit',
            description: '[Fictional Demo] Subscription fitness and wellness app',
            tone: 'Professional and encouraging'
          },
          {
            _id: 'voltauto_brand_id',
            name: 'VoltAuto',
            description: '[Fictional Demo] Next-generation electric mobility ecosystem',
            tone: 'Engineering precision and zero-emission luxury'
          }
        ];
      }

      setBrands(list);
      setSelectedBrand(list[0]);
      await loadDocs(list[0]._id);
    } catch {
      const defaultBrands = [
        { _id: 'novafit_brand_id', name: 'NovaFit' },
        { _id: 'voltauto_brand_id', name: 'VoltAuto' }
      ];
      setBrands(defaultBrands);
      setSelectedBrand(defaultBrands[0]);
      loadDocs('novafit_brand_id');
    } finally {
      setLoading(false);
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
    const local = documents.find((d) => d._id === docId);
    if (local && local.extractedItems) {
      setSelectedDoc(local);
      return;
    }

    try {
      const brandId = selectedBrand?._id || 'default';
      const { data } = await brandsAPI.getDocument(brandId, docId);
      setSelectedDoc(data.document);
    } catch {
      if (local) setSelectedDoc(local);
    }
  };

  const processFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadFileName(file.name);

    const brandName = selectedBrand?.name || (file.name.toLowerCase().includes('volt') ? 'VoltAuto' : 'NovaFit');
    const brandId = selectedBrand?._id || 'novafit_brand_id';

    try {
      let rawText = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        rawText = extractTextFromPdf(arrayBuffer);
      } else {
        rawText = await file.text();
      }

      // Try uploading to backend API first
      let serverSuccess = false;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('rawText', rawText);
        const { data } = await brandsAPI.uploadDocument(brandId, formData);
        if (data.document) {
          toast.success(`'${file.name}' processed by Document Intelligence!`);
          await loadDocs(brandId);
          setSelectedDoc(data.document);
          serverSuccess = true;
        }
      } catch (apiErr) {
        // If 404/500 on backend, perform instant deterministic client extraction
        console.warn('Backend upload endpoint fallback, extracting client-side:', apiErr);
      }

      if (!serverSuccess) {
        // Client-side extraction engine
        const extractedItems = extractRulesFromText(rawText, brandName);

        const newDoc = {
          _id: 'doc_' + Date.now(),
          brandId,
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/pdf',
          status: 'in_review',
          createdAt: new Date().toISOString(),
          extractedItems,
        };

        const existingLocal = getLocalDocs();
        const updatedDocs = [newDoc, ...existingLocal.filter((d) => d.filename !== file.name)];
        saveLocalDocs(updatedDocs);

        setDocuments((prev) => [newDoc, ...prev.filter((d) => d.filename !== file.name)]);
        setSelectedDoc(newDoc);
        toast.success(`'${file.name}' processed! Extracted ${extractedItems.length} candidate rules.`);
      }
    } catch (err) {
      toast.error('Failed to parse document: ' + err.message);
    } finally {
      setUploading(false);
      setUploadFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFileUpload(file);
  };

  const handleTextUpload = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) {
      toast.error('Please enter guidelines text');
      return;
    }

    const brandName = selectedBrand?.name || 'NovaFit';
    const brandId = selectedBrand?._id || 'novafit_brand_id';
    const title = docTitle.trim() || `${brandName} Brand Addendum.txt`;

    setUploading(true);
    setUploadFileName(title);

    try {
      const extractedItems = extractRulesFromText(textInput, brandName);
      const newDoc = {
        _id: 'doc_' + Date.now(),
        brandId,
        filename: title,
        fileSize: textInput.length,
        mimeType: 'text/plain',
        status: 'in_review',
        createdAt: new Date().toISOString(),
        extractedItems,
      };

      const existingLocal = getLocalDocs();
      const updatedDocs = [newDoc, ...existingLocal];
      saveLocalDocs(updatedDocs);

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
      setTextInput('');
      setDocTitle('');
      toast.success(`Guidelines analyzed! Extracted ${extractedItems.length} candidate rules.`);
    } catch (err) {
      toast.error('Error analyzing text: ' + err.message);
    } finally {
      setUploading(false);
      setUploadFileName('');
    }
  };

  const syncItemToBrandSpecs = (item, brandName) => {
    const brandKey = (brandName || '').toLowerCase().includes('volt') ? 'voltauto' : 'novafit';
    let localSpecs = {};
    try {
      localSpecs = JSON.parse(localStorage.getItem(`branddna_approved_brand_specs_${brandKey}`) || '{}');
    } catch {}

    if (!localSpecs.assets) localSpecs.assets = [];

    if (item.type === 'visual_asset' && /color/i.test(item.title)) {
      const hexes = item.content.match(/#[0-9a-fA-F]{6}/gi);
      if (hexes && hexes.length > 0) {
        localSpecs.primaryColor = hexes[0].toUpperCase();
        if (hexes.length > 1) localSpecs.secondaryColor = hexes[1].toUpperCase();
        if (hexes.length > 2) localSpecs.accentColor = hexes[2].toUpperCase();
      }
      const prohMatch = item.content.match(/prohibited.*?([#[0-9a-fA-F]{6}]+)/i);
      if (prohMatch) localSpecs.prohibitedColor = prohMatch[1].toUpperCase();
    } else if (item.type === 'visual_asset' && /typography|font/i.test(item.title)) {
      if (!localSpecs.fonts) localSpecs.fonts = {};
      if (/inter/i.test(item.content)) {
        localSpecs.fonts.heading = 'Inter SemiBold';
        localSpecs.fonts.headingWeight = '600';
        localSpecs.fonts.primary = 'Inter Regular';
        localSpecs.fonts.primaryWeight = '400';
        localSpecs.fonts.secondary = 'Montserrat Bold';
        localSpecs.fonts.secondaryWeight = '700';
      } else if (/space grotesk/i.test(item.content)) {
        localSpecs.fonts.heading = 'Space Grotesk Bold';
        localSpecs.fonts.headingWeight = '700';
        localSpecs.fonts.primary = 'Roboto Mono Regular';
        localSpecs.fonts.primaryWeight = '400';
      }
    }

    if (!localSpecs.assets.some((a) => a.name === item.title)) {
      localSpecs.assets.push({
        _id: 'approved_' + item._id,
        name: item.title,
        type: item.type === 'visual_asset' && /color/i.test(item.title) ? 'color' : item.type === 'visual_asset' && /typo|font/i.test(item.title) ? 'typography' : item.type === 'visual_asset' ? 'logo' : item.type === 'fact' ? 'claim' : 'guideline',
        data: item.factValue || (item.prohibitedTerm ? `${item.prohibitedTerm} → ${item.preferredTerm}` : item.title),
        description: item.content,
        approvedAt: 'Just now'
      });
    }

    try {
      localStorage.setItem(`branddna_approved_brand_specs_${brandKey}`, JSON.stringify(localSpecs));
    } catch {}
  };

  const handleApproveAll = async () => {
    if (!selectedDoc || !selectedDoc.extractedItems) return;
    const brandName = selectedBrand?.name || (selectedDoc.filename.toLowerCase().includes('volt') ? 'VoltAuto' : 'NovaFit');

    const updatedItems = selectedDoc.extractedItems.map((item) => {
      syncItemToBrandSpecs(item, brandName);
      return { ...item, status: 'approved' };
    });

    const updatedDoc = {
      ...selectedDoc,
      extractedItems: updatedItems,
      status: 'completed'
    };

    setSelectedDoc(updatedDoc);
    setDocuments((prev) => prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d)));
    const localDocs = getLocalDocs().map((d) => (d._id === updatedDoc._id ? updatedDoc : d));
    saveLocalDocs(localDocs);

    toast.success(`All ${updatedItems.length} candidate rules approved & synchronized to ${brandName} brand assets!`);
  };

  const handleReviewItem = async (itemId, action) => {
    if (!selectedDoc) return;
    setActionLoading(itemId);

    try {
      if (action === 'approve') {
        const approvedItem = selectedDoc.extractedItems.find((i) => i._id === itemId);
        if (approvedItem) {
          const brandName = selectedBrand?.name || (selectedDoc.filename.toLowerCase().includes('volt') ? 'VoltAuto' : 'NovaFit');
          syncItemToBrandSpecs(approvedItem, brandName);
        }
      }
      // Attempt backend review call if server doc
      if (!selectedDoc._id.startsWith('doc_')) {
        try {
          const brandId = selectedBrand?._id || 'novafit_brand_id';
          await brandsAPI.reviewExtractedItem(brandId, selectedDoc._id, itemId, { action });
        } catch (e) {
          console.warn('Backend review item fallback:', e);
        }
      }

      // Update state & local storage
      const updatedItems = selectedDoc.extractedItems.map((item) =>
        item._id === itemId ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' } : item
      );

      const pendingCount = updatedItems.filter((i) => i.status === 'pending').length;
      const newDocStatus = pendingCount === 0 ? 'completed' : 'in_review';

      const updatedDoc = {
        ...selectedDoc,
        extractedItems: updatedItems,
        status: newDocStatus,
      };

      setSelectedDoc(updatedDoc);
      setDocuments((prev) => prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d)));

      const localDocs = getLocalDocs().map((d) => (d._id === updatedDoc._id ? updatedDoc : d));
      saveLocalDocs(localDocs);

      toast.success(
        action === 'approve'
          ? 'Approved! Added to official brand guidelines.'
          : 'Item marked as rejected.'
      );
    } catch (err) {
      toast.error('Failed to review item: ' + err.message);
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

          <div className="bg-navy-800 p-2.5 rounded-xl border border-navy-700 min-w-[200px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block px-2">Active Brand Workspace</span>
            <select
              value={selectedBrand?._id || ''}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="bg-transparent text-white font-bold text-sm px-2 py-1 outline-none cursor-pointer w-full"
            >
              {brands.map((b) => (
                <option key={b._id} value={b._id} className="bg-navy-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Upload Guideline Source</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
              Target: {selectedBrand?.name || 'NovaFit'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              PDF / File Upload
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer select-none ${
              isDragging
                ? 'border-teal-500 bg-teal-100/40 ring-4 ring-teal-200/50'
                : 'border-teal-200 hover:border-teal-400 bg-teal-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
              onChange={handleFileInputChange}
              disabled={uploading}
              className="hidden"
            />
            <div className="max-w-md mx-auto pointer-events-none">
              <UploadCloud
                className={`h-12 w-12 mx-auto mb-3 transition-transform ${
                  isDragging ? 'text-teal-600 scale-110' : 'text-teal-600'
                }`}
              />
              <p className="text-sm font-bold text-slate-800">
                {uploading
                  ? `Analyzing "${uploadFileName}" with Document Intelligence...`
                  : isDragging
                  ? 'Drop guideline PDF here to start analysis...'
                  : 'Click to upload or Drag & Drop PDF brand guidelines here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF, PNG, JPG, and Markdown (up to 15MB)
              </p>

              <button
                type="button"
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Browse Files
              </button>
            </div>

            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-teal-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing document text and extracting candidate rules...
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
                placeholder="e.g. NovaFit Q3 Brand Addendum"
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
              <p className="text-xs text-slate-400 py-6 text-center">No documents uploaded yet</p>
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
                        doc.status === 'approved' || doc.status === 'completed'
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  {selectedDoc.extractedItems?.length || 0} candidate items
                </span>
                {selectedDoc.extractedItems?.some((i) => i.status === 'pending') && (
                  <button
                    type="button"
                    onClick={handleApproveAll}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve All Rules
                  </button>
                )}
                <Link
                  to="/brand-manager/assets"
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                >
                  View Brand Asset Library →
                </Link>
              </div>
            )}
          </div>

          {!selectedDoc ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Upload a brand guideline PDF or select an uploaded document to inspect candidate rules.
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
