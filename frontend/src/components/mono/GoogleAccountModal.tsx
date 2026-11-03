import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, X } from 'lucide-react';
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
}

const GOOGLE_ACCOUNTS: GoogleAccount[] = [
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
            className="relative w-full max-w-[420px] rounded-3xl border border-silver/90 bg-paper p-6 sm:p-8 shadow-float text-left"
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

            {/* Google G Logo & Heading */}
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
            <div className="mt-6 flex flex-col divide-y divide-silver/40 border-y border-silver/40">
              {GOOGLE_ACCOUNTS.map(account => (
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
                    <span className="truncate text-ui font-semibold text-ink group-hover:text-ink">
                      {account.name}
                    </span>
                    <span className="truncate text-caption text-graphite">
                      {account.email}
                    </span>
                    <span className="mt-0.5 inline-block text-[11px] font-medium text-mid">
                      {account.roleLabel}
                    </span>
                  </div>
                </button>
              ))}

              {/* Use Another Account */}
              <button
                type="button"
                onClick={() => onSelectAccount(GOOGLE_ACCOUNTS[0])}
                className="group flex w-full items-center gap-3.5 py-3.5 text-left transition-colors hover:bg-silver/20 px-2 rounded-xl cursor-pointer"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-silver bg-silver/20 text-graphite group-hover:border-mid group-hover:text-ink">
                  <UserPlus className="size-4" />
                </span>
                <span className="text-ui font-medium text-ink">
                  Use another account
                </span>
              </button>
            </div>

            {/* Google OAuth Legal Notice */}
            <p className="mt-6 text-[11px] leading-relaxed text-mid text-center">
              To continue, Google will share your name, email address, language preference, and profile picture with BrandDNA. See BrandDNA’s Privacy Policy and Terms of Service.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
