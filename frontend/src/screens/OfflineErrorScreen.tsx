import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, WifiOff, LogIn } from 'lucide-react';
import { Logo } from '@/components/mono/Logo';
import { Characters } from '@/screens/login/Characters';

interface OfflineErrorScreenProps {
  forcedOffline?: boolean;
  forced404?: boolean;
}

export function OfflineErrorScreen({
  forcedOffline = false,
  forced404 = false
}: OfflineErrorScreenProps) {
  const navigate = useNavigate();
  const [isOffline, setIsOffline] = useState(
    forcedOffline || (typeof navigator !== 'undefined' ? !navigator.onLine : false)
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="mono mono-wash relative flex min-h-dvh flex-col justify-between p-6 sm:p-10 bg-paper">
      {/* ── BrandDNA Logo in Top Left (Matches User Sketch) ── */}
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="cursor-pointer focus-visible:outline-2 focus-visible:outline-ink rounded-lg"
          aria-label="BrandDNA Home"
        >
          <Logo variant="horizontal" size="md" />
        </button>

        {isOffline && (
          <div className="flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200/80 px-3.5 py-1 text-caption font-semibold text-rose-700">
            <WifiOff className="size-3.5" /> Offline Mode
          </div>
        )}
      </header>

      {/* ── Center Stage: Shapes Above 404 Text ── */}
      <main className="my-auto flex flex-col items-center justify-center py-6 text-center">
        {/* Animated Expressive Shapes / Characters Centered Above Text */}
        <div className="flex justify-center scale-[0.72] sm:scale-85 md:scale-95 origin-center select-none">
          <Characters isError={true} />
        </div>

        {/* 404 Text & Status Messages */}
        <div className="mt-2 flex flex-col items-center gap-2 max-w-lg">
          <span className="font-display text-6xl sm:text-7xl font-black tracking-tight text-ink">
            {forced404 ? '404' : isOffline ? 'Offline' : 'Notice'}
          </span>

          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {isOffline
              ? 'No Internet Connection'
              : forced404
              ? 'Page Not Found'
              : 'Something went wrong'}
          </h1>

          <p className="text-body text-graphite max-w-md mt-1 leading-relaxed">
            {isOffline
              ? 'Your internet connection appears to be offline. Check your network or Wi-Fi settings and refresh the page.'
              : 'We couldn’t find the page you’re looking for. Return to the sign-in screen to continue.'}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="press flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-ui font-semibold text-paper hover:bg-graphite transition-all shadow-sm cursor-pointer"
            >
              <RotateCcw className="size-4" /> Refresh the page
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="press flex items-center gap-2 rounded-full border border-silver bg-paper px-6 py-3 text-ui font-semibold text-ink hover:bg-silver/30 transition-all cursor-pointer"
            >
              <LogIn className="size-4" /> Return to Sign In
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center text-[12px] text-mid">
        BrandDNA Continuous Governance Engine · System status resilient
      </footer>
    </div>
  );
}
