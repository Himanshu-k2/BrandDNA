import { useState } from 'react';
import { Check, LogOut, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFrame } from '@/components/mono/AppFrame';
import { MonoAvatar } from '@/components/mono/Brand';
import { FloatingField } from '@/components/mono/FloatingField';
import { Button, Card, ICON, PageHeader, Pill, SectionHeader, Stagger, Switch, Tabs } from '@/components/mono/ui';
import { cn } from '@/lib/cn';
import { ROLE_LABEL, useSession, type Role } from '@/state/session';

const PERMISSIONS: Record<Role, Array<{ label: string; allowed: boolean }>> = {
  admin: [
    { label: 'Edit guidelines, facts & pricing tiers', allowed: true },
    { label: 'Manage team roles & brand workspaces', allowed: true },
    { label: 'Master override on sign-off', allowed: true }
  ],
  reviewer: [
    { label: 'Inspect revision diffs & audit trail', allowed: true },
    { label: 'Request changes with required notes', allowed: true },
    { label: 'Approve & seal audit certificates', allowed: true }
  ],
  creator: [
    { label: 'Draft & run dual-track audits', allowed: true },
    { label: 'Apply 1-click fixes, submit for sign-off', allowed: true },
    { label: 'Approve own submissions', allowed: false }
  ]
};

export function SettingsPage() {
  const { persona } = useSession();
  const { notify } = useFrame();
  const navigate = useNavigate();
  const [name, setName] = useState(persona.name);
  const [title, setTitle] = useState(persona.title);
  const [prefs, setPrefs] = useState({ digest: true, urgent: true, mentions: true, weekly: false });
  const [diffView, setDiffView] = useState<'unified' | 'split'>('unified');

  const toggles: Array<{ key: keyof typeof prefs; label: string; hint: string }> = [
    { key: 'urgent', label: 'Urgent sign-off alerts', hint: 'Deadlines and blocking reviews, immediately.' },
    { key: 'mentions', label: 'Mentions & replies', hint: 'When someone @mentions you in a review thread.' },
    { key: 'digest', label: 'Daily email digest', hint: 'One summary of everything that changed.' },
    { key: 'weekly', label: 'Weekly compliance report', hint: 'Pass rates and trends per brand workspace.' }
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        subtitle="Your profile, notifications and workspace preferences."
        actions={
          <Button size="lg" onClick={() => notify('Settings saved', 'success')}>
            <Save className="size-5" {...ICON} /> Save changes
          </Button>
        }
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <Stagger index={1} className="flex flex-col gap-4">
          <SectionHeader title="Profile" />
          <Card className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
              <MonoAvatar initials={persona.initials} className="size-12 text-ui" />
              <div className="flex flex-col gap-1">
                <span className="text-ui font-semibold text-ink">{persona.name}</span>
                <Pill variant="outline" caps={false} className="w-max">
                  {ROLE_LABEL[persona.role]}
                </Pill>
              </div>
            </div>
            <FloatingField label="Full name" value={name} onChange={event => setName(event.target.value)} />
            <FloatingField label="Job title" value={title} onChange={event => setTitle(event.target.value)} />
            <FloatingField label="Work email" value={persona.email} readOnly aria-describedby="email-note" />
            <p id="email-note" className="-mt-4 text-caption text-mid">
              Email is managed by your identity provider.
            </p>
          </Card>
        </Stagger>

        <Stagger index={2} className="flex flex-col gap-4">
          <SectionHeader title="Notifications" />
          <Card className="flex flex-col p-2">
            {toggles.map(item => (
              <div key={item.key} className="flex items-center justify-between gap-4 rounded-item p-4 transition-colors hover:bg-silver/24">
                <div className="flex flex-col">
                  <span className="text-ui text-ink">{item.label}</span>
                  <span className="text-caption text-graphite">{item.hint}</span>
                </div>
                <Switch label={item.label} checked={prefs[item.key]} onChange={value => setPrefs(state => ({ ...state, [item.key]: value }))} />
              </div>
            ))}
          </Card>
        </Stagger>

        <Stagger index={3} className="flex flex-col gap-4">
          <SectionHeader title="Preferences" />
          <Card className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-ui text-ink">Default diff layout</span>
                <span className="text-caption text-graphite">Used when you open Compare versions.</span>
              </div>
              <Tabs
                label="Default diff layout"
                value={diffView}
                onChange={setDiffView}
                items={[
                  { id: 'unified', label: 'Unified' },
                  { id: 'split', label: 'Side-by-side' }
                ]}
              />
            </div>
          </Card>
        </Stagger>

        <Stagger index={4} className="flex flex-col gap-4">
          <SectionHeader title="Permissions & security" />
          <Card className="flex flex-col gap-4 p-6">
            <ul className="flex flex-col gap-3">
              {PERMISSIONS[persona.role].map(permission => (
                <li key={permission.label} className={cn('flex items-center gap-3 text-ui', permission.allowed ? 'text-ink' : 'text-graphite')}>
                  <span className={cn('flex size-6 items-center justify-center rounded-full', permission.allowed ? 'bg-ink text-paper' : 'border border-silver')}>
                    {permission.allowed ? <Check className="size-4" {...ICON} /> : <X className="size-4" {...ICON} />}
                  </span>
                  <span className={permission.allowed ? undefined : 'line-through'}>{permission.label}</span>
                  <span className="sr-only">{permission.allowed ? 'allowed' : 'not allowed'}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 border-t border-silver pt-4">
              <Button variant="secondary" onClick={() => notify('Signed out of all other sessions')}>
                Sign out other sessions
              </Button>
              <Button variant="ghost" onClick={() => {
                localStorage.removeItem('branddna_token');
                localStorage.removeItem('branddna_user');
                navigate('/login');
              }}>
                <LogOut className="size-4" {...ICON} /> Log out
              </Button>
            </div>
          </Card>
        </Stagger>
      </div>
    </div>
  );
}
