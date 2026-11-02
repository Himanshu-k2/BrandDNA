import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-react';

import { GoogleMark } from '@/components/mono/Brand';
import { Logo } from '@/components/mono/Logo';
import { FloatingField, MonoCheckbox } from '@/components/mono/FloatingField';
import { RevealText } from '@/components/mono/RevealText';
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
  const { setRole } = useSession();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
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
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => {
    document.title = 'Log in | BrandDNA';
  }, []);

  const busy = status === 'loading' || status === 'google';
  const fieldVariants = reduce ? riseReduced : rise;

  /** Loading → login fades out while the logo splash scales in → dashboard. */
  const enter = async (role: Role, userEmail?: string, userPass?: string) => {
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
    } catch (apiErr) {
      console.warn('Backend authentication notice (using session fallback):', apiErr);
    }

    setRole(role);
    timers.current.push(
      window.setTimeout(() => setLeaving(true), 640),
      window.setTimeout(() => navigate(dashboardPath(role)), 640 + 720)
    );
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

  const pickDemo = (role: Role) => {
    setDemo(role);
    setEmail(PERSONAS[role].email);
    setPassword(DEMO_PASSWORD);
    resetFeedback();
  };

  return (
    <>
    <motion.div
      className="mono mono-wash flex min-h-dvh gap-4 p-4"
      initial={{ opacity: 0 }}
      animate={leaving ? { opacity: 0, scale: reduce ? 1 : 0.98 } : { opacity: 1, scale: 1 }}
      transition={{ duration: leaving ? 0.32 : DURATION.base, ease: EASE }}
    >
      {/* Illustration */}
      <section className="relative hidden flex-1 flex-col justify-between overflow-hidden rounded-shell bg-silver/40 p-12 lg:flex">
        <span />
        <div className="flex justify-center pr-16">
          <Characters
            isPasswordFocused={isPasswordFocused}
            isEmailFocused={isEmailFocused}
            isError={status === 'error'}
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

          <RevealText text="Welcome back!" className="mt-8 text-center font-display text-display font-semibold tracking-tight text-ink" delay={0.12} />
          <motion.p className="mt-2 text-center text-body text-graphite" variants={fieldVariants} custom={2} initial="hidden" animate="show">
            Sign in to your brand workspace.
          </motion.p>

          <form className="mt-8 flex flex-col" onSubmit={submit} noValidate>
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
                onClick={() => {
                  setStatus('google');
                  enter('creator');
                }}
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
        </div>

        <p className="mt-8 text-center text-caption text-graphite">
          Don’t have an account?{' '}
          <button
            type="button"
            className="cursor-pointer font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ink"
            onClick={() => setNotice('Your workspace admin manages invites. Contact them for access.')}
          >
            Request invite
          </button>
        </p>
      </section>
    </motion.div>

    {/* Login → dashboard splash: stacked xl lockup on Clean White. */}
    <AnimatePresence>
      {leaving && (
        <motion.div
          role="status"
          aria-label="Opening BrandDNA"
          className="fixed inset-0 z-50 flex items-center justify-center bg-paper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.fast, ease: EASE }}
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DURATION.base, delay: 0.08, ease: EASE }}
          >
            <Logo variant="horizontal" size="xl" reveal decorative />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
