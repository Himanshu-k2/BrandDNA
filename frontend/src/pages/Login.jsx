import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Loader2, ArrowRight, Sparkles, Briefcase, PenTool, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const data = await login(form);
      toast.success(`Welcome back, ${data.user.name}`);
      const targetRoute = location.state?.from?.pathname || getDashboardRoute(data.user.role);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/25">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Brand<span className="text-teal-400">DNA</span>
          </span>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white">
          Sign in to your brand portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Role-governed AI brand consistency & compliance platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in to Portal
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Logins for Hackathon Judges across All Roles */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-2.5 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" /> 1-Click Role Switcher (Demo Accounts)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@demobrands.test', 'DemoPasswordSecure2026!')}
                className="flex flex-col items-center p-2 text-center bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 transition-all cursor-pointer"
                title="Platform Admin: User mgmt, review queue, audit logs"
              >
                <Lock className="h-4 w-4 mb-1 text-purple-600" />
                <span className="text-[11px] font-bold">Admin</span>
                <span className="text-[9px] text-purple-500">Platform Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reviewer@demobrands.test', 'DemoPasswordSecure2026!')}
                className="flex flex-col items-center p-2 text-center bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 transition-all cursor-pointer"
                title="Reviewer: Approval queue, human sign-off, request changes, reject"
              >
                <ShieldCheck className="h-4 w-4 mb-1 text-amber-600" />
                <span className="text-[11px] font-bold">Reviewer</span>
                <span className="text-[9px] text-amber-500">Review Board</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('brandmanager@branddna.com', 'password123')}
                className="flex flex-col items-center p-2 text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-all cursor-pointer"
                title="Brand Manager: Brand identity, PDF/image upload, staged rule approval"
              >
                <Briefcase className="h-4 w-4 mb-1 text-indigo-600" />
                <span className="text-[11px] font-bold">Brand Mgr</span>
                <span className="text-[9px] text-indigo-500">Priya Kapoor</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('creator@demobrands.test', 'DemoPasswordSecure2026!')}
                className="flex flex-col items-center p-2 text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                title="Content Creator: Draft studio, AI checks, fix & submit"
              >
                <PenTool className="h-4 w-4 mb-1 text-emerald-600" />
                <span className="text-[11px] font-bold">Creator</span>
                <span className="text-[9px] text-emerald-500">Content Studio</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              Need a new account?{' '}
              <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700">
                Register as Creator or Manager
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
