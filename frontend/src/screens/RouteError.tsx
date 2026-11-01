import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { Logo } from '@/components/mono/Logo';
import { Button, ICON } from '@/components/mono/ui';
import { DURATION, EASE } from '@/lib/motion';
import { dashboardPath, useSession } from '@/state/session';

/** Full-page error / not-found state: logo mark (lg) above the message, on Clean White. */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { persona } = useSession();
  const reduce = useReducedMotion();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const title = notFound ? 'Page not found' : 'Something went wrong';
  const body = notFound
    ? 'The page you were looking for does not exist or has moved.'
    : 'This page hit an unexpected error. Your work in other tabs is safe — try again, or head back to your dashboard.';

  if (typeof document !== 'undefined') document.title = `${title} | BrandDNA`;

  return (
    <main className="mono mono-wash flex min-h-dvh items-center justify-center p-4 md:p-6">
      <motion.section
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE }}
        className="flex w-full max-w-xl flex-col items-center gap-6 rounded-shell bg-paper px-6 py-16 text-center shadow-float sm:px-16"
      >
        <Logo variant="mark" size="lg" />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display font-semibold tracking-tight text-ink">{title}</h1>
          <p className="text-body text-graphite">{body}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="lg" onClick={() => window.location.reload()}>
            <RotateCcw className="size-5" {...ICON} /> Try again
          </Button>
          <Button size="lg" onClick={() => navigate(dashboardPath(persona.role))}>
            Back to dashboard
          </Button>
        </div>
      </motion.section>
    </main>
  );
}
