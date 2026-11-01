import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { MonoAvatar } from '@/components/mono/Brand';
import { ACTIVITIES, reviewCounts, type View } from './data';
import { SectionHeader, SeeAll } from '@/components/mono/ui';

const listPath = (view: View) => (view === 'creator' ? '/dashboard/content' : view === 'admin' ? '/dashboard/queue' : '/submissions');

/** Card radius 24, padding 16 → icon chip radius 8. */
export function AdvisorCard() {
  const navigate = useNavigate();
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Brand Advisor" action={<SeeAll to="/reviews/rev-1049" />} />
      <div className="flex gap-3 rounded-panel border border-silver bg-paper shadow-soft p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-chip bg-silver/40 text-ink">
          <Bell className="size-5" strokeWidth={1.5} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-ui font-semibold text-ink">NovaFit pricing rule updated</p>
          <p className="text-caption leading-copy text-graphite">₹999/mo is now the only approved membership price across every channel. Older drafts will be flagged.</p>
          <button
            type="button"
            onClick={() => navigate('/reviews/rev-1049')}
            className="press mt-2 h-8 w-max cursor-pointer rounded-full border border-silver bg-paper px-4 text-caption font-medium text-ink transition-colors hover:bg-silver/40 focus-visible:outline-2 focus-visible:outline-ink"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}

/** Card radius 24, padding 8 → row radius 16. */
export function ReviewsCard({ view }: { view: View }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Reviews" action={<SeeAll to={listPath(view)} />} />
      <ul className="flex flex-col rounded-panel border border-silver bg-paper shadow-soft p-2">
        {reviewCounts(view).map(row => (
          <li key={row.label}>
            <Link
              to={listPath(view)}
              className="flex h-12 items-center justify-between rounded-item px-3 text-ui text-graphite transition-colors hover:bg-silver/24 hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
            >
              {row.label}
              <span className="font-display text-subheading font-semibold text-ink tabular-nums">{row.value}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ActivityCard() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Recent Activities" action={<SeeAll to="/reviews/rev-1049?tab=compare" />} />
      <ul className="flex flex-col rounded-panel border border-silver bg-paper shadow-soft p-2">
        {ACTIVITIES.map((item, index) => (
          <li key={item.name}>
            <Link
              to={item.to}
              className="flex items-start gap-3 rounded-item p-2 transition-colors hover:bg-silver/24 focus-visible:outline-2 focus-visible:outline-ink"
            >
              <span className="relative">
                <MonoAvatar initials={item.initials} tone={index % 2 ? 'silver' : 'graphite'} />
                <span aria-hidden className="absolute -right-1 -bottom-1 size-4 rounded-full border-2 border-paper bg-ink" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-caption leading-copy text-graphite">
                  <span className="font-semibold text-ink">{item.name}</span> {item.action}
                </span>
                <span className="text-caption text-graphite">{item.time}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
