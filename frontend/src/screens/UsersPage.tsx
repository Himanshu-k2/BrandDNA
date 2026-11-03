import { useEffect, useState } from 'react';
import { Ban, ChevronDown, CircleCheck, Ellipsis, Lock, Mail, RotateCcw, UserPlus } from 'lucide-react';
import { useFrame } from '@/components/mono/AppFrame';
import { MonoAvatar } from '@/components/mono/Brand';
import { FloatingField } from '@/components/mono/FloatingField';
import { Button, Card, EmptyState, ICON, MenuRow, Modal, PageHeader, Popover, Stagger, TD, TH, TR, Tabs, Tooltip, focusRing } from '@/components/mono/ui';
import { StatusDot, type Tone } from '@/components/mono/status';
import { USERS, type UserStatus, type WorkspaceUser } from '@/data/platform';
import { cn } from '@/lib/cn';
import { ROLE_LABEL, useSession, type Role } from '@/state/session';
import type { LucideIcon } from 'lucide-react';
import { adminAPI } from '@/api/admin';
import { getRegisteredUsers } from '@/data/invitations';

const STATUS: Record<UserStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  active: { label: 'Active', tone: 'success', icon: CircleCheck },
  invited: { label: 'Invited', tone: 'info', icon: Mail },
  suspended: { label: 'Suspended', tone: 'danger', icon: Ban }
};
const ROLES: Role[] = ['admin', 'brand_manager', 'creator'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RestrictedState({ title }: { title: string }) {
  return (
    <Card>
      <EmptyState icon={Lock} title={`${title} is restricted`}>
        Only Platform Admins can access this page.
      </EmptyState>
    </Card>
  );
}

function mergeWithRegisteredUsers(baseUsers: WorkspaceUser[]): WorkspaceUser[] {
  const registered = getRegisteredUsers();
  if (!registered || registered.length === 0) return baseUsers;
  const registeredEmails = new Set(registered.map(r => r.email.toLowerCase()));
  const rest = baseUsers.filter(u => !registeredEmails.has(u.email.toLowerCase()));
  return [...registered, ...rest];
}

export function UsersPage() {
  const { persona } = useSession();
  const { notify } = useFrame();
  const [users, setUsers] = useState<WorkspaceUser[]>(() => mergeWithRegisteredUsers(USERS));
  const [filter, setFilter] = useState<'all' | Role>('all');
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getUsers().then((res: any) => {
      const data = res.data?.data?.users || res.data?.users || res.data;
      if (Array.isArray(data) && data.length > 0) {
        const mapped: WorkspaceUser[] = data.map((u: any) => ({
          id: u._id || u.id,
          name: u.name || 'BrandDNA User',
          initials: (u.name || 'User').split(' ').map((p: string) => p[0]).join('').slice(0, 2),
          role: (u.role === 'admin' ? 'admin' : u.role === 'brand_manager' ? 'brand_manager' : 'creator') as Role,
          email: u.email || 'user@demobrands.test',
          status: (u.isActive === false ? 'suspended' : 'active') as UserStatus,
          joined: 'Recently',
          lastActive: 'Today',
          brands: u.assignedBrands || ['NovaFit']
        }));
        const existingIds = new Set(mapped.map(u => u.id));
        const combined = [...mapped, ...USERS.filter(u => !existingIds.has(u.id))];
        setUsers(mergeWithRegisteredUsers(combined));
      } else {
        setUsers(mergeWithRegisteredUsers(USERS));
      }
    }).catch(() => {
      setUsers(mergeWithRegisteredUsers(USERS));
    });
  }, []);

  if (persona.role !== 'admin') {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="User & Role Mgmt" subtitle="Manage who can draft, review and approve across brand workspaces." />
        <RestrictedState title="User & Role Mgmt" />
      </div>
    );
  }

  const patch = (id: string, next: Partial<WorkspaceUser>) => setUsers(list => list.map(user => (user.id === id ? { ...user, ...next } : user)));
  const rows = users.filter(user => filter === 'all' || user.role === filter);
  const count = (value: Role) => users.filter(user => user.role === value).length;

  const invite = () => {
    if (!EMAIL.test(email.trim())) {
      setError('Enter a valid work email.');
      return;
    }
    const name = email.trim().split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    setUsers(list => [
      ...list,
      { id: `u${Date.now()}`, name, initials: name.split(' ').map(part => part[0]).join('').slice(0, 2), email: email.trim(), role, brands: ['NovaFit'], lastActive: 'Invite sent', status: 'invited' }
    ]);
    notify(`Invite sent to ${email.trim()}`, 'success');
    setInviting(false);
    setEmail('');
    setError('');
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="User & Role Mgmt"
        subtitle="Manage team roles and brand workspace permissions."
        actions={
          <Button size="lg" onClick={() => setInviting(true)}>
            <UserPlus className="size-5" {...ICON} /> Invite user
          </Button>
        }
      />

      <Tabs
        label="Filter by role"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: 'All', count: users.length },
          { id: 'admin', label: 'Admins', count: count('admin') },
          { id: 'brand_manager', label: 'Brand Managers', count: count('brand_manager') },
          { id: 'creator', label: 'Creators', count: count('creator') }
        ]}
      />

      <Stagger index={1}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr>
                  <th className={cn(TH, 'pl-6')}>User</th>
                  <th className={TH}>Role</th>
                  <th className={TH}>Brand access</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Last active</th>
                  <th className={cn(TH, 'pr-6 text-right')}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(user => {
                  const self = user.email === persona.email;
                  const status = STATUS[user.status];
                  const roleControl = (
                    <Popover
                      align="left"
                      trigger={({ open, toggle }) => (
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={open}
                          aria-label={`Role for ${user.name}: ${ROLE_LABEL[user.role]}`}
                          disabled={self}
                          onClick={toggle}
                          className={cn(
                            'press flex h-8 cursor-pointer items-center gap-1 rounded-full border border-silver bg-paper px-3 text-caption font-medium whitespace-nowrap text-ink transition-colors hover:border-mid disabled:cursor-not-allowed disabled:opacity-40',
                            focusRing
                          )}
                        >
                          {ROLE_LABEL[user.role]}
                          <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} {...ICON} />
                        </button>
                      )}
                    >
                      {close =>
                        ROLES.map(option => (
                          <MenuRow
                            key={option}
                            active={option === user.role}
                            onClick={() => {
                              patch(user.id, { role: option });
                              notify(`${user.name} is now ${ROLE_LABEL[option]}`);
                              close();
                            }}
                          >
                            {ROLE_LABEL[option]}
                          </MenuRow>
                        ))
                      }
                    </Popover>
                  );
                  return (
                    <tr key={user.id} className={TR}>
                      <td className={cn(TD, 'pl-6')}>
                        <div className="flex items-center gap-3">
                          <MonoAvatar initials={user.initials} tone={user.status === 'suspended' ? 'silver' : 'graphite'} />
                          <div className="flex min-w-0 flex-col">
                            <span className="font-medium text-ink flex items-center gap-1.5">
                              {user.name}
                              {self && <span className="text-caption font-normal text-graphite"> · You</span>}
                              {user.lastActive === 'Online now' && (
                                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                                  Online
                                </span>
                              )}
                            </span>
                            <span className="text-caption text-graphite">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className={TD}>{self ? <Tooltip content="You can’t change your own role.">{roleControl}</Tooltip> : roleControl}</td>
                      <td className={cn(TD, 'text-caption')}>{user.brands.join(', ')}</td>
                      <td className={TD}>
                        <StatusDot tone={status.tone}>{status.label}</StatusDot>
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap')}>{user.lastActive}</td>
                      <td className={cn(TD, 'pr-6')}>
                        <div className="flex justify-end">
                          <Popover
                            trigger={({ open, toggle }) => (
                              <button
                                type="button"
                                aria-label={`Actions for ${user.name}`}
                                aria-haspopup="menu"
                                aria-expanded={open}
                                disabled={self}
                                onClick={toggle}
                                className={cn('flex size-8 cursor-pointer items-center justify-center rounded-full text-graphite transition-colors hover:bg-silver/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40', focusRing)}
                              >
                                <Ellipsis className="size-5" {...ICON} />
                              </button>
                            )}
                          >
                            {close => (
                              <>
                                {user.status === 'invited' && (
                                  <MenuRow
                                    onClick={() => {
                                      notify(`Invite re-sent to ${user.email}`);
                                      close();
                                    }}
                                  >
                                    <RotateCcw className="size-4" {...ICON} /> Resend invite
                                  </MenuRow>
                                )}
                                <MenuRow
                                  onClick={() => {
                                    const suspended = user.status === 'suspended';
                                    patch(user.id, { status: suspended ? 'active' : 'suspended' });
                                    notify(`${user.name} ${suspended ? 'reactivated' : 'suspended'}`, suspended ? 'success' : 'warning');
                                    close();
                                  }}
                                >
                                  {user.status === 'suspended' ? <CircleCheck className="size-4" {...ICON} /> : <Ban className="size-4" {...ICON} />}
                                  {user.status === 'suspended' ? 'Reactivate' : 'Suspend access'}
                                </MenuRow>
                              </>
                            )}
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Stagger>

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="Invite a teammate"
        description="They’ll get an email invite and appear here as Invited until they accept."
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviting(false)}>
              Cancel
            </Button>
            <Button onClick={invite}>
              <Mail className="size-4" {...ICON} /> Send invite
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <FloatingField
            label="Work email"
            type="email"
            value={email}
            error={error || undefined}
            onChange={event => {
              setEmail(event.target.value);
              setError('');
            }}
          />
          <div className="flex flex-col gap-2">
            <span className="text-caption font-medium text-mid">Role</span>
            <Tabs label="Role" value={role} onChange={setRole} items={ROLES.map(option => ({ id: option, label: ROLE_LABEL[option] }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
