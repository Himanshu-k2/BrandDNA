import { useState } from 'react';
import { ArrowRight, BookMarked, Copy, Lock } from 'lucide-react';
import { useFrame } from '@/components/mono/AppFrame';
import { Card, ICON, IconButton, PageHeader, Pill, SectionHeader, Stagger, Tabs } from '@/components/mono/ui';
import { GUIDELINES, type GuidelineSection } from '@/data/platform';
import { useSession } from '@/state/session';

type Filter = 'all' | GuidelineSection['id'];

/** Section card radius 24 · padding 8 → rule rows radius 16. */
export function GuidelinesHub() {
  const { persona } = useSession();
  const { notify } = useFrame();
  const [filter, setFilter] = useState<Filter>('all');
  const sections = GUIDELINES.filter(section => filter === 'all' || section.id === filter);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('Copied to clipboard', 'success');
    } catch {
      notify('Copy unavailable in this browser', 'danger');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Brand Guidelines Hub"
        subtitle="NovaFit Health · the approved facts, terminology, disclaimers and tone the audit engine checks every draft against."
        eyebrow={
          <Pill variant="outline" icon={Lock} caps={false}>
            {persona.role === 'admin' ? 'Managed by you · Platform Admin' : 'Read-only · managed by Platform Admin'}
          </Pill>
        }
      />

      <Tabs
        label="Guideline sections"
        value={filter}
        onChange={setFilter}
        items={[{ id: 'all' as Filter, label: 'All' }, ...GUIDELINES.map(section => ({ id: section.id as Filter, label: section.title, count: section.rows.length }))]}
      />

      {sections.map((section, index) => (
        <Stagger key={section.id} index={index + 1} className="flex flex-col gap-4">
          <SectionHeader title={section.title} />
          <Card className="flex flex-col p-2">
            {section.rows.map(row => (
              <div key={row.label} className="grid gap-3 rounded-item p-4 transition-colors hover:bg-silver/24 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-center">
                <div className="flex flex-col gap-1">
                  <span className="text-ui text-graphite">{section.id === 'terms' ? <span className="line-through decoration-graphite">{row.label}</span> : row.label}</span>
                  <span className="text-caption text-mid">{row.note}</span>
                </div>
                <p className="flex items-center gap-2 text-ui font-semibold text-ink">
                  {section.id === 'terms' && <ArrowRight className="size-4 shrink-0 text-graphite" {...ICON} />}
                  {row.value}
                </p>
                <div className="flex items-center gap-2 md:justify-end">
                  <Pill variant="outline" icon={BookMarked} caps={false}>
                    {row.source}
                  </Pill>
                  <IconButton label={`Copy “${row.value}”`} size="sm" onClick={() => copy(row.value)}>
                    <Copy className="size-4" {...ICON} />
                  </IconButton>
                </div>
              </div>
            ))}
          </Card>
        </Stagger>
      ))}
    </div>
  );
}
