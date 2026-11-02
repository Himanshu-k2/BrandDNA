import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Inbox, ShieldCheck } from 'lucide-react';
import { MonoAvatar } from '@/components/mono/Brand';
import { Button, Card, ICON, PageHeader, Pill, Stagger } from '@/components/mono/ui';
import { BRANDS } from '@/data/demo';
import { BRAND_STATS } from '@/data/platform';
import { brandsAPI } from '@/api/brands';

const initials = (name: string) => name.split(' ').map(part => part[0]).join('');

/** Brand card: radius 24 · padding 8 → inner blocks and tiles radius 16. */
export function BrandWorkspaces() {
  const navigate = useNavigate();
  const [brandsList, setBrandsList] = useState<any[]>([...BRANDS]);

  useEffect(() => {
    brandsAPI.getAll().then(res => {
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((b: any) => ({
          id: b._id || b.id || b.name?.toLowerCase().replace(/\s+/g, ''),
          name: b.name,
          sector: b.industry || 'Enterprise Brand',
          initials: initials(b.name || 'Brand')
        }));
        const existingIds = new Set(mapped.map((b: any) => b.id));
        setBrandsList([...mapped, ...BRANDS.filter(b => !existingIds.has(b.id))]);
      }
    }).catch(err => {
      console.warn('Backend brands fetch notice:', err);
    });
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Brand Workspaces"
        subtitle="Isolated facts, terminology rules, disclaimers, and audits for each brand."
        actions={
          <Button size="lg" onClick={() => navigate('/dashboard/queue')}>
            <Inbox className="size-5" {...ICON} /> Review queue
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        {brandsList.map((brand, index) => {
          const stats = BRAND_STATS[brand.id as keyof typeof BRAND_STATS] || BRAND_STATS['novafit'];
          return (
            <Stagger key={brand.id} index={index + 1}>
              <Card
                as="article"
                onClick={() => navigate(`/guidelines?brand=${brand.id}`)}
                className="group flex h-full flex-col gap-2 p-2 cursor-pointer transition-all duration-200 hover:border-graphite/40 hover:shadow-soft"
              >
                <div className="flex flex-col gap-4 rounded-item p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-min bg-ink text-ui font-semibold text-paper">{brand.initials}</span>
                    <div className="flex min-w-0 flex-col">
                      <h2 className="font-display text-subheading font-semibold text-ink">{brand.name}</h2>
                      <p className="text-caption text-graphite">{brand.sector}</p>
                    </div>
                    <Pill variant={stats.open > 4 ? 'solid' : 'silver'} className="ml-auto">
                      {stats.open} open
                    </Pill>
                  </div>
                  <p className="text-body text-graphite">{stats.voice}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Assets', value: stats.assets.toLocaleString('en-US') },
                    { label: 'Pass rate', value: `${stats.passRate}%` },
                    { label: 'Rules', value: stats.rules }
                  ].map(tile => (
                    <div key={tile.label} className="flex flex-col gap-1 rounded-item bg-silver/24 p-4">
                      <span className="text-caption text-graphite">{tile.label}</span>
                      <span className="font-display text-heading font-semibold text-ink tabular-nums">{tile.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex flex-col gap-4 rounded-item p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {stats.reviewers.map((name, i) => (
                        <MonoAvatar key={name} initials={initials(name)} tone={i % 2 ? 'silver' : 'graphite'} className="size-8 ring-2 ring-paper" />
                      ))}
                    </div>
                    <span className="text-caption text-graphite">Reviewers: {stats.reviewers.join(', ')}</span>
                  </div>
                  <p className="flex items-center gap-2 text-caption text-graphite">
                    <ShieldCheck className="size-4 text-ink" {...ICON} /> {stats.updated}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/guidelines?brand=${brand.id}`)}>
                      <BookOpen className="size-4" {...ICON} /> View rules
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/submissions');
                      }}
                    >
                      Submissions
                    </Button>
                  </div>
                </div>
              </Card>
            </Stagger>
          );
        })}
      </div>
    </div>
  );
}
