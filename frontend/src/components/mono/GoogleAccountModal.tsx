import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, X, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { GoogleMark } from '@/components/mono/Brand';
import { useDismiss } from '@/hooks/useDismiss';
import { type Role } from '@/state/session';

export interface GoogleAccount {
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  avatarBg: string;
  initials: string;
  isCustom?: boolean;
}

const DEFAULT_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    name: 'Alex Rivera',
    email: 'creator@demobrands.test',
    role: 'creator',
    roleLabel: 'Creator · Content Studio',
    avatarBg: 'bg-[#0F9D58]', // Google Green
    initials: 'AR'
  },
  {
    name: 'Priya Kapoor',
    email: 'brandmanager@branddna.com',
    role: 'brand_manager',
    roleLabel: 'Brand Manager · Governance',
    avatarBg: 'bg-[#4285F4]', // Google Blue
    initials: 'PK'
  },
  {
    name: 'Jordan Blake',
    email: 'admin@demobrands.test',
    role: 'admin',
    roleLabel: 'Platform Admin · Security & Ops',
    avatarBg: 'bg-[#DB4437]', // Google Red
    initials: 'JB'
  }
];

const SAVED_ACCOUNTS_KEY = 'branddna_saved_google_accounts';

function readSavedAccounts(): GoogleAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: GoogleAccount) => void;
}

export function GoogleAccountModal({
  isOpen,
  onClose,
  onSelectAccount
}: GoogleAccountModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useDismiss(modalRef, isOpen, onClose);

  const [view, setView] = useState<'list' | 'custom'>('list');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<Role>('brand_manager');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<GoogleAccount[]>([]);

  // Load saved accounts on open
  useEffect(() => {
    if (isOpen) {
      setSavedAccounts(readSavedAccounts());
      setView('list');
      setErrorMessage('');
    }
  }, [isOpen]);

  const allAccounts = [...savedAccounts, ...DEFAULT_GOOGLE_ACCOUNTS];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const emailTrimmed = customEmail.trim();
    if (!emailTrimmed) {
      setErrorMessage('Enter your original Gmail or Google Workspace email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    const nameTrimmed =
      customName.trim() ||
      emailTrimmed.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const initials = nameTrimmed
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'GU';

    const roleLabels: Record<Role, string> = {
      brand_manager: 'Brand Manager · Governance',
      creator: 'Creator · Content Studio',
      admin: 'Platform Admin · Security & Ops'
    };

    const newAccount: GoogleAccount = {
      name: nameTrimmed,
      email: emailTrimmed,
      role: customRole,
      roleLabel: roleLabels[customRole],
      avatarBg: 'bg-[#4285F4]', // Google Blue
      initials,
      isCustom: true
    };

    // Save to localStorage for quick re-use
    const updated = [newAccount, ...savedAccounts.filter(a => a.email !== newAccount.email)];
    try {
      window.localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage error
    }

    onSelectAccount(newAccount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-[440px] rounded-3xl border border-silver/90 bg-paper p-6 sm:p-8 shadow-float text-left"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Google account chooser"
              className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-mid hover:bg-silver/40 hover:text-ink transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>

            {/* ── View 1: Choose Account List ── */}
            {view === 'list' ? (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-11 items-center justify-center rounded-full bg-paper shadow-2xs border border-silver/60">
                    <GoogleMark className="size-6" />
                  </div>

                  <h2
                    id="google-modal-title"
                    className="mt-3.5 font-sans text-xl font-bold text-ink"
                  >
                    Choose an account
                  </h2>
                  <p className="mt-1 text-caption text-graphite">
                    to continue to <strong className="text-ink">BrandDNA</strong>
                  </p>
                </div>

                {/* Account List */}
                <div className="mt-6 flex flex-col divide-y divide-silver/40 border-y border-silver/40 max-h-[300px] overflow-y-auto">
                  {allAccounts.map(account => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => onSelectAccount(account)}
                      className="group flex w-full items-center gap-3.5 py-3.5 text-left transition-colors hover:bg-silver/20 px-2 rounded-xl cursor-pointer"
                    >
                      <span
                        style={{ color: '#ffffff' }}
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${account.avatarBg} text-ui font-bold !text-white text-white shadow-2xs`}
                      >
                        {account.initials}
                      </span>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-ui font-semibold text-ink">
                            {account.name}
                          </span>
                          {account.isCustom && (
                            <span className="rounded bg-brand-orange/10 px-1.5 py-0.2 text-[10px] font-bold text-brand-orange">
                              Your Gmail
                            </span>
                          )}
                        </div>
                        <span className="truncate text-caption text-graphite">
                          {account.email}
                        </span>
                        <span className="mt-0.5 inline-block text-[11px] font-medium text-mid">
                          {account.roleLabel}
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Use Another Account Button -> Switches to Custom Form */}
                  <button
                    type="button"
                    onClick={() => {
                      setView('custom');
                      setErrorMessage('');
                    }}
                    className="group flex w-full items-center gap-3.5 py-3.5 text-left transition-colors hover:bg-silver/20 px-2 rounded-xl cursor-pointer"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-silver bg-silver/20 text-graphite group-hover:border-mid group-hover:text-ink">
                      <UserPlus className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-ui font-semibold text-ink">
                        Use another account
                      </span>
                      <span className="text-[11px] text-mid">
                        Sign in with your original Gmail or create a new account
                      </span>
                    </div>
                  </button>
                </div>

                {/* Google OAuth Legal Notice */}
                <p className="mt-5 text-[11px] leading-relaxed text-mid text-center">
                  To continue, Google will share your name, email address, language preference, and profile picture with BrandDNA. See BrandDNA’s Privacy Policy.
                </p>
              </>
            ) : (
              /* ── View 2: Original Gmail Account / Create New Account ── */
              <form onSubmit={handleCustomSubmit} className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="flex size-7 items-center justify-center rounded-full hover:bg-silver/30 text-graphite hover:text-ink transition-colors cursor-pointer"
                    title="Back to account list"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <GoogleMark className="size-5" />
                    <span className="text-caption font-semibold text-graphite">
                      Google Accounts
                    </span>
                  </div>
                </div>

                <h2 className="font-sans text-xl font-bold text-ink mt-1">
                  {isNewAccount ? 'Create a BrandDNA account' : 'Sign in with your Google account'}
                </h2>
                <p className="text-caption text-graphite mt-1">
                  Enter your original Gmail address to log in or create your personalized workspace.
                </p>

                {errorMessage && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-caption font-medium text-rose-700">
                    {errorMessage}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3.5">
                  {/* Original Gmail Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                      Your Gmail / Google Email
                    </label>
                    <input
                      type="email"
                      autoFocus
                      required
                      value={customEmail}
                      onChange={e => setCustomEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="h-11 rounded-xl border border-silver/90 bg-paper px-3.5 text-ui text-ink placeholder:text-mid focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all"
                    />
                  </div>

                  {/* Full Name Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      placeholder="e.g. Shekhar Sharma"
                      className="h-11 rounded-xl border border-silver/90 bg-paper px-3.5 text-ui text-ink placeholder:text-mid focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all"
                    />
                  </div>

                  {/* Role Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                      Select Workspace Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'brand_manager', label: 'Brand Manager' },
                        { id: 'creator', label: 'Creator' },
                        { id: 'admin', label: 'Admin' }
                      ].map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setCustomRole(r.id as Role)}
                          className={`flex items-center justify-center rounded-xl border p-2 text-center text-caption font-semibold transition-all cursor-pointer ${
                            customRole === r.id
                              ? 'border-ink bg-ink text-paper shadow-xs'
                              : 'border-silver bg-paper text-graphite hover:border-mid hover:text-ink'
                          }`}
                        >
                          {customRole === r.id && <Check className="size-3 mr-1" />}
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* New Account Toggle Checkbox */}
                  <label className="mt-1 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isNewAccount}
                      onChange={e => setIsNewAccount(e.target.checked)}
                      className="size-4 rounded accent-ink cursor-pointer"
                    />
                    <span className="text-caption text-graphite font-medium">
                      Create as a brand new account and register workspace
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="press rounded-full border border-silver bg-paper px-4 py-2 text-caption font-semibold text-graphite hover:bg-silver/20 hover:text-ink transition-colors cursor-pointer"
                  >
                    Back to accounts
                  </button>

                  <button
                    type="submit"
                    className="press flex items-center gap-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] px-5 py-2.5 text-caption font-bold text-white shadow-sm transition-colors cursor-pointer"
                  >
                    <Sparkles className="size-3.5" />
                    {isNewAccount ? 'Create & Sign In' : 'Continue with Google'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
