import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleAlert, Eye, EyeOff, LoaderCircle, CheckCircle2, Sparkles, ArrowLeft } from 'lucide-react';

import { GoogleMark } from '@/components/mono/Brand';
import { Logo } from '@/components/mono/Logo';
import { FloatingField, MonoCheckbox } from '@/components/mono/FloatingField';
import { RevealText } from '@/components/mono/RevealText';
import { GoogleAccountModal, type GoogleAccount } from '@/components/mono/GoogleAccountModal';
import { WorkspaceSkeleton } from '@/components/mono/WorkspaceSkeleton';
import { OfflineErrorScreen } from '@/screens/OfflineErrorScreen';
import { RequestInviteModal } from '@/screens/login/RequestInviteModal';
import { registerUser } from '@/data/invitations';
import { cn } from '@/lib/cn';
import { DURATION, EASE, rise, riseReduced } from '@/lib/motion';
import { Characters } from '@/screens/login/Characters';
import { dashboardPath, PERSONAS, useSession, type Role } from '@/state/session';
import { authAPI } from '@/api/auth';

const DEMO_PASSWORD = 'branddna-demo';
const ORDER: Role[] = ['brand_manager', 'creator', 'admin'];
const DEMO_LABEL: Record<Role, string> = {
  brand_manager: 'Brand Manager',
  creator: 'Creator',
  admin: 'Admin'
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'loading' | 'google' | 'error';

const primaryButton =
  'press flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-ui font-medium transition-[background-color,transform] duration-200 ease-(--ease-refined) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress hover:scale-[1.02]';

export function LoginScreen() {
  const { setRole, setCustomUser } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduce = useReducedMotion();

  // URL query params for Account Activation Flow (dispatched via Invitation Email)
  const isActivationMode = searchParams.get('mode') === 'activate';
  const activationEmail = searchParams.get('email') || '';
  const activationName = searchParams.get('name') || '';
  const activationRole = (searchParams.get('role') as Role) || 'creator';
  const activationBrand = searchParams.get('brand') || 'NovaFit Health';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [status, setStatus] = useState<Status>('idle');
  const [notice, setNotice] = useState('');
  const [demo, setDemo] = useState<Role | null>(null);
  const [transitionStep, setTransitionStep] = useState<'idle' | 'logo_splash' | 'skeleton' | 'navigating'>('idle');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isRequestInviteOpen, setIsRequestInviteOpen] = useState(false);
  const [inviteSuccessNotice, setInviteSuccessNotice] = useState('');
  const [isOfflineError, setIsOfflineError] = useState(false);

  // Activation password creation states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activationError, setActivationError] = useState('');

  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => {
    document.title = isActivationMode ? 'Activate Account | BrandDNA' : 'Log in | BrandDNA';
  }, [isActivationMode]);

  const busy = status === 'loading' || status === 'google' || transitionStep !== 'idle';
  const fieldVariants = reduce ? riseReduced : rise;

  /** Sequence: Sign In clicked → 1. BrandDNA logo center aligned → 2. Skeleton screen loader → 3. Dashboard */
  const enter = async (role: Role, userEmail?: string, userPass?: string) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOfflineError(true);
      return;
    }

    // Step 1: Center-aligned BrandDNA Logo Splash Screen
    setTransitionStep('logo_splash');

    try {
      const emailToUse = userEmail || PERSONAS[role].email;
      const passToUse = userPass || 'DemoPasswordSecure2026!';
      const res = await authAPI.login({
        email: emailToUse,
        password: passToUse === DEMO_PASSWORD ? 'DemoPasswordSecure2026!' : passToUse
      });
      if (res.data?.data?.token) {
        localStorage.setItem('branddna_token', res.data.data.token);
        localStorage.setItem('branddna_user', JSON.stringify(res.data.data.user));
      }
    } catch (apiErr: any) {
      if (apiErr?.code === 'ERR_NETWORK' || !navigator.onLine) {
        setTransitionStep('idle');
        setIsOfflineError(true);
        return;
      }
      console.warn('Backend authentication notice (using session fallback):', apiErr);
    }

    setRole(role);

    // Step 2: After 850ms of center-aligned logo splash, load the exact skeleton screen loader
    timers.current.push(
      window.setTimeout(() => {
        setTransitionStep('skeleton');
      }, 850),
      // Step 3: After skeleton loader finishes (~1800ms), navigate to the actual dashboard
      window.setTimeout(() => {
        setTransitionStep('navigating');
        navigate(dashboardPath(role));
      }, 850 + 1800)
    );
  };

  const handleSelectGoogleAccount = (account: GoogleAccount) => {
    setIsGoogleModalOpen(false);
    setStatus('google');

    // Register user in storage so they appear at the TOP of Admin User & Role Mgmt
    registerUser({
      name: account.name,
      email: account.email,
      role: account.role,
      initials: account.initials,
      status: 'active'
    });

    setCustomUser({
      name: account.name,
      email: account.email,
      role: account.role,
      initials: account.initials
    });

    void enter(account.role, account.email);
  };

  const resetFeedback = () => {
    if (status === 'error') setStatus('idle');
    setErrors({});
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'That email doesn’t look right.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (next.email || next.password) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    const matchedRole = ORDER.find(role => PERSONAS[role].email === email.trim().toLowerCase()) ?? 'creator';
    void enter(matchedRole, email.trim(), password);
  };

  const handleActivationSubmit = (event: FormEvent) => {
    event.preventDefault();
    setActivationError('');

    if (!newPassword || newPassword.length < 6) {
      setActivationError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setActivationError('Passwords do not match. Please verify both fields.');
      return;
    }

    setStatus('loading');

    // Register new employee as active user with their selected role and brand
    registerUser({
      name: activationName || activationEmail.split('@')[0],
      email: activationEmail,
      role: activationRole,
      status: 'active',
      brands: [activationBrand]
    });

    setCustomUser({
      name: activationName || activationEmail.split('@')[0],
      email: activationEmail,
      role: activationRole
    });

    void enter(activationRole, activationEmail, newPassword);
  };

  const pickDemo = (role: Role) => {
    setDemo(role);
    setEmail(PERSONAS[role].email);
    setPassword(DEMO_PASSWORD);
    setCustomUser(null);
    resetFeedback();
  };

  if (isOfflineError) {
    return <OfflineErrorScreen forcedOffline={true} />;
  }

  return (
    <>
    {/* 1. Center-aligned BrandDNA Logo Splash Screen */}
    <AnimatePresence>
      {transitionStep === 'logo_splash' && (
        <motion.div
          role="status"
          aria-label="Opening BrandDNA"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Logo variant="horizontal" size="xl" reveal decorative />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* 2. Skeleton Screen Loader (Exact Dashboard Layout with Shimmer) */}
    <AnimatePresence>
      {transitionStep === 'skeleton' && (
        <WorkspaceSkeleton />
      )}
    </AnimatePresence>

    {/* Google Account Chooser Modal */}
    <GoogleAccountModal
      isOpen={isGoogleModalOpen}
      onClose={() => setIsGoogleModalOpen(false)}
      onSelectAccount={handleSelectGoogleAccount}
    />

    {/* Request Invite Modal */}
    <RequestInviteModal
      isOpen={isRequestInviteOpen}
      onClose={() => setIsRequestInviteOpen(false)}
      onSuccess={(name, submittedEmail) => {
        setInviteSuccessNotice(`Joining request received for ${name} (${submittedEmail}). Administrator will review and dispatch an email invitation.`);
      }}
    />

    <motion.div
      className="mono mono-wash flex min-h-dvh gap-4 p-4"
      initial={{ opacity: 0 }}
      animate={transitionStep !== 'idle' ? { opacity: 0, scale: reduce ? 1 : 0.98 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {/* Illustration */}
      <section className="relative hidden flex-1 flex-col justify-between overflow-hidden rounded-shell bg-silver/40 p-12 lg:flex">
        <span />
        <div className="flex justify-center pr-16">
          <Characters
            isPasswordFocused={isPasswordFocused}
            isEmailFocused={isEmailFocused}
            isError={status === 'error' || Boolean(activationError)}
            isSuccess={busy}
          />
        </div>
        <Logo variant="horizontal" size="md" />
      </section>

      {/* Form panel */}
      <section className="flex w-full flex-col rounded-shell bg-paper px-6 py-12 shadow-float sm:px-16 lg:w-[44%] lg:max-w-[640px]">
        <div className="mx-auto my-auto flex w-full max-w-[400px] flex-col">
          <motion.div className="flex justify-center" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: DURATION.base, ease: EASE }}>
            <Logo variant="horizontal" size="lg" />
          </motion.div>

          {/* If the employee arrived via an Invitation Email Link (/login?mode=activate) */}
          {isActivationMode ? (
            <div className="mt-8 flex flex-col">
              <RevealText text="Set Up Your Account" className="text-center font-display text-display font-semibold tracking-tight text-ink" delay={0.12} />
              <motion.p className="mt-2 text-center text-caption text-graphite" variants={fieldVariants} custom={2} initial="hidden" animate="show">
                Welcome <strong className="text-ink">{activationName || 'Team Member'}</strong>! Create your new password to activate your BrandDNA access.
              </motion.p>

              {/* Verified Role and Brand Badge */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[12px] font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  Invitation Accepted
                </span>
                <span className="rounded-full bg-silver/40 border border-silver px-3 py-1 text-[12px] font-semibold text-ink">
                  {activationRole === 'brand_manager' ? 'Brand Manager' : 'Content Creator'} · {activationBrand}
                </span>
              </div>

              {activationError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-caption font-medium text-rose-700">
                  {activationError}
                </div>
              )}

              <form onSubmit={handleActivationSubmit} className="mt-6 flex flex-col gap-4">
                {/* Verified Email Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                    Verified Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={activationEmail}
                    className="h-11 w-full rounded-xl border border-silver/80 bg-silver/20 px-3.5 text-ui font-medium text-graphite cursor-not-allowed"
                  />
                </div>

                {/* Create New Password Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                    Create New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter a secure password (min 6 chars)"
                      className="h-11 w-full rounded-xl border border-silver/90 bg-paper pl-3.5 pr-10 text-ui text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mid hover:text-ink cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                    Confirm Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-11 w-full rounded-xl border border-silver/90 bg-paper px-3.5 text-ui text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all"
                  />
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={busy}
                  className={cn(primaryButton, 'mt-2 bg-ink text-paper hover:bg-graphite')}
                >
                  {status === 'loading' ? (
                    <>
                      <LoaderCircle className="size-5 animate-spin" strokeWidth={1.5} /> Setting up workspace…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 text-brand-orange" />
                      Create Password & Sign In as {activationRole === 'brand_manager' ? 'Brand Manager' : 'Creator'}
                    </>
                  )}
                </button>

                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setSearchParams({})}
                    className="cursor-pointer text-caption text-graphite hover:text-ink underline-offset-4 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="size-3.5" /> Return to standard sign-in
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Sign-In Form */
            <>
              <RevealText text="Welcome back!" className="mt-8 text-center font-display text-display font-semibold tracking-tight text-ink" delay={0.12} />
              <motion.p className="mt-2 text-center text-body text-graphite" variants={fieldVariants} custom={2} initial="hidden" animate="show">
                Sign in to your brand workspace.
              </motion.p>

              {inviteSuccessNotice && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-caption text-emerald-800 flex items-start gap-2 text-left">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{inviteSuccessNotice}</span>
                </div>
              )}

              <form className="mt-6 flex flex-col" onSubmit={submit} noValidate>
                <motion.div variants={fieldVariants} custom={3} initial="hidden" animate="show">
                  <FloatingField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    error={errors.email}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    onChange={event => {
                      setEmail(event.target.value);
                      setDemo(null);
                      resetFeedback();
                    }}
                  />
                </motion.div>
                <motion.div className="mt-4" variants={fieldVariants} custom={4} initial="hidden" animate="show">
                  <FloatingField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    error={errors.password}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    onChange={event => {
                      setPassword(event.target.value);
                      resetFeedback();
                    }}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword(value => !value)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="press flex size-10 cursor-pointer items-center justify-center rounded-full text-graphite transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
                      >
                        {showPassword ? <EyeOff className="size-5" strokeWidth={1.5} /> : <Eye className="size-5" strokeWidth={1.5} />}
                      </button>
                    }
                  />
                </motion.div>

                <motion.div className="mt-6 flex items-center justify-between gap-4" variants={fieldVariants} custom={5} initial="hidden" animate="show">
                  <MonoCheckbox checked={remember} onChange={setRemember}>
                    Remember for 30 days
                  </MonoCheckbox>
                  <button
                    type="button"
                    className="cursor-pointer text-caption text-graphite underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-ink"
                    onClick={() => setNotice(EMAIL_PATTERN.test(email.trim()) ? `Reset link sent to ${email.trim()}.` : 'Enter your email above to receive a reset link.')}
                  >
                    Forgot password?
                  </button>
                </motion.div>

                <div className="min-h-8 pt-2" aria-live="polite">
                  {notice && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.fast, ease: EASE }} className="text-caption text-graphite">
                      {notice}
                    </motion.p>
                  )}
                </div>

                <motion.div className="flex flex-col gap-4" variants={fieldVariants} custom={6} initial="hidden" animate="show">
                  <button type="submit" disabled={busy} className={cn(primaryButton, 'bg-ink text-paper hover:bg-graphite')}>
                    {status === 'loading' ? (
                      <>
                        <LoaderCircle className="size-5 animate-spin" strokeWidth={1.5} /> Signing in…
                      </>
                    ) : status === 'error' ? (
                      <>
                        <CircleAlert className="size-5" strokeWidth={1.5} /> Invalid email or password. Try again.
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setIsGoogleModalOpen(true)}
                    className={cn(primaryButton, 'border border-silver bg-paper text-ink hover:bg-silver/40')}
                  >
                    {status === 'google' ? <LoaderCircle className="size-5 animate-spin" strokeWidth={1.5} /> : <GoogleMark />}
                    Sign in with Google
                  </button>
                </motion.div>
              </form>

              <motion.div className="mt-8 flex flex-wrap items-center justify-center gap-2" variants={fieldVariants} custom={7} initial="hidden" animate="show">
                <span className="text-caption text-graphite">Quick sign-in</span>
                {ORDER.map(role => (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={demo === role}
                    onClick={() => pickDemo(role)}
                    className={cn(
                      'press h-8 cursor-pointer rounded-full border px-3 text-caption font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ink',
                      demo === role ? 'border-ink bg-ink text-paper' : 'border-silver bg-paper text-graphite hover:border-mid hover:text-ink'
                    )}
                  >
                    {DEMO_LABEL[role]}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>

        {/* Request Invite CTA at bottom */}
        {!isActivationMode && (
          <p className="mt-8 text-center text-caption text-graphite">
            Don’t have an account?{' '}
            <button
              type="button"
              className="cursor-pointer font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ink"
              onClick={() => setIsRequestInviteOpen(true)}
            >
              Request invite
            </button>
          </p>
        )}
      </section>
    </motion.div>
    </>
  );
}
