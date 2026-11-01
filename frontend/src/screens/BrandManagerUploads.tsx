import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CloudUpload,
  FileCheck,
  FileUp,
  Layers,
  Loader2,
  Palette,
  ShieldCheck,
  Type
} from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Button, Card, ICON, Pill } from '@/components/mono/ui';
import { useFrame } from '@/components/mono/AppFrame';

interface ExtractedRule {
  id: string;
  category: 'color' | 'typography' | 'logo' | 'fact';
  title: string;
  value: string;
  confidence: number;
  approved: boolean;
}

const SAMPLE_EXTRACTIONS: Record<string, { filename: string; rules: ExtractedRule[] }> = {
  novafit: {
    filename: 'NovaFit_Brand_Guidelines_2026.pdf',
    rules: [
      { id: 'r1', category: 'color', title: 'Primary Signature Color', value: '#FF4500 (Electric Orange)', confidence: 99, approved: true },
      { id: 'r2', category: 'color', title: 'Prohibited Contrast Color', value: '#39FF14 (Neon Green - Strictly Prohibited)', confidence: 100, approved: true },
      { id: 'r3', category: 'typography', title: 'Primary Heading Weight', value: 'Inter SemiBold (600)', confidence: 98, approved: true },
      { id: 'r4', category: 'typography', title: 'Body Copy Weight', value: 'Inter Regular (400)', confidence: 98, approved: true },
      { id: 'r5', category: 'logo', title: 'Minimum Logo Clear Space', value: '24px perimeter boundary', confidence: 95, approved: true },
      { id: 'r6', category: 'fact', title: 'Approved Subscription Pricing', value: '₹999 / month (Quoting ₹799 is prohibited)', confidence: 99, approved: true }
    ]
  },
  voltauto: {
    filename: 'VoltAuto_Brand_Guidelines_2026.pdf',
    rules: [
      { id: 'v1', category: 'color', title: 'Primary Cyan Accent', value: '#00E5FF (Electric Cyan)', confidence: 99, approved: true },
      { id: 'v2', category: 'color', title: 'Prohibited Accent', value: '#FF0033 (Crimson Red - Prohibited)', confidence: 98, approved: true },
      { id: 'v3', category: 'typography', title: 'Display Typography', value: 'Space Grotesk Bold (700)', confidence: 97, approved: true },
      { id: 'v4', category: 'logo', title: 'Perimeter Clearance', value: '32px boundary clearance', confidence: 96, approved: true },
      { id: 'v5', category: 'fact', title: 'Official Launch Pricing', value: '₹24,99,000 baseline price', confidence: 99, approved: true }
    ]
  }
};

export function BrandManagerUploads() {
  const navigate = useNavigate();
  const { notify } = useFrame();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<{ filename: string; rules: ExtractedRule[] } | null>(
    SAMPLE_EXTRACTIONS.novafit
  );

  const handleFileUpload = (file: File) => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      const isVolt = file.name.toLowerCase().includes('volt');
      const data = isVolt ? SAMPLE_EXTRACTIONS.voltauto : SAMPLE_EXTRACTIONS.novafit;
      setExtractedData({
        filename: file.name,
        rules: data.rules
      });
      notify(`Parsed ${file.name} successfully. 6 rules staged for governance.`, 'success');
    }, 1200);
  };

  const loadSamplePdf = (key: 'novafit' | 'voltauto') => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setExtractedData(SAMPLE_EXTRACTIONS[key]);
      notify(`Loaded ${SAMPLE_EXTRACTIONS[key].filename} into ingestion studio.`, 'success');
    }, 600);
  };

  const toggleApprove = (id: string) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      rules: extractedData.rules.map(r => (r.id === id ? { ...r, approved: !r.approved } : r))
    });
    notify('Rule status updated and synced to asset library.', 'success');
  };

  const approveAll = () => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      rules: extractedData.rules.map(r => ({ ...r, approved: true }))
    });
    notify('All extracted guidelines approved and active in compliance engine!', 'success');
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard?role=brand_manager')}
            aria-label="Back to dashboard"
            className="press flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-silver bg-paper text-ink shadow-sm transition-colors hover:bg-silver/20 focus-visible:outline-ink"
          >
            <ArrowLeft className="size-5" {...ICON} />
          </button>
          <div className="flex flex-col gap-1">
            <RevealText
              text="Guideline Ingestion & Document Intelligence"
              className="font-display text-display font-semibold tracking-tight text-ink"
              delay={0.06}
            />
            <p className="max-w-2xl text-body text-graphite">
              Upload PDF brand manuals to automatically extract official color palettes, font weights, logo clearance, and pricing rules.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="md" variant="secondary" onClick={() => loadSamplePdf('novafit')}>
            Load NovaFit PDF
          </Button>
          <Button size="md" variant="secondary" onClick={() => loadSamplePdf('voltauto')}>
            Load VoltAuto PDF
          </Button>
          <Button size="md" onClick={() => navigate('/brand-manager/assets')}>
            View Asset Library
          </Button>
        </div>
      </header>

      {/* ── Upload Box & Dropzone ── */}
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-item bg-ink text-paper">
              <FileUp className="size-5" {...ICON} />
            </span>
            <div>
              <h2 className="font-display text-subheading font-semibold text-ink">Ingest Brand Manual PDF</h2>
              <p className="text-caption text-graphite">Supports official PDF guideline documents up to 25 MB</p>
            </div>
          </div>
          <Pill variant="silver" caps={false}>
            Document Staging Ready
          </Pill>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="sr-only"
          onChange={e => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-silver bg-silver/10 p-6 text-center transition-colors hover:border-mid hover:bg-silver/20"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-silver text-graphite">
            <CloudUpload className="size-6" {...ICON} />
          </span>
          <p className="text-ui font-medium text-ink">
            Drag and drop brand guideline PDF here, or <span className="underline underline-offset-4">browse</span>
          </p>
          <p className="text-caption text-graphite">Extracts tokens, rules, and facts in real time</p>
        </div>

        {analyzing && (
          <div className="flex items-center justify-center gap-3 py-6">
            <Loader2 className="size-5 animate-spin text-ink" />
            <span className="text-ui font-medium text-ink">Analyzing brand manual and extracting rules...</span>
          </div>
        )}
      </Card>

      {/* ── Extracted Guidelines Staging Table ── */}
      {extractedData && !analyzing && (
        <Card className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-item bg-success/20 text-success">
                <FileCheck className="size-5" {...ICON} />
              </span>
              <div>
                <h2 className="font-display text-subheading font-semibold text-ink">
                  Extracted Rules: {extractedData.filename}
                </h2>
                <p className="text-caption text-graphite">
                  {extractedData.rules.filter(r => r.approved).length} of {extractedData.rules.length} rules approved into active governance
                </p>
              </div>
            </div>

            <Button size="md" onClick={approveAll}>
              <Check className="size-4" {...ICON} /> Approve All into Asset Library
            </Button>
          </div>

          <div className="flex flex-col divide-y divide-silver border-y border-silver">
            {extractedData.rules.map(rule => (
              <div
                key={rule.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-silver/15 px-2"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-min bg-silver/40 text-ink mt-0.5">
                    {rule.category === 'color' && <Palette className="size-4" />}
                    {rule.category === 'typography' && <Type className="size-4" />}
                    {rule.category === 'logo' && <Layers className="size-4" />}
                    {rule.category === 'fact' && <ShieldCheck className="size-4" />}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-ui font-semibold text-ink">{rule.title}</span>
                      <Pill variant="silver" caps={false}>
                        {rule.confidence}% Match
                      </Pill>
                    </div>
                    <span className="text-body font-medium text-graphite">{rule.value}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {rule.approved ? (
                    <span className="flex items-center gap-1.5 text-caption font-semibold text-success">
                      <CheckCircle2 className="size-4" /> Active in Library
                    </span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => toggleApprove(rule.id)}>
                      Approve Rule
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
