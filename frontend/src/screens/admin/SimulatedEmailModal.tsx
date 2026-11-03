import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Check, Copy, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/mono/Logo';
import { useDismiss } from '@/hooks/useDismiss';
import { type JoiningRequest } from '@/data/invitations';

interface SimulatedEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: JoiningRequest | null;
  activationLink: string;
}

export function SimulatedEmailModal({
  isOpen,
  onClose,
  request,
  activationLink
}: SimulatedEmailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useDismiss(modalRef, isOpen, onClose);
  const [copied, setCopied] = useState(false);

  if (!request) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleOpenLink = () => {
    window.location.href = activationLink;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-xl rounded-3xl border border-silver/90 bg-paper p-6 sm:p-8 shadow-float text-left"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close email preview"
              className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-mid hover:bg-silver/40 hover:text-ink transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>

            {/* Simulated Email Envelope Header */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-silver/40">
              <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Mail className="size-4" />
              </span>
              <div>
                <h3 className="font-sans text-base font-bold text-ink">
                  Invitation Email Dispatched
                </h3>
                <p className="text-caption text-graphite">
                  To: <span className="font-medium text-ink">{request.email}</span>
                </p>
              </div>
            </div>

            {/* Email Canvas (Clean White Card representing the actual Email body) */}
            <div className="mt-4 rounded-2xl border border-silver/80 bg-[#FAFAFA] p-6 shadow-2xs text-left">
              <div className="flex justify-between items-center pb-4 border-b border-silver/40">
                <Logo variant="horizontal" size="md" />
                <span className="text-[11px] font-semibold text-mid uppercase tracking-wider">
                  Workspace Invite
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <h4 className="font-sans text-lg font-bold text-ink">
                  Your BrandDNA access request has been accepted!
                </h4>

                <p className="text-caption leading-relaxed text-graphite">
                  Hello <strong className="text-ink">{request.name}</strong>,
                </p>

                <p className="text-caption leading-relaxed text-graphite">
                  Platform Administrator <strong>Jordan Blake</strong> has approved your joining request for{' '}
                  <strong className="text-ink">{request.brand}</strong> as a{' '}
                  <span className="inline-block rounded-md bg-silver/40 px-2 py-0.5 font-semibold text-ink">
                    {request.role === 'brand_manager' ? 'Brand Manager' : 'Content Creator'}
                  </span>
                  .
                </p>

                <p className="text-caption leading-relaxed text-graphite">
                  Please click the secure activation link below to set your password and launch your personalized brand workspace:
                </p>

                <div className="my-2">
                  <button
                    type="button"
                    onClick={handleOpenLink}
                    className="press flex items-center justify-center gap-2 rounded-full bg-ink hover:bg-graphite px-6 py-3 text-caption font-bold text-paper shadow-sm transition-all cursor-pointer"
                  >
                    Activate Account & Set Password <ExternalLink className="size-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-mid">
                  This activation link is secured with high-entropy cryptographic sealing and expires in 48 hours.
                </p>
              </div>
            </div>

            {/* Copy / Test Actions at the bottom */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="press flex items-center gap-1.5 rounded-full border border-silver bg-paper px-4 py-2 text-caption font-semibold text-ink hover:bg-silver/20 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Activation Link'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenLink}
                className="press flex items-center gap-1.5 rounded-full bg-brand-orange hover:bg-brand-orange-hover px-5 py-2 text-caption font-bold text-ink shadow-sm transition-colors cursor-pointer w-full sm:w-auto justify-center"
              >
                Simulate New User Clicking Link
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
