import { ArrowUp, CircleAlert, FileText, Paperclip, RotateCcw, Search, Smile } from 'lucide-react';
import { AskBradButton } from '@/components/brad/AskBradButton';
import { BradFace, BRAD_SIZE, EXPRESSIONS, type BradSize, type ExpressionId } from '@/components/brad/face/BradFace';
import { Markdown } from '@/components/brad/Markdown';
import { ModeSwitch, TypingDots } from '@/components/brad/parts';
import { MonoAvatar } from '@/components/mono/Brand';
import { Button, Card, ICON, SectionHeader, Stagger } from '@/components/mono/ui';
import { cn } from '@/lib/cn';

const LABEL: Record<ExpressionId, string> = {
  neutral: 'Neutral',
  attentive: 'Attentive',
  surprised: 'Surprised',
  excited: 'Excited',
  happy: 'Happy',
  laughing: 'Laughing',
  angry: 'Angry',
  sad: 'Sad',
  scared: 'Scared',
  suspicious: 'Suspicious',
  confused: 'Confused',
  curious: 'Curious',
  proud: 'Proud',
  shy: 'Shy',
  unimpressed: 'Unimpressed',
  sleepy: 'Sleepy'
};

const USED: Partial<Record<ExpressionId, string>> = {
  neutral: 'Idle',
  attentive: 'Hover · thinking',
  happy: 'Greeting',
  curious: 'User typing',
  proud: 'Good answer',
  excited: 'Task done',
  confused: 'No answer',
  sad: 'Error',
  unimpressed: 'Downvote',
  sleepy: '60 s idle'
};

function Frame({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-caption text-mid">{label}</span>
      {children}
    </div>
  );
}

function BradBubble({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <BradFace size="sm" expression={error ? 'sad' : 'neutral'} still className="mt-5" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex items-center gap-1 text-caption text-mid">
          <span className="font-medium text-graphite">Brad</span> · 10:42
          {error && (
            <span className="ml-1 flex items-center gap-1 text-danger">
              <CircleAlert className="size-4" {...ICON} aria-hidden /> Request failed
            </span>
          )}
        </p>
        <div className="rounded-chip rounded-tl-min bg-silver/40 px-3 py-2 text-body leading-copy text-ink">{children}</div>
      </div>
    </div>
  );
}

/** Brad reference for /design-system: expressions, sizes, entry states, message and input states. */
export function BradSection({ index }: { index: number }) {
  return (
    <Stagger index={index}>
      <Card as="section" className="flex flex-col gap-8 p-6">
        <div className="flex flex-col gap-2">
          <SectionHeader title="Brad · AI assistant" />
          <p className="text-body text-graphite">
            Circle bot ported from bloub (MIT, Jérémy Perret). Eyes follow the cursor, blink every 3–6 s and morph between expressions in 0.4 s. Angry and Scared exist but are not used in
            default flows.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-ui font-semibold text-ink">Expressions</h3>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
            {EXPRESSIONS.map(({ id }) => (
              <li key={id} className="flex flex-col items-center gap-2 rounded-item border border-silver p-4 text-center">
                <BradFace size="lg" expression={id} autoSleep={false} />
                <span className="text-ui font-medium text-ink">{LABEL[id]}</span>
                <span className="text-caption text-mid">{USED[id] ?? 'Not in default flows'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-ui font-semibold text-ink">Sizes</h3>
          <div className="flex flex-wrap items-end gap-8">
            {(Object.keys(BRAD_SIZE) as BradSize[]).map(size => (
              <div key={size} className="flex flex-col items-center gap-2">
                <BradFace size={size} autoSleep={false} />
                <span className="text-caption text-mid tabular-nums">
                  {size} · {BRAD_SIZE[size]}px
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-ui font-semibold text-ink">Ask Brad entry</h3>
          <div className="flex flex-wrap items-end gap-8">
            <Frame label="Rest">
              <AskBradButton open={false} />
            </Frame>
            <Frame label="Hover · Attentive">
              <AskBradButton open={false} forceHover />
            </Frame>
            <Frame label="Panel open">
              <AskBradButton open />
            </Frame>
            <Frame label="Mobile">
              <AskBradButton open={false} compact />
            </Frame>
            <Frame label="Unread · orange dot">
              <AskBradButton open={false} badge />
            </Frame>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="text-ui font-semibold text-ink">Messages</h3>
            <div className="flex flex-col gap-4 rounded-panel border border-silver p-4">
              <BradBubble>
                <Markdown text={'Here’s what needs changes in **NovaFit Health**:\n- **Quarterly Product Brochure** · 38/100\n\nUse `₹999 per month`, not `₹799`.'} />
              </BradBubble>
              <div className="flex flex-wrap gap-2 pl-8">
                <span className="flex h-8 items-center gap-1 rounded-full border border-silver bg-paper px-3 text-caption text-ink">
                  <FileText className="size-4" {...ICON} aria-hidden /> <span className="text-mid">Source</span> NovaFit guidelines
                </span>
              </div>
              <div className="flex items-start justify-end gap-2 pl-8">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-caption text-mid">10:43</span>
                  <p className="rounded-chip rounded-tr-min bg-ink px-3 py-2 text-body leading-copy text-paper">Explain a rejected submission</p>
                </div>
                <MonoAvatar initials="AR" className="mt-5 size-6" />
              </div>
              <div className="flex items-start gap-2">
                <BradFace size="sm" expression="attentive" scan autoSleep={false} className="mt-5" />
                <div className="flex flex-col gap-1">
                  <span className="text-caption text-mid">
                    <span className="font-medium text-graphite">Brad</span> is typing
                  </span>
                  <div className="w-max rounded-chip rounded-tl-min bg-silver/40 px-4 py-2">
                    <TypingDots />
                  </div>
                </div>
              </div>
              <BradBubble error>
                Something went wrong on my side and I couldn’t answer that. Want to try again?
                <div className="pt-2">
                  <Button variant="secondary" size="sm">
                    <RotateCcw className="size-4" {...ICON} /> Try again
                  </Button>
                </div>
              </BradBubble>
              <div className="flex flex-col items-start gap-2 pl-8">
                {['Check my content against brand rules', 'Find a brand guideline'].map(chip => (
                  <span key={chip} className="rounded-full border border-silver bg-paper px-4 py-2 text-ui text-ink">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-ui font-semibold text-ink">Input</h3>
            {[
              { label: 'Empty · send disabled', text: '', deep: false },
              { label: 'Typing · Deep search on', text: 'What’s the NovaFit membership price?', deep: true }
            ].map(state => (
              <Frame key={state.label} label={state.label}>
                <div className="flex flex-col gap-3 rounded-panel border border-silver p-4">
                  <div className="flex justify-center">
                    <ModeSwitch label="Input mode" value="chat" onChange={() => undefined} items={[{ id: 'chat', label: 'Chat' }, { id: 'voice', label: 'Voice' }]} />
                  </div>
                  <div className={cn('rounded-item border bg-paper p-2', state.text ? 'border-ink' : 'border-silver')}>
                    <p className={cn('px-2 pt-1 text-body leading-copy', state.text ? 'text-ink' : 'text-mid')}>{state.text || 'Message Brad...'}</p>
                    <div className="mt-2 flex items-center gap-1 text-graphite">
                      <span className="flex size-8 items-center justify-center">
                        <Paperclip className="size-4" {...ICON} />
                      </span>
                      <span className="flex size-8 items-center justify-center">
                        <Smile className="size-4" {...ICON} />
                      </span>
                      <span
                        className={cn(
                          'ml-1 flex h-8 items-center gap-1 rounded-full border px-3 text-caption font-medium',
                          state.deep ? 'border-ink bg-ink text-paper' : 'border-silver bg-paper text-ink'
                        )}
                      >
                        <Search className="size-4" {...ICON} /> Deep search
                      </span>
                      <span className={cn('ml-auto flex size-8 items-center justify-center rounded-full text-paper', state.text ? 'bg-ink' : 'bg-silver')}>
                        <ArrowUp className="size-4" {...ICON} />
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-caption text-mid">Brad can make mistakes. Check important details.</p>
                </div>
              </Frame>
            ))}
          </div>
        </div>
      </Card>
    </Stagger>
  );
}
