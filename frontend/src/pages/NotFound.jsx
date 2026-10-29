import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <ShieldAlert className="h-8 w-8 text-teal-600" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">404</h1>
      <h2 className="text-base font-bold text-slate-700 mt-1">Page Not Found</h2>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        The brand workspace or review report you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-600/20 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
