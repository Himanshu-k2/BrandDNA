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
  Sparkles,
  CheckCircle2,
  Ban,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

// Default predefined specs for demo brands
const DEFAULT_BRAND_SPECS = {
  novafit: {
    _id: 'novafit_brand_id',
    name: 'NovaFit',
    primaryColor: '#FF4500',
    secondaryColor: '#1E1E1E',
    accentColor: '#FFFFFF',
    prohibitedColor: '#39FF14',
    fonts: {
      heading: 'Inter SemiBold',
      headingWeight: '600',
      primary: 'Inter Regular',
      primaryWeight: '400',
      secondary: 'Montserrat Bold',
      secondaryWeight: '700'
    },
    officialClaims: [
      { claim: 'Approved subscription price is Rs. 999 / month.', verified: true },
      { claim: 'Annual Membership Tier is Rs. 9999 / year.', verified: true },
      { claim: 'Active athletic community exceeding 150,000 verified members.', verified: true }
    ],
    assets: [
      {
        _id: 'asset_nova_colors',
        name: 'NovaFit Official Color Palette',
        type: 'color',
        data: '#FF4500, #1E1E1E, #FFFFFF',
        prohibited: '#39FF14',
        description: 'Approved brand colors: Electric Orange (#FF4500), Dark Slate (#1E1E1E), Crisp White (#FFFFFF). Neon Green is strictly prohibited.',
        approvedAt: new Date().toLocaleDateString()
      },
      {
        _id: 'asset_nova_typo',
        name: 'NovaFit Typography & Typeface Standards',
        type: 'typography',
        data: 'Inter SemiBold (600) & Montserrat Bold (700)',
        description: 'Inter SemiBold (600) for hero headlines; Inter Regular (400) for body copy; Montserrat Bold (700) for metric displays.',
        approvedAt: new Date().toLocaleDateString()
      },
      {
        _id: 'asset_nova_logo',
        name: 'NovaFit Flame Emblem & Logo Guidelines',
        type: 'logo',
        data: '24px Clear Space',
        description: 'Maintain 24px clear space on all sides of the flame emblem. Never rotate, skew, or alter gradient.',
        approvedAt: new Date().toLocaleDateString()
      },
      {
        _id: 'asset_nova_pricing',
        name: 'Verified Subscription Pricing Tier',
        type: 'claim',
        data: 'Rs. 999 / month',
        description: 'Approved official price is Rs. 999 / month. All promotional marketing must reflect this exact price.',
        approvedAt: new Date().toLocaleDateString()
      },
      {
        _id: 'asset_nova_terms',
        name: 'Customer Terminology Governance',
        type: 'guideline',
        data: 'Prohibited: "users" → Preferred: "athletes"',
        description: 'Never use the term "users". Always refer to registered customers as "athletes" or "members".',
        approvedAt: new Date().toLocaleDateString()
      }
    ]
  },
  voltauto: {
    _id: 'voltauto_brand_id',
    name: 'VoltAuto',
    primaryColor: '#00E5FF',
    secondaryColor: '#0B0F19',
    accentColor: '#E2E8F0',
    prohibitedColor: '#FF0033',
    fonts: {
      heading: 'Space Grotesk Bold',
      headingWeight: '700',
      primary: 'Roboto Mono Regular',
      primaryWeight: '400',
      secondary: 'Space Grotesk Medium',
      secondaryWeight: '500'
    },
    officialClaims: [
      { claim: 'Approved base model price is Rs. 24,99,000 for Volt Alpha EV.', verified: true },
      { claim: '10% to 80% charge achieved in 18 minutes on DC hypercharger.', verified: true },
      { claim: 'Certified ARAI range of 520 km per single charge cycle.', verified: true }
    ],
    assets: [
      {
        _id: 'asset_volt_colors',
        name: 'VoltAuto Corporate Color System',
        type: 'color',
        data: '#00E5FF, #0B0F19, #E2E8F0',
        prohibited: '#FF0033',
        description: 'Approved brand colors: Electric Cyan (#00E5FF), Midnight Slate (#0B0F19), Pure Silver (#E2E8F0). Danger Crimson (#FF0033) is strictly prohibited.',
        approvedAt: new Date().toLocaleDateString()
      },
      {
        _id: 'asset_volt_typo',
        name: 'VoltAuto Technical Typography Hierarchy',
        type: 'typography',
        data: 'Space Grotesk Bold (700) & Roboto Mono (400)',
        description: 'Space Grotesk Bold (700) for hero titles and headlines; Roboto Mono (400) for engineering specifications and telemetry.',
        approvedAt: new Date().toLocaleDateString()
      },
      {
        _id: 'asset_volt_logo',
        name: 'Volt Lightning Emblem Logo Clear Space',
        type: 'logo',
        data: '32px Clear Space',
        description: 'Maintain 32px clear space around the Volt lightning emblem. Always positioned in top-left quadrant on dark background.',
        approvedAt: new Date().toLocaleDateString()
      },
      {
        _id: 'asset_volt_pricing',
        name: 'Volt Alpha EV Base Pricing Fact',
        type: 'claim',
        data: 'Rs. 24,99,000',
        description: 'Approved base model price is Rs. 24,99,000 for Volt Alpha EV. All commercial collateral must cite exact model tier.',
        approvedAt: new Date().toLocaleDateString()
      },
      {
        _id: 'asset_volt_terms',
        name: 'Vehicle & Pilot Terminology Governance',
        type: 'guideline',
        data: 'Prohibited: "car" → Preferred: "EV" | "drivers" → "pilots"',
        description: 'Never use the term "car" (always use "EV") or "drivers" (always use "pilots").',
        approvedAt: new Date().toLocaleDateString()
      }
    ]
  }
};

export default function BrandManagerAssets() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedHex, setCopiedHex] = useState(null);

  const [form, setForm] = useState({
    name: '',
    type: 'logo',
    url: '',
    data: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Helper to merge approved specs from staged documents and localStorage
  const getMergedBrandData = (baseBrand) => {
    const brandKey = (baseBrand?.name || 'novafit').toLowerCase().includes('volt') ? 'voltauto' : 'novafit';
    const fallback = DEFAULT_BRAND_SPECS[brandKey];

    // Load custom brand specs saved by Brand Manager
    let localSpecs = {};
    try {
      localSpecs = JSON.parse(localStorage.getItem(`branddna_approved_brand_specs_${brandKey}`) || '{}');
    } catch {
      // ignore
    }

    // Inspect staged documents in localStorage for approved items
    let stagedDocs = [];
    try {
      stagedDocs = JSON.parse(localStorage.getItem('branddna_staged_docs') || '[]');
    } catch {
      // ignore
    }

    const docItems = stagedDocs
      .filter((d) => (d.filename || '').toLowerCase().includes(brandKey.substring(0, 4)))
      .flatMap((d) => d.extractedItems || [])
      .filter((i) => i.status === 'approved');

    // Merge color rules
    let primaryColor = localSpecs.primaryColor || baseBrand?.primaryColor || fallback.primaryColor;
    let secondaryColor = localSpecs.secondaryColor || baseBrand?.secondaryColor || fallback.secondaryColor;
    let accentColor = localSpecs.accentColor || fallback.accentColor;
    let prohibitedColor = localSpecs.prohibitedColor || fallback.prohibitedColor;

    const colorItem = docItems.find((i) => i.type === 'visual_asset' && /color/i.test(i.title));
    if (colorItem) {
      const hexes = colorItem.content.match(/#[0-9a-fA-F]{6}/gi);
      if (hexes && hexes.length > 0) primaryColor = hexes[0].toUpperCase();
      if (hexes && hexes.length > 1) secondaryColor = hexes[1].toUpperCase();
      if (hexes && hexes.length > 2) accentColor = hexes[2].toUpperCase();
      const prohMatch = colorItem.content.match(/prohibited.*?([#[0-9a-fA-F]{6}]+)/i);
      if (prohMatch) prohibitedColor = prohMatch[1].toUpperCase();
    }

    // Merge typography rules
    let fonts = { ...fallback.fonts, ...(baseBrand?.fonts || {}), ...(localSpecs.fonts || {}) };
    const typoItem = docItems.find((i) => i.type === 'visual_asset' && /typography|font/i.test(i.title));
    if (typoItem) {
      if (/inter/i.test(typoItem.content)) {
        fonts.heading = 'Inter SemiBold';
        fonts.headingWeight = '600';
        fonts.primary = 'Inter Regular';
        fonts.primaryWeight = '400';
        fonts.secondary = 'Montserrat Bold';
        fonts.secondaryWeight = '700';
      } else if (/space grotesk/i.test(typoItem.content)) {
        fonts.heading = 'Space Grotesk Bold';
        fonts.headingWeight = '700';
        fonts.primary = 'Roboto Mono Regular';
        fonts.primaryWeight = '400';
      }
    }

    // Merge claims & facts
    let officialClaims = [...fallback.officialClaims, ...(baseBrand?.officialClaims || []), ...(localSpecs.officialClaims || [])];
    docItems.filter((i) => i.type === 'fact').forEach((f) => {
      if (!officialClaims.some((c) => c.claim === f.content)) {
        officialClaims.push({ claim: f.content, verified: true });
      }
    });

    // Merge assets catalog
    let assets = [...(baseBrand?.assets || []), ...(localSpecs.assets || [])];
    if (assets.length === 0) {
      assets = [...fallback.assets];
    }

    // Dynamically insert approved candidate items if not already present
    docItems.forEach((item) => {
      if (!assets.some((a) => a.name === item.title)) {
        assets.push({
          _id: item._id,
          name: item.title,
          type: item.type === 'visual_asset' && /color/i.test(item.title) ? 'color' : item.type === 'visual_asset' && /typo|font/i.test(item.title) ? 'typography' : item.type === 'visual_asset' ? 'logo' : item.type === 'fact' ? 'claim' : 'guideline',
          data: item.factValue || (item.prohibitedTerm ? `${item.prohibitedTerm} → ${item.preferredTerm}` : item.title),
          description: item.content,
          approvedAt: 'Just now (Approved from Guideline PDF)'
        });
      }
    });

    return {
      ...fallback,
      ...baseBrand,
      primaryColor,
      secondaryColor,
      accentColor,
      prohibitedColor,
      fonts,
      officialClaims,
      assets,
      name: baseBrand?.name || fallback.name,
      _id: baseBrand?._id || fallback._id
    };
  };

  const loadData = async () => {
    try {
      const { data } = await brandsAPI.getAll();
      let list = data.data || [];

      if (list.length === 0) {
        list = [
          { _id: 'novafit_brand_id', name: 'NovaFit' },
          { _id: 'voltauto_brand_id', name: 'VoltAuto' }
        ];
      }

      setBrands(list);
      setSelectedBrand(getMergedBrandData(list[0]));
    } catch {
      const defaultList = [
        { _id: 'novafit_brand_id', name: 'NovaFit' },
        { _id: 'voltauto_brand_id', name: 'VoltAuto' }
      ];
      setBrands(defaultList);
      setSelectedBrand(getMergedBrandData(defaultList[0]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBrandChange = (brandId) => {
    const b = brands.find((x) => x._id === brandId);
    if (b) setSelectedBrand(getMergedBrandData(b));
  };

  const handleCopyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    toast.success(`Copied ${hex} to clipboard!`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !selectedBrand) {
      toast.error('Asset name is required');
      return;
    }

    setSubmitting(true);
    const newAsset = {
      _id: 'custom_' + Date.now(),
      name: form.name.trim(),
      type: form.type,
      url: form.url.trim(),
      data: form.data.trim() || form.name.trim(),
      description: form.description.trim() || 'Custom registered brand asset',
      approvedAt: new Date().toLocaleDateString()
    };

    try {
      if (selectedBrand._id && !selectedBrand._id.endsWith('_id')) {
        await brandsAPI.addAsset(selectedBrand._id, form);
      }
    } catch (apiErr) {
      console.warn('Backend add asset fallback:', apiErr);
    }

    // Update local state and persistence
    const brandKey = selectedBrand.name.toLowerCase().includes('volt') ? 'voltauto' : 'novafit';
    const updatedAssets = [newAsset, ...(selectedBrand.assets || [])];
    const updatedBrand = { ...selectedBrand, assets: updatedAssets };
    setSelectedBrand(updatedBrand);

    try {
      const localSpecs = JSON.parse(localStorage.getItem(`branddna_approved_brand_specs_${brandKey}`) || '{}');
      localSpecs.assets = updatedAssets;
      localStorage.setItem(`branddna_approved_brand_specs_${brandKey}`, JSON.stringify(localSpecs));
    } catch {
      // ignore
    }

    toast.success('Asset added to brand library');
    setShowModal(false);
    setForm({ name: '', type: 'logo', url: '', data: '', description: '' });
    setSubmitting(false);
  };

  const handleDeleteAsset = async (assetId) => {
    if (!selectedBrand) return;

    try {
      if (selectedBrand._id && !selectedBrand._id.endsWith('_id')) {
        await brandsAPI.deleteAsset(selectedBrand._id, assetId);
      }
    } catch (e) {
      console.warn('Backend delete asset fallback:', e);
    }

    const brandKey = selectedBrand.name.toLowerCase().includes('volt') ? 'voltauto' : 'novafit';
    const updatedAssets = (selectedBrand.assets || []).filter((a) => a._id !== assetId);
    const updatedBrand = { ...selectedBrand, assets: updatedAssets };
    setSelectedBrand(updatedBrand);

    try {
      const localSpecs = JSON.parse(localStorage.getItem(`branddna_approved_brand_specs_${brandKey}`) || '{}');
      localSpecs.assets = updatedAssets;
      localStorage.setItem(`branddna_approved_brand_specs_${brandKey}`, JSON.stringify(localSpecs));
    } catch {
      // ignore
    }

    toast.success('Asset removed');
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette className="h-4 w-4 text-teal-600" /> Core Brand Colors
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified System
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Primary Color */}
              <div
                onClick={() => handleCopyHex(selectedBrand.primaryColor)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition-all cursor-pointer group"
                title="Click to copy hex"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg shadow-xs border border-slate-200 flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedBrand.primaryColor }}
                  >
                    {copiedHex === selectedBrand.primaryColor ? <Check className="h-4 w-4" /> : null}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Primary Brand Color</span>
                    <span className="text-[11px] text-slate-500 font-mono font-semibold">{selectedBrand.primaryColor}</span>
                  </div>
                </div>
                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>

              {/* Secondary Color */}
              <div
                onClick={() => handleCopyHex(selectedBrand.secondaryColor)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition-all cursor-pointer group"
                title="Click to copy hex"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg shadow-xs border border-slate-200 flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedBrand.secondaryColor }}
                  >
                    {copiedHex === selectedBrand.secondaryColor ? <Check className="h-4 w-4" /> : null}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Secondary Background Color</span>
                    <span className="text-[11px] text-slate-500 font-mono font-semibold">{selectedBrand.secondaryColor}</span>
                  </div>
                </div>
                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>

              {/* Accent & Prohibited Colors */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div
                  onClick={() => handleCopyHex(selectedBrand.accentColor || '#FFFFFF')}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition-all cursor-pointer"
                  title="Click to copy"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md border border-slate-300"
                      style={{ backgroundColor: selectedBrand.accentColor || '#FFFFFF' }}
                    />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Accent</span>
                      <span className="text-[10px] font-mono font-bold text-slate-700">{selectedBrand.accentColor || '#FFFFFF'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-200">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md border border-rose-300 relative flex items-center justify-center"
                      style={{ backgroundColor: selectedBrand.prohibitedColor || '#39FF14' }}
                    >
                      <Ban className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-600 block">Prohibited</span>
                      <span className="text-[10px] font-mono font-bold text-rose-800">{selectedBrand.prohibitedColor || '#39FF14'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Type className="h-4 w-4 text-teal-600" /> Typography Standards
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Type Hierarchy
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Headings & Hero Titles</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800">
                    Weight: {selectedBrand.fonts?.headingWeight || '600'}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 block mt-1 tracking-tight">
                  {selectedBrand.fonts?.heading || 'Inter SemiBold'}
                </span>
                <span className="text-[11px] text-slate-500 italic block mt-0.5">
                  The quick brown fox jumps over the lazy dog
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Body Copy & Narratives</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-800">
                    Weight: {selectedBrand.fonts?.primaryWeight || '400'}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-800 block mt-1">
                  {selectedBrand.fonts?.primary || 'Inter Regular'}
                </span>
                <span className="text-[11px] text-slate-500 italic block mt-0.5">
                  Clear, accessible text for paragraphs and mobile interfaces
                </span>
              </div>

              {selectedBrand.fonts?.secondary && (
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Accent Font:</span>
                  <span className="font-bold text-slate-800">
                    {selectedBrand.fonts.secondary} ({selectedBrand.fonts?.secondaryWeight || '700'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Verified Claims & Facts */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" /> Verified Claims & Facts
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedBrand.officialClaims?.length || 0} Facts Active
              </span>
            </div>

            <div className="space-y-2 pt-1 max-h-[220px] overflow-y-auto">
              {(selectedBrand.officialClaims || []).map((c, i) => (
                <div
                  key={i}
                  className="text-xs p-2.5 rounded-xl bg-teal-50/70 text-teal-950 border border-teal-100 font-medium flex items-start gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{c.claim}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Asset Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Approved Assets Catalog ({assets.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official design specifications approved from guideline documents and registered into {selectedBrand?.name || 'brand'}.
            </p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
            {selectedBrand?.name} Assets Active
          </span>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Image className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No assets registered yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Approved items from guideline documents will appear here automatically, or you can register an asset manually.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 cursor-pointer shadow-xs"
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
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        asset.type === 'color'
                          ? 'bg-amber-100 text-amber-800'
                          : asset.type === 'typography'
                          ? 'bg-blue-100 text-blue-800'
                          : asset.type === 'logo'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {asset.type}
                    </span>
                    <button
                      onClick={() => handleDeleteAsset(asset._id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                      title="Remove asset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1">{asset.name}</h4>
                  <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">{asset.description || 'Brand asset item'}</p>

                  {/* Color asset preview */}
                  {asset.type === 'color' && (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(asset.data || '').split(',').map((c, i) => {
                          const hex = c.trim();
                          if (!hex.startsWith('#')) return null;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleCopyHex(hex)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-mono font-bold bg-slate-50 hover:bg-slate-100 cursor-pointer"
                              title="Click to copy hex"
                            >
                              <span className="w-3.5 h-3.5 rounded shadow-xs border" style={{ backgroundColor: hex }} />
                              {hex}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Typography asset preview */}
                  {asset.type === 'typography' && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 mb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Specimen</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{asset.data}</span>
                    </div>
                  )}

                  {/* Logo asset preview */}
                  {asset.type === 'logo' && (
                    <div className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="text-xs font-bold text-teal-900">{asset.data}</span>
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
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Approved for brand
                  </span>
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
                  placeholder="e.g. Official Header Logo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="logo">Logo & Clear Space</option>
                  <option value="color">Color Palette</option>
                  <option value="typography">Typography Standard</option>
                  <option value="claim">Official Pricing & Claim</option>
                  <option value="guideline">Terminology & Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specification / Value</label>
                <input
                  type="text"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  placeholder="e.g. #FF4500 or 24px Clear Space or Inter SemiBold"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Usage rules, requirements, or restrictions..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
