import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this content.',
  onRetry = null
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-red-50/50 rounded-2xl border border-red-200">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-red-600 mt-1 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
          Try Again
        </button>
      )}
    </div>
  );
}
