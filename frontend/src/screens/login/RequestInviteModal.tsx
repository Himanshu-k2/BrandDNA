import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Building2, Mail, User } from 'lucide-react';
import { Logo } from '@/components/mono/Logo';
import { useDismiss } from '@/hooks/useDismiss';
import { type Role } from '@/state/session';
import { addJoiningRequest } from '@/data/invitations';

interface RequestInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string, email: string) => void;
}

export function RequestInviteModal({
  isOpen,
  onClose,
  onSuccess
}: RequestInviteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useDismiss(modalRef, isOpen, onClose);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [brand, setBrand] = useState('NovaFit Health');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid work or personal email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      addJoiningRequest({
        name: name.trim(),
        email: email.trim(),
        role,
        brand
      });

      setIsSubmitting(false);
      onSuccess(name.trim(), email.trim());
      onClose();
    } catch {
      setIsSubmitting(false);
      setError('Unable to save request. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-invite-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-[460px] rounded-3xl border border-silver/90 bg-paper p-6 sm:p-8 shadow-float text-left"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-mid hover:bg-silver/40 hover:text-ink transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <Logo variant="horizontal" size="md" />

              <h2
                id="request-invite-title"
                className="mt-4 font-sans text-xl font-bold text-ink"
              >
                Request Workspace Access
              </h2>
              <p className="mt-1 text-caption text-graphite max-w-sm">
                Join your organization&rsquo;s BrandDNA workspace. Platform administrators will review your joining request and send an invitation email.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-caption font-medium text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {/* Name field */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-mid" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alfred Harris"
                    className="h-11 w-full rounded-xl border border-silver/90 bg-paper pl-10 pr-3.5 text-ui text-ink placeholder:text-mid focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                  Work Email / Gmail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-mid" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. alfred.harris@company.com"
                    className="h-11 w-full rounded-xl border border-silver/90 bg-paper pl-10 pr-3.5 text-ui text-ink placeholder:text-mid focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all"
                  />
                </div>
              </div>

              {/* Role Requested */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                  Role You are Requesting
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'creator'
                        ? 'border-ink bg-ink text-paper shadow-xs'
                        : 'border-silver bg-paper text-graphite hover:border-mid hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-caption">Content Creator</span>
                      {role === 'creator' && <Check className="size-3.5" />}
                    </div>
                    <span className={`text-[11px] mt-0.5 ${role === 'creator' ? 'text-silver' : 'text-mid'}`}>
                      Drafts, campaigns & assets
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('brand_manager')}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'brand_manager'
                        ? 'border-ink bg-ink text-paper shadow-xs'
                        : 'border-silver bg-paper text-graphite hover:border-mid hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-caption">Brand Manager</span>
                      {role === 'brand_manager' && <Check className="size-3.5" />}
                    </div>
                    <span className={`text-[11px] mt-0.5 ${role === 'brand_manager' ? 'text-silver' : 'text-mid'}`}>
                      Governance & rules sign-off
                    </span>
                  </button>
                </div>
              </div>

              {/* Brand Association */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase tracking-wider text-graphite">
                  Brand Workspace
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-mid" />
                  <select
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="h-11 w-full rounded-xl border border-silver/90 bg-paper pl-10 pr-3.5 text-ui text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all cursor-pointer"
                  >
                    <option value="NovaFit Health">NovaFit Health</option>
                    <option value="OmniCloud">OmniCloud</option>
                    <option value="Apex FinTech">Apex FinTech</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="press rounded-full border border-silver bg-paper px-4 py-2 text-caption font-semibold text-graphite hover:bg-silver/20 hover:text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="press flex items-center gap-1.5 rounded-full bg-ink hover:bg-graphite px-5 py-2.5 text-caption font-bold text-paper shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="size-3.5 text-brand-orange" />
                  {isSubmitting ? 'Submitting...' : 'Submit Joining Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
