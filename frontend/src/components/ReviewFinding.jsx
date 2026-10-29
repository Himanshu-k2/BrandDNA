import { AlertCircle, AlertTriangle, Info, CheckCircle2, FileText, ArrowRight, FileCheck, Image as ImageIcon } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ReviewFinding({ finding, onApply }) {
  if (!finding) return null;

  const severityIcons = {
    critical: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />
  };

  const borderSeverities = {
    critical: 'border-l-4 border-l-rose-500 border-slate-200 bg-white',
    warning: 'border-l-4 border-l-amber-500 border-slate-200 bg-white',
    info: 'border-l-4 border-l-sky-500 border-slate-200 bg-white'
  };

  const cardStyle = borderSeverities[finding.severity?.toLowerCase()] || 'border-l-4 border-l-slate-400 border-slate-200 bg-white';

  const isImageFile = finding.fileName?.match(/\.(png|jpg|jpeg|webp)$/i);

  return (
    <div className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${cardStyle}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {severityIcons[finding.severity?.toLowerCase()] || <Info className="h-5 w-5 text-slate-400" />}
          <h4 className="text-sm font-bold text-slate-900">{finding.finding}</h4>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
        {(finding.fileName || finding.location) && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200">
            {isImageFile ? (
              <ImageIcon className="h-3.5 w-3.5 text-teal-600" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-teal-600" />
            )}
            <span className="font-bold text-slate-800">{finding.fileName || 'Submitted Document'}</span>
            {finding.location && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-mono text-[11px]">{finding.location}</span>
              </>
            )}
          </div>
        )}

        {/* Original Text highlighted */}
        {finding.originalText && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mt-0.5">Flagged:</span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono border border-rose-200/60 font-semibold break-all">
              "{finding.originalText}"
            </span>
          </div>
        )}

        {/* Explanation */}
        <p className="text-sm text-slate-600 leading-relaxed">
          {finding.explanation}
        </p>

        {/* Suggested Correction */}
        {finding.suggestion && (
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-teal-900">Suggested Correction</p>
                <p className="text-xs text-teal-700 mt-0.5">{finding.suggestion}</p>
              </div>
            </div>
            {onApply && (
              <button
                type="button"
                onClick={() => onApply(finding)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                Apply
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Evidence Source Citation */}
        {finding.evidenceSource && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-400">
            <FileCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>Citation: <strong className="text-slate-600 font-medium">{finding.evidenceSource}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
