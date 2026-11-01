import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CircleCheck,
  ChevronDown,
  CircleAlert,
  CloudUpload,
  FileImage,
  FileText,
  ImageIcon,
  Info,
  Loader2,
  Lock,
  MessageSquareText,
  ScrollText,
  ShieldCheck,
  X
} from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Select, type SelectOption } from '@/components/mono/Select';
import { Button, Card, focusRing, ICON, IconButton, Modal, Pill, Stagger, Tooltip } from '@/components/mono/ui';
import { ProgressBar } from '@/components/mono/accent';
import { FieldMessage } from '@/components/mono/status';
import { BRANDS, REVIEW } from '@/data/demo';
import { BRAND_STATS } from '@/data/platform';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { dashboardPath, useSession } from '@/state/session';

/* ── Constants & validation rules ────────────────────────────────── */

export const CONTENT_TYPES = ['Social Media Post', 'Email Campaign', 'Print Brochure', 'Website Copy', 'Display Ad', 'Press Release'] as const;
const ACCEPTED = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp'];
const ACCEPT_ATTR = '.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp';
const MAX_BYTES = 15 * 1024 * 1024;

const MESSAGES = {
  brand: 'Choose a brand workspace.',
  type: 'Choose a content type.',
  content: 'Add text or upload at least one file.',
  fileType: "This file type isn't supported.",
  fileSize: 'This file is larger than 15 MB.'
} as const;

const EXAMPLES = {
  instagram: {
    brand: 'novafit',
    type: 'Social Media Post',
    title: 'NovaFit Instagram Carousel · Summer Launch',
    text: 'Hey NovaFit users! Summer is here.\nJoin today for only ₹799 per month and train at the cheapest gym in town.\nTap the link in bio to start.'
  },
  novafit: { brand: 'novafit', type: 'Display Ad', title: REVIEW.title, text: REVIEW.v1 }
} as const;

export interface NewContentSubmission {
  brandId: string;
  brandName: string;
  contentType: string;
  title: string;
  text: string;
  files: { name: string; size: number }[];
}

type UploadItem = {
  id: string;
  file: File;
  image: boolean;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
  preview?: string;
};

const extension = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/* ── Small local primitives (built from shared tokens) ───────────── */

function FieldLabel({ htmlFor, id, required, optional, children }: { htmlFor?: string; id?: string; required?: boolean; optional?: string; children: ReactNode }) {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag {...(htmlFor ? { htmlFor } : {})} id={id} className="flex items-center gap-1 text-caption font-semibold text-ink">
        {children}
        {required && (
          <>
            <span aria-hidden className="size-1 rounded-full bg-ink" />
            <span className="sr-only">(required)</span>
          </>
        )}
      </Tag>
      {optional && <span className="text-caption font-normal text-mid">{optional}</span>}
    </div>
  );
}

/** Always-mounted live region; the message slides down softly when it appears. */
function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <FieldMessage id={id} tone="danger">
      {message}
    </FieldMessage>
  );
}

function BrandInitials({ initials, size = 'sm' }: { initials: string; size?: 'sm' | 'lg' }) {
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-min bg-ink font-semibold text-paper', size === 'sm' ? 'size-6 text-caption' : 'size-12 font-display text-subheading')}>
      {initials}
    </span>
  );
}

function FileRow({ item, onRemove, disabled }: { item: UploadItem; onRemove: () => void; disabled: boolean }) {
  const reduce = useReducedMotion();
  const Icon = item.image ? FileImage : FileText;
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={{ duration: DURATION.base, ease: EASE }}
      className="overflow-hidden"
    >
      {/* Row sits in a 24px-padded card → 4px floor radius. */}
      <div className={cn('mt-2 flex items-center gap-3 rounded-min border p-2', item.status === 'error' ? 'border-danger-line bg-danger-tint' : 'border-silver')}>
        {item.preview ? (
          <img src={item.preview} alt="" className="size-10 shrink-0 rounded-min object-cover" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-min bg-silver/40 text-graphite">
            <Icon className="size-5" {...ICON} aria-hidden />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-ui font-medium text-ink">{item.file.name}</span>
            <span className="shrink-0 text-caption text-mid tabular-nums">{formatSize(item.file.size)}</span>
          </div>
          {item.status === 'uploading' && (
            <ProgressBar value={item.progress} label={`Uploading ${item.file.name}`} />
          )}
          {item.status === 'error' && (
            <span className="flex items-center gap-1 text-caption font-medium text-danger">
              <CircleAlert className="size-4 shrink-0" {...ICON} aria-hidden />
              {item.error}
            </span>
          )}
          {item.status === 'done' && <span className="text-caption text-graphite">Uploaded</span>}
        </div>
        {/* Completion is a status → semantic success icon, never orange. */}
        {item.status === 'done' && <CircleCheck className="size-5 shrink-0 text-success" {...ICON} aria-label="Upload complete" />}
        <IconButton label={`Remove ${item.file.name}`} size="sm" onClick={onRemove} disabled={disabled} className="border border-silver">
          <X className="size-4" {...ICON} />
        </IconButton>
      </div>
    </motion.li>
  );
}

/* ── Screen ──────────────────────────────────────────────────────── */

export function NewContentForm({ onSubmit }: { onSubmit: (data: NewContentSubmission) => void }) {
  const navigate = useNavigate();
  const { persona } = useSession();
  const reduce = useReducedMotion();
  const uid = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);

  const [brand, setBrand] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [items, setItems] = useState<UploadItem[]>([]);
  const [touched, setTouched] = useState({ brand: false, type: false, content: false });
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [checksOpen, setChecksOpen] = useState(false);

  itemsRef.current = items;
  useEffect(() => {
    return () => {
      timers.current.forEach(window.clearTimeout);
      itemsRef.current.forEach(item => item.preview && URL.revokeObjectURL(item.preview));
    };
  }, []);

  const selectedBrand = BRANDS.find(option => option.id === brand);
  const stats = selectedBrand ? BRAND_STATS[selectedBrand.id] : undefined;
  const uploading = items.some(item => item.status === 'uploading');
  const readyFiles = items.filter(item => item.status === 'done');
  const hasContent = text.trim().length > 0 || readyFiles.length > 0;
  const valid = Boolean(brand && type && hasContent && !uploading);
  const dirty = Boolean(brand || type || title || text || items.length);
  const fileErrors = items.filter(item => item.status === 'error');

  const errors = {
    brand: touched.brand && !brand ? MESSAGES.brand : undefined,
    type: touched.type && !type ? MESSAGES.type : undefined,
    content: touched.content && !hasContent && !uploading ? MESSAGES.content : undefined
  };

  const ids = {
    brand: `${uid}-brand`,
    type: `${uid}-type`,
    title: `${uid}-title`,
    text: `${uid}-text`,
    files: `${uid}-files`
  };

  /* Simulated client-side upload: stepped progress, each step eased. */
  const tick = (id: string) => {
    timers.current.push(
      window.setTimeout(() => {
        let finished = false;
        setItems(list =>
          list.map(item => {
            if (item.id !== id || item.status !== 'uploading') return item;
            const progress = Math.min(100, item.progress + 20 + Math.random() * 20);
            finished = progress >= 100;
            return { ...item, progress, status: finished ? 'done' : 'uploading' };
          })
        );
        if (!finished) tick(id);
      }, 320)
    );
  };

  const addFiles = (list: FileList | File[]) => {
    const next = Array.from(list).map<UploadItem>(file => {
      const ext = extension(file.name);
      const image = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
      const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
      if (!ACCEPTED.includes(ext)) return { id, file, image, status: 'error', progress: 0, error: MESSAGES.fileType };
      if (file.size > MAX_BYTES) return { id, file, image, status: 'error', progress: 0, error: MESSAGES.fileSize };
      return { id, file, image, status: 'uploading', progress: 0, preview: image ? URL.createObjectURL(file) : undefined };
    });
    setItems(current => [...current, ...next]);
    next.filter(item => item.status === 'uploading').forEach(item => tick(item.id));
  };

  const removeItem = (id: string) =>
    setItems(list => {
      const target = list.find(item => item.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return list.filter(item => item.id !== id);
    });

  const openPicker = () => !submitting && fileInput.current?.click();
  const onDropzoneKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };
  const onDrag = (event: DragEvent, over: boolean) => {
    event.preventDefault();
    if (submitting) return;
    if (!over && event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragOver(over);
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (!submitting && event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  };

  const loadExample = (key: keyof typeof EXAMPLES) => {
    const example = EXAMPLES[key];
    setBrand(example.brand);
    setType(example.type);
    setTitle(example.title);
    setText(example.text);
    setTouched({ brand: false, type: false, content: false });
  };

  const submit = async () => {
    if (!valid) {
      setTouched({ brand: true, type: true, content: true });
      const first = !brand ? ids.brand : !type ? ids.type : !hasContent ? ids.text : undefined;
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setSubmitting(true);
    // Plain-text uploads are read into the draft; other formats travel as attachments.
    const fileText = await Promise.all(readyFiles.filter(item => extension(item.file.name) === 'txt').map(item => item.file.text().catch(() => '')));
    const draft = [text.trim(), ...fileText.map(value => value.trim())].filter(Boolean).join('\n');
    timers.current.push(
      window.setTimeout(
        () =>
          onSubmit({
            brandId: brand,
            brandName: selectedBrand?.name ?? '',
            contentType: type,
            title: title.trim(),
            text: draft,
            files: readyFiles.map(item => ({ name: item.file.name, size: item.file.size }))
          }),
        900
      )
    );
  };

  const leave = () => navigate(dashboardPath(persona.role));
  const requestLeave = () => (dirty && !submitting ? setConfirmLeave(true) : leave());

  const brandOptions: SelectOption[] = BRANDS.map(option => ({ value: option.id, label: option.name, leading: <BrandInitials initials={option.initials} /> }));
  const typeOptions: SelectOption[] = CONTENT_TYPES.map(option => ({ value: option, label: option }));
  const describe = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ') || undefined;

  const demo = (key: keyof typeof EXAMPLES, label: string) => (
    <Tooltip content="Fills the form with sample content" side="bottom">
      <Button variant="secondary" onClick={() => loadExample(key)} disabled={submitting}>
        {label}
      </Button>
    </Tooltip>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header row: back · title + subtitle · demo pills (below subtitle under xl). */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <IconButton label="Back to dashboard" onClick={requestLeave} className="mt-1 border border-silver bg-paper">
            <ArrowLeft className="size-5" {...ICON} />
          </IconButton>
          <div className="flex min-w-0 flex-col gap-1">
            <RevealText text="Create new content" className="font-display text-display font-semibold tracking-tight text-ink" delay={0.08} />
            <p className="max-w-2xl text-body text-graphite">Upload your copy, documents, or images. We'll check them against your brand guidelines before they go to review.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-14 xl:shrink-0 xl:pl-0">
          {demo('instagram', 'Try Instagram example')}
          {demo('novafit', 'Try NovaFit example')}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Form card · radius 24, padding 24 → inner controls on the 4px floor ── */}
        <Stagger index={0} className="min-w-0">
          <Card as="section" className="p-6">
            <form
              noValidate
              aria-label="Create new content"
              onSubmit={event => {
                event.preventDefault();
                void submit();
              }}
            >
              <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor={ids.brand} id={`${ids.brand}-label`} required>
                      Brand workspace
                    </FieldLabel>
                    <Select
                      id={ids.brand}
                      value={brand}
                      onChange={setBrand}
                      options={brandOptions}
                      placeholder="Select a workspace"
                      invalid={Boolean(errors.brand)}
                      describedBy={describe(`${ids.brand}-help`, `${ids.brand}-error`)}
                      disabled={submitting}
                      onClose={() => setTouched(value => ({ ...value, brand: true }))}
                    />
                    <div>
                      <p id={`${ids.brand}-help`} className="text-caption text-graphite">
                        Choose the brand this content belongs to.
                      </p>
                      <FieldError id={`${ids.brand}-error`} message={errors.brand} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor={ids.type} id={`${ids.type}-label`} required>
                      Content type
                    </FieldLabel>
                    <Select
                      id={ids.type}
                      value={type}
                      onChange={setType}
                      options={typeOptions}
                      placeholder="Select a content type"
                      invalid={Boolean(errors.type)}
                      describedBy={`${ids.type}-error`}
                      disabled={submitting}
                      onClose={() => setTouched(value => ({ ...value, type: true }))}
                    />
                    <FieldError id={`${ids.type}-error`} message={errors.type} />
                  </div>
                </div>

                {/* Brand context strip: only rendered with a real brand name, so no empty "()" is possible. */}
                <AnimatePresence initial={false}>
                  {selectedBrand && (
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DURATION.base, ease: EASE }}
                      className="-mt-2 overflow-hidden"
                    >
                      <div className="mt-2 flex flex-wrap items-center gap-3 rounded-min border border-silver bg-silver/24 px-4 py-3">
                        <BrandInitials initials={selectedBrand.initials} />
                        <p className="min-w-0 flex-1 text-ui text-graphite">
                          Checking against <span className="font-semibold text-ink">{selectedBrand.name}</span> guidelines
                        </p>
                        <Pill variant="outline" icon={Lock} caps={false}>
                          Private to this brand
                        </Pill>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <FieldLabel id={`${ids.files}-label`}>Upload files</FieldLabel>
                    <span id={`${ids.files}-help`} className="text-caption text-graphite">
                      PDF, DOCX, TXT, PNG, JPG, WebP. Up to 15 MB each.
                    </span>
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept={ACCEPT_ATTR}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={event => {
                      if (event.target.files?.length) addFiles(event.target.files);
                      event.target.value = '';
                    }}
                  />
                  <div
                    role="button"
                    tabIndex={submitting ? -1 : 0}
                    aria-disabled={submitting || undefined}
                    aria-labelledby={`${ids.files}-label ${ids.files}-cta`}
                    aria-describedby={describe(`${ids.files}-help`, fileErrors.length > 0 && `${ids.files}-error`)}
                    onClick={openPicker}
                    onKeyDown={onDropzoneKey}
                    onDragEnter={event => onDrag(event, true)}
                    onDragOver={event => onDrag(event, true)}
                    onDragLeave={event => onDrag(event, false)}
                    onDrop={onDrop}
                    className={cn(
                      'flex flex-col items-center gap-3 rounded-min border px-6 py-8 text-center transition-[background-color,border-color] duration-400 ease-(--ease-refined)',
                      focusRing,
                      submitting
                        ? 'cursor-not-allowed border-dashed border-silver opacity-40'
                        : dragOver
                          ? 'cursor-copy border-dashed border-ink bg-silver/40'
                          : fileErrors.length
                            ? 'cursor-pointer border-solid border-graphite bg-paper'
                            : 'cursor-pointer border-dashed border-silver bg-paper hover:border-mid hover:bg-silver/24'
                    )}
                  >
                    <motion.span
                      animate={{ scale: dragOver && !reduce ? 1.08 : 1 }}
                      transition={{ duration: DURATION.fast, ease: EASE }}
                      className="flex size-12 items-center justify-center rounded-full bg-silver text-graphite"
                    >
                      <CloudUpload className="size-6" {...ICON} aria-hidden />
                    </motion.span>
                    <div className="flex flex-col gap-1">
                      <p id={`${ids.files}-cta`} className="text-ui font-medium text-ink">
                        Drag and drop files here, or <span className="underline underline-offset-4">browse</span>
                      </p>
                      <p className="text-caption text-graphite">Brochures, proposals, plain text, or ad creatives.</p>
                    </div>
                  </div>
                  <div id={`${ids.files}-error`} aria-live="polite" className="sr-only">
                    {fileErrors.map(item => `${item.file.name}: ${item.error}`).join(' ')}
                  </div>
                  <ul aria-label="Selected files" className="flex flex-col">
                    <AnimatePresence initial={false}>
                      {items.map(item => (
                        <FileRow key={item.id} item={item} onRemove={() => removeItem(item.id)} disabled={submitting} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* Content text */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FieldLabel htmlFor={ids.text} optional="Optional if you upload files">
                      Content text
                    </FieldLabel>
                    <span aria-live="off" className="text-caption text-graphite tabular-nums">
                      {text.length.toLocaleString()} {text.length === 1 ? 'character' : 'characters'}
                    </span>
                  </div>
                  <textarea
                    id={ids.text}
                    value={text}
                    onChange={event => setText(event.target.value)}
                    onBlur={() => setTouched(value => ({ ...value, content: true }))}
                    placeholder="Paste your draft copy, ad text, or campaign messaging here."
                    aria-invalid={Boolean(errors.content) || undefined}
                    aria-describedby={`${ids.text}-error`}
                    className={cn(
                      'block min-h-40 w-full resize-y rounded-min border bg-paper px-4 py-3 text-body text-ink outline-none transition-colors duration-200 ease-(--ease-refined) placeholder:text-mid focus:border-ink disabled:cursor-not-allowed disabled:opacity-40',
                      focusRing,
                      errors.content ? 'border-danger' : 'border-silver hover:border-mid'
                    )}
                  />
                  <FieldError id={`${ids.text}-error`} message={errors.content} />
                </div>

                {/* Optional details sit after the required content. */}
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor={ids.title} optional="Optional">
                    Title
                  </FieldLabel>
                  <input
                    id={ids.title}
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    placeholder="e.g. Summer Bootcamp Promo 2026"
                    className={cn(
                      'h-12 w-full rounded-min border border-silver bg-paper px-4 text-ui text-ink outline-none transition-colors duration-200 ease-(--ease-refined) placeholder:text-mid hover:border-mid focus:border-ink disabled:cursor-not-allowed disabled:opacity-40',
                      focusRing
                    )}
                  />
                </div>

                <p className="flex items-center gap-2 text-caption text-graphite">
                  <Info className="size-4 shrink-0" {...ICON} aria-hidden />
                  You can submit text, files, or both.
                </p>

                {/* Actions: inline on desktop; full-width sticky bar on tablet and mobile. */}
                {/* Sticks above the Ask Brad pill (24px inset + 48px + 16px gap). */}
                <div className="sticky bottom-[88px] z-20 -mx-6 -mb-6 flex flex-col-reverse gap-2 rounded-b-panel border-t border-silver bg-paper px-6 py-4 xl:static xl:m-0 xl:flex-row xl:items-center xl:justify-end xl:rounded-none xl:border-0 xl:p-0">
                  <Button variant="ghost" size="lg" onClick={requestLeave} disabled={submitting} className="w-full xl:w-auto">
                    Cancel
                  </Button>
                  <button
                    type="submit"
                    aria-disabled={!valid || submitting || undefined}
                    aria-busy={submitting || undefined}
                    className={cn(
                      'press grid h-12 w-full items-center justify-items-center rounded-full px-4 text-ui font-medium whitespace-nowrap sm:px-6 transition-[background-color,color,transform] duration-400 ease-(--ease-refined) xl:w-auto',
                      focusRing,
                      // The page's single orange highlight CTA: Blaze Orange fill, Almost Black text (never white).
                      submitting ? 'cursor-progress bg-graphite text-paper' : valid ? 'cursor-pointer bg-brand-orange text-ink hover:bg-brand-orange-hover' : 'cursor-not-allowed bg-silver text-mid active:scale-100'
                    )}
                  >
                    {/* Both labels share one grid cell, so the pill keeps its width while the content cross-fades. */}
                    <span className={cn('col-start-1 row-start-1 flex items-center gap-2 transition-[opacity,transform] duration-400 ease-(--ease-refined)', submitting ? 'translate-y-2 opacity-0 motion-reduce:translate-y-0' : 'opacity-100')}>
                      <ShieldCheck className="size-5" {...ICON} aria-hidden />
                      Check against brand guidelines
                    </span>
                    <span
                      aria-hidden={!submitting}
                      className={cn('col-start-1 row-start-1 flex items-center gap-2 transition-[opacity,transform] duration-400 ease-(--ease-refined)', submitting ? 'opacity-100' : '-translate-y-2 opacity-0 motion-reduce:translate-y-0')}
                    >
                      <Loader2 className="size-5 animate-spin" {...ICON} aria-hidden />
                      Checking...
                    </span>
                  </button>
                </div>
              </fieldset>
            </form>
          </Card>
        </Stagger>

        {/* ── Right column: follows the form in the stagger. ── */}
        <div className="flex min-w-0 flex-col gap-6">
          <Stagger index={1}>
            <Card as="aside" className="flex flex-col gap-4 p-6">
              <h2 className="font-display text-subheading font-semibold text-ink">Brand context</h2>
              <div aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  {selectedBrand ? (
                    <motion.div
                      key={selectedBrand.id}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE } }}
                      transition={{ duration: DURATION.base, ease: EASE }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <BrandInitials initials={selectedBrand.initials} size="lg" />
                        <div className="flex min-w-0 flex-col">
                          <p className="font-display text-subheading font-semibold text-ink">{selectedBrand.name}</p>
                          <p className="text-caption text-graphite">{selectedBrand.sector}</p>
                        </div>
                      </div>
                      <Pill variant="silver" icon={Lock} caps={false} className="self-start">
                        Private to this brand
                      </Pill>
                      <p className="text-body text-graphite">
                        Checking against <span className="font-semibold text-ink">{selectedBrand.name}</span> guidelines
                      </p>
                      {stats && (
                        <dl className="grid grid-cols-2 gap-4 border-t border-silver pt-4">
                          <div className="flex flex-col gap-1">
                            <dt className="text-caption text-graphite">Active rules</dt>
                            <dd className="font-display text-heading font-semibold text-ink tabular-nums">{stats.rules}</dd>
                          </div>
                          <div className="flex flex-col gap-1">
                            <dt className="text-caption text-graphite">Pass rate</dt>
                            <dd className="font-display text-heading font-semibold text-ink tabular-nums">{stats.passRate}%</dd>
                          </div>
                          <div className="col-span-2 flex flex-col gap-1">
                            <dt className="text-caption text-graphite">Voice</dt>
                            <dd className="text-ui text-ink">{stats.voice}</dd>
                          </div>
                        </dl>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE } }}
                      transition={{ duration: DURATION.base, ease: EASE }}
                      className="flex flex-col items-center gap-2 rounded-min border border-dashed border-silver px-4 py-8 text-center"
                    >
                      <span className="flex size-12 items-center justify-center rounded-full bg-silver/40 text-graphite">
                        <Building2 className="size-6" {...ICON} aria-hidden />
                      </span>
                      <p className="text-ui font-medium text-ink">No brand selected</p>
                      <p className="text-caption text-graphite">Choose a brand workspace to see which guidelines apply.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </Stagger>

          <Stagger index={2}>
            <Card as="aside" className="flex flex-col gap-4 p-6">
              <h2 className="font-display text-subheading font-semibold text-ink">
                <button
                  type="button"
                  aria-expanded={checksOpen}
                  aria-controls={`${uid}-checks`}
                  onClick={() => setChecksOpen(value => !value)}
                  className={cn('flex w-full cursor-pointer items-center justify-between gap-2 rounded-min text-left xl:pointer-events-none xl:cursor-default', focusRing)}
                >
                  What we check
                  <ChevronDown className={cn('size-5 text-graphite transition-transform duration-200 ease-(--ease-refined) xl:hidden', checksOpen && 'rotate-180')} {...ICON} aria-hidden />
                </button>
              </h2>
              <ul id={`${uid}-checks`} className={cn('flex-col gap-4 xl:flex', checksOpen ? 'flex' : 'hidden')}>
                {[
                  { icon: MessageSquareText, title: 'Tone of voice', body: 'Matches the brand voice and avoids banned phrasing.' },
                  { icon: BadgeCheck, title: 'Approved terms', body: 'Prices, product names, and claims match approved facts.' },
                  { icon: ImageIcon, title: 'Visual rules', body: 'Logo use, imagery, and layout follow the visual guide.' },
                  { icon: ScrollText, title: 'Required disclaimers', body: 'Mandatory legal and medical lines are present.' }
                ].map(({ icon: Icon, title: label, body }) => (
                  <li key={label} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-silver/40 text-ink">
                      <Icon className="size-4" {...ICON} aria-hidden />
                    </span>
                    <div className="flex flex-col">
                      <p className="text-ui font-medium text-ink">{label}</p>
                      <p className="text-caption leading-copy text-graphite">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </Stagger>
        </div>
      </div>

      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Discard changes?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmLeave(false)}>
              Keep editing
            </Button>
            <Button onClick={leave}>Discard changes</Button>
          </>
        }
      >
        <p className="text-body text-graphite">Your brand, content type, title, files, and text will be cleared, and you'll return to the dashboard.</p>
      </Modal>
    </div>
  );
}
