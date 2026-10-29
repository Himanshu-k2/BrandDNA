import { Loader2 } from 'lucide-react';

export default function LoadingState({ fullPage, message = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200/80 max-w-sm w-full mx-4">
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-teal-100">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
          <p className="text-slate-800 font-semibold">{message}</p>
          <p className="text-slate-400 text-xs mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-3 border border-teal-100">
        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
      </div>
      <p className="text-slate-600 font-medium text-sm">{message}</p>
    </div>
  );
}
