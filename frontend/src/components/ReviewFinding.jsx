import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  ArrowRight,
  FileCheck,
  Image as ImageIcon,
  Copy,
  Check,
  Cpu,
  Sparkles,
  ShieldCheck,
  Search,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import toast from 'react-hot-toast';

export default function ReviewFinding({ finding, onApply }) {
  const [copied, setCopied] = useState(false);

  if (!finding) return null;

  const severity = (finding.severity || 'medium').toLowerCase();
  const isMissingPhrase = finding.type === 'required_phrase_missing' || finding.detectedValue?.toLowerCase().includes('missing') || !finding.problematicText;
  const severityIcons = {
    critical: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
    high: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
    medium: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
    low: <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />,
  };

  const borderSeverities = {
    critical: 'border-l-4 border-l-rose-600 border-slate-200 bg-white',
    high: 'border-l-4 border-l-rose-500 border-slate-200 bg-white',
    medium: 'border-l-4 border-l-amber-500 border-slate-200 bg-white',
    warning: 'border-l-4 border-l-amber-500 border-slate-200 bg-white',
    low: 'border-l-4 border-l-sky-500 border-slate-200 bg-white',
    info: 'border-l-4 border-l-sky-500 border-slate-200 bg-white',
  };

  const cardStyle = borderSeverities[severity] || 'border-l-4 border-l-slate-400 border-slate-200 bg-white';
  const isImageFile = finding.fileName?.match(/\.(png|jpg|jpeg|webp)$/i);

  const flaggedText = finding.problematicText || finding.originalText || '';
  const correction = finding.suggestedCorrection || finding.suggestion || '';
  const findingTitle = finding.title || finding.finding || (finding.type ? finding.type.replace(/_/g, ' ') : 'Compliance Finding');
  const source = finding.analysisSource || (finding.sourceType === 'ai_analysis' ? 'gemini' : 'rule_based');

  const handleCopy = () => {
    if (!correction) return;
    navigator.clipboard.writeText(correction);
    setCopied(true);
    toast.success('Suggested correction copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border p-5 shadow-xs transition-all hover:shadow-md ${cardStyle}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {severityIcons[severity] || <Info className="h-5 w-5 text-slate-400" />}
          <h4 className="text-sm font-bold text-slate-900 capitalize">{findingTitle}</h4>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Analysis Source Badge */}
          {source === 'both' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="h-3 w-3" />
              Verified (Rules + AI)
            </span>
          ) : source === 'gemini' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="h-3 w-3" />
              Gemini AI
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Cpu className="h-3 w-3" />
              Rule-Based
            </span>
          )}

          {finding.category && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 capitalize">
              {finding.category.replace(/_/g, ' ')}
            </span>
          )}
          <StatusBadge status={finding.severity} type="severity" />
        </div>
      </div>

      <div className="mt-3.5 space-y-3">
        {/* Source File and Location Badge */}
        {(finding.fileName || finding.location || finding.pageNumber) && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 text-xs border border-slate-200">
            {isImageFile ? (
              <ImageIcon className="h-3.5 w-3.5 text-teal-600" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-teal-600" />
            )}
            <span className="font-semibold text-slate-800">
              {finding.fileName || (finding.reviewModality === 'document' ? 'Submitted Document' : 'Submitted Copy')}
            </span>
            {(finding.location || finding.pageNumber) && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {finding.location || `Page ${finding.pageNumber}`}
                </span>
              </>
            )}
          </div>
        )}

        {/* Flagged Text */}
        {flaggedText && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mt-0.5 flex-shrink-0">
              Flagged text:
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono border border-rose-200/60 font-semibold break-all">
              "{flaggedText}"
            </span>
          </div>
        )}

        {/* Expected vs Detected Comparison Pill */}
        {(finding.expectedValue || finding.detectedValue) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            {finding.detectedValue && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-0.5">
                  Detected Value
                </span>
                <span className="font-mono text-slate-800 font-medium">{finding.detectedValue}</span>
              </div>
            )}
            {finding.expectedValue && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-0.5">
                  Approved / Expected
                </span>
                <span className="font-mono text-slate-800 font-semibold">{finding.expectedValue}</span>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        <p className="text-sm text-slate-600 leading-relaxed">{finding.explanation}</p>

        {/* Suggested Correction */}
        {correction && (
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-teal-900">Suggested Correction</p>
                <p className="text-xs text-teal-700 mt-0.5">{correction}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy suggested correction"
                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              {onApply && (
                <button
                  type="button"
                  onClick={() => onApply(finding)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  title={isMissingPhrase ? "Add this required phrase into your draft copy" : "Replace flagged text with approved value in your draft copy"}
                >
                  {isMissingPhrase ? 'Add to Draft' : 'Apply Fix'}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Evidence Source Citation */}
        {(finding.evidenceName || finding.evidenceSource || finding.evidence) && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-400">
            <FileCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Evidence Citation:{' '}
              <strong className="text-slate-600 font-medium">
                {finding.evidenceName || finding.evidenceSource || finding.evidence}
              </strong>
              {finding.evidenceId && (
                <span className="ml-1 text-[10px] text-slate-400 font-mono">[{finding.evidenceId}]</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
