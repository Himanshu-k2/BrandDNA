import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  CircleAlert,
  CloudUpload,
  FileImage,
  FileText,
  Info,
  Loader2,
  ShieldCheck,
  X
} from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Select, type SelectOption } from '@/components/mono/Select';
import { Button, focusRing, ICON, Modal, NotificationBell, OnlineTeamPresence } from '@/components/mono/ui';
import { ProgressBar } from '@/components/mono/accent';
import { BRANDS, REVIEW } from '@/data/demo';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { dashboardPath, useSession } from '@/state/session';

/* ── Constants & validation rules ────────────────────────────────── */

export const CONTENT_TYPES = [
  'Social Media Post',
  'Email Campaign',
  'Print Brochure',
  'Website Copy',
  'Display Ad',
  'Press Release'
] as const;

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

function BrandInitials({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-min bg-silver/60 text-caption font-semibold text-ink"
    >
      {initials}
    </span>
  );
}

function FileRow({ item, onRemove, disabled }: { item: UploadItem; onRemove: () => void; disabled?: boolean }) {
  const Icon = item.image ? FileImage : FileText;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: DURATION.fast, ease: EASE }}
      className="mt-2 flex items-center gap-3 rounded-min border border-silver bg-paper p-2.5 transition-colors"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-min bg-silver/40 text-graphite">
        <Icon className="size-4" {...ICON} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-caption font-medium text-ink">{item.file.name}</p>
          <span className="text-caption text-graphite tabular-nums shrink-0">{formatSize(item.file.size)}</span>
        </div>
        {item.status === 'uploading' && <ProgressBar value={item.progress} label={`Uploading ${item.file.name}`} />}
        {item.error && (
          <p className="flex items-center gap-1 text-caption text-danger">
            <CircleAlert className="size-3.5 shrink-0" {...ICON} />
            <span>{item.error}</span>
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={`Remove ${item.file.name}`}
        disabled={disabled}
        onClick={onRemove}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-min text-graphite hover:bg-silver/40 hover:text-ink focus-visible:outline-ink disabled:cursor-not-allowed"
      >
        <X className="size-4" {...ICON} />
      </button>
    </motion.li>
  );
}

/* ── Screen Component ────────────────────────────────────────────── */

export function NewContentForm({ onSubmit }: { onSubmit: (data: NewContentSubmission) => void }) {
  const navigate = useNavigate();
  const { persona } = useSession();
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

  itemsRef.current = items;
  useEffect(() => {
    return () => {
      timers.current.forEach(window.clearTimeout);
      itemsRef.current.forEach(item => item.preview && URL.revokeObjectURL(item.preview));
    };
  }, []);

  const selectedBrand = BRANDS.find(option => option.id === brand);
  const uploading = items.some(item => item.status === 'uploading');
  const readyFiles = items.filter(item => item.status === 'done');
  const hasContent = text.trim().length > 0 || readyFiles.length > 0;
  const valid = Boolean(brand && type && hasContent && !uploading);
  const dirty = Boolean(brand || type || title || text || items.length);

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

  const tick = (id: string) => {
    timers.current.push(
      window.setTimeout(() => {
        let finished = false;
        setItems(list =>
          list.map(item => {
            if (item.id !== id || item.status !== 'uploading') return item;
            const progress = Math.min(100, item.progress + 25 + Math.random() * 20);
            finished = progress >= 100;
            return { ...item, progress, status: finished ? 'done' : 'uploading' };
          })
        );
        if (!finished) tick(id);
      }, 300)
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
    const fileText = await Promise.all(
      readyFiles.filter(item => extension(item.file.name) === 'txt').map(item => item.file.text().catch(() => ''))
    );
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
        800
      )
    );
  };

  const leave = () => navigate(dashboardPath(persona.role));
  const requestLeave = () => (dirty && !submitting ? setConfirmLeave(true) : leave());

  const brandOptions: SelectOption[] = BRANDS.map(option => ({
    value: option.id,
    label: option.name,
    leading: <BrandInitials initials={option.initials} />
  }));
  const typeOptions: SelectOption[] = CONTENT_TYPES.map(option => ({ value: option, label: option }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={requestLeave}
              aria-label="Back to dashboard"
              className="press flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-silver bg-paper text-ink shadow-sm transition-[background-color,transform] duration-200 hover:bg-silver/24 active:scale-95 focus-visible:outline-2 focus-visible:outline-ink"
            >
              <ArrowLeft className="size-5" {...ICON} />
            </button>
            <RevealText
              text="Create new content"
              className="font-display text-3xl font-semibold tracking-tight text-ink"
              delay={0.05}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadExample('instagram')}
              disabled={submitting}
              className="press flex h-10 cursor-pointer items-center justify-center rounded-full border border-silver bg-paper px-4 text-ui font-medium text-ink shadow-sm transition-[background-color,transform] duration-200 hover:bg-silver/24 active:scale-95 focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40"
            >
              Sample: Instagram
            </button>
            <button
              type="button"
              onClick={() => loadExample('novafit')}
              disabled={submitting}
              className="press flex h-10 cursor-pointer items-center justify-center rounded-full border border-silver bg-paper px-4 text-ui font-medium text-ink shadow-sm transition-[background-color,transform] duration-200 hover:bg-silver/24 active:scale-95 focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40"
            >
              Sample: NovaFit
            </button>
            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <OnlineTeamPresence />
              <NotificationBell />
            </div>
          </div>
        </div>

        <p className="max-w-2xl text-body text-graphite pl-[52px]">
          Add copy, documents, or images. We'll audit them against brand guidelines before review.
        </p>
      </header>

      {/* ── Workspace Panel · Top Controls ── */}
      <section className="rounded-panel border border-silver bg-paper p-6 shadow-[0px_14px_28px_-18px_rgba(7,13,13,0.09),0px_1px_2px_0px_rgba(7,13,13,0.03)]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr]">
          {/* Brand workspace */}
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.brand} className="flex items-center gap-1 text-caption font-semibold text-ink">
              Brand workspace •
            </label>
            <Select
              id={ids.brand}
              value={brand}
              onChange={setBrand}
              options={brandOptions}
              placeholder="Select a workspace"
              invalid={Boolean(errors.brand)}
              disabled={submitting}
              onClose={() => setTouched(value => ({ ...value, brand: true }))}
            />
            <p className="text-caption text-graphite">Choose the brand this content belongs to.</p>
            {errors.brand && <p className="text-caption text-danger">{errors.brand}</p>}
          </div>

          {/* Content type */}
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.type} className="flex items-center gap-1 text-caption font-semibold text-ink">
              Content type •
            </label>
            <Select
              id={ids.type}
              value={type}
              onChange={setType}
              options={typeOptions}
              placeholder="Select a content type"
              invalid={Boolean(errors.type)}
              disabled={submitting}
              onClose={() => setTouched(value => ({ ...value, type: true }))}
            />
            <span className="text-caption text-transparent select-none">&nbsp;</span>
            {errors.type && <p className="text-caption text-danger">{errors.type}</p>}
          </div>

          {/* Title Optional */}
          <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
            <label htmlFor={ids.title} className="flex items-center gap-1.5 text-caption font-semibold text-ink">
              Title <span className="font-normal text-mid">Optional</span>
            </label>
            <input
              id={ids.title}
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="e.g. Summer Bootcamp Promo 2026"
              disabled={submitting}
              className={cn(
                'h-12 w-full rounded border border-silver bg-paper px-4 text-ui text-ink outline-none transition-colors placeholder:text-mid hover:border-mid focus:border-ink disabled:opacity-40',
                focusRing
              )}
            />
            <span className="text-caption text-transparent select-none">&nbsp;</span>
          </div>
        </div>
      </section>

      {/* ── Modular Input Areas ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[480px_1fr] items-stretch">
        {/* Left: File Module */}
        <div className="flex flex-col rounded-panel border border-silver bg-paper p-6 shadow-[0px_14px_28px_-18px_rgba(7,13,13,0.09),0px_1px_2px_0px_rgba(7,13,13,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-ink">Upload files</span>
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
            onClick={openPicker}
            onKeyDown={onDropzoneKey}
            onDragEnter={event => onDrag(event, true)}
            onDragOver={event => onDrag(event, true)}
            onDragLeave={event => onDrag(event, false)}
            onDrop={onDrop}
            className={cn(
              'mt-3 flex min-h-[232px] flex-col items-center justify-center gap-2.5 rounded border border-dashed p-6 text-center transition-[background-color,border-color] duration-200',
              focusRing,
              submitting
                ? 'cursor-not-allowed border-silver opacity-40'
                : dragOver
                  ? 'cursor-copy border-ink bg-silver/30'
                  : 'cursor-pointer border-silver bg-paper hover:border-mid hover:bg-silver/10'
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-silver text-graphite">
              <CloudUpload className="size-6" {...ICON} aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-ui font-medium text-ink">
                Drag and drop files here, or <span className="underline underline-offset-4">browse</span>
              </p>
              <p className="text-caption text-graphite">Brochures, proposals, plain text, or ad creatives.</p>
            </div>
          </div>

          <p className="mt-3 text-caption text-graphite">PDF, DOCX, TXT, PNG, JPG, WebP. Up to 15 MB each.</p>

          {items.length > 0 && (
            <ul aria-label="Selected files" className="mt-2 flex flex-col">
              <AnimatePresence initial={false}>
                {items.map(item => (
                  <FileRow key={item.id} item={item} onRemove={() => removeItem(item.id)} disabled={submitting} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Right: Text Module */}
        <div className="flex flex-col rounded-panel border border-silver bg-paper p-6 shadow-[0px_14px_28px_-18px_rgba(7,13,13,0.09),0px_1px_2px_0px_rgba(7,13,13,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-semibold text-ink">
              Content text <span className="font-normal text-mid">Optional if you upload files</span>
            </span>
            <span className="text-caption text-graphite tabular-nums">
              {text.length.toLocaleString()} {text.length === 1 ? 'character' : 'characters'}
            </span>
          </div>

          <textarea
            id={ids.text}
            value={text}
            onChange={event => setText(event.target.value)}
            onBlur={() => setTouched(value => ({ ...value, content: true }))}
            placeholder="Paste your draft copy, ad text, or campaign messaging here."
            disabled={submitting}
            className={cn(
              'mt-3 block min-h-[254px] w-full flex-1 resize-none rounded border border-silver bg-paper p-4 text-body text-ink outline-none transition-colors placeholder:text-mid hover:border-mid focus:border-ink disabled:opacity-40',
              focusRing,
              errors.content && 'border-danger'
            )}
          />

          {errors.content && <p className="mt-2 text-caption text-danger">{errors.content}</p>}
        </div>
      </section>

      {/* ── Submission Bar ── */}
      <footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2">
        <div className="flex items-center gap-2 text-caption text-graphite">
          <Info className="size-4 shrink-0 text-graphite" {...ICON} aria-hidden />
          <span>You can submit text, files, or both.</span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={requestLeave}
            disabled={submitting}
            className="press flex h-12 cursor-pointer items-center justify-center px-6 text-ui font-medium text-graphite transition-colors hover:text-ink disabled:opacity-40 focus-visible:outline-ink"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!valid || submitting}
            className={cn(
              'press flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-ui font-medium transition-[background-color,transform] duration-200',
              focusRing,
              submitting
                ? 'cursor-progress bg-graphite text-paper'
                : valid
                  ? 'bg-ink text-paper hover:bg-graphite hover:scale-[1.02] active:scale-[0.98]'
                  : 'cursor-not-allowed bg-silver text-mid'
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" {...ICON} />
                Auditing…
              </>
            ) : (
              <>
                <ShieldCheck className="size-5" {...ICON} />
                Audit content
              </>
            )}
          </button>
        </div>
      </footer>

      {/* ── Discard Modal ── */}
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
        <p className="text-body text-graphite">
          Your unsaved draft will be lost and you'll return to the dashboard.
        </p>
      </Modal>
    </div>
  );
}
