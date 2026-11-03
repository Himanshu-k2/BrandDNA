import { useState } from 'react';
import { CheckCircle2, Search, Clock } from 'lucide-react';
import { useFrame } from '@/components/mono/AppFrame';
import { PageHeader } from '@/components/mono/ui';
import { useSession } from '@/state/session';
import { RestrictedState } from '@/screens/UsersPage';
import {
  getJoiningRequests,
  acceptJoiningRequest,
  declineJoiningRequest,
  type JoiningRequest
} from '@/data/invitations';
import { SimulatedEmailModal } from '@/screens/admin/SimulatedEmailModal';

export function AdminInvitationsPage() {
  const { persona } = useSession();
  const { notify } = useFrame();
  const [requests, setRequests] = useState<JoiningRequest[]>(() => getJoiningRequests());
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<JoiningRequest | null>(null);
  const [activeLink, setActiveLink] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  if (persona.role !== 'admin') {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Joining Requests & Invitations"
          subtitle="Manage incoming workspace joining requests and member invitations."
        />
        <RestrictedState title="Invitations" />
      </div>
    );
  }

  const reloadRequests = () => {
    setRequests(getJoiningRequests());
  };

  const handleAccept = (req: JoiningRequest) => {
    const result = acceptJoiningRequest(req.id);
    if (result.request) {
      setSelectedRequest(result.request);
      setActiveLink(result.activationLink);
      setIsEmailModalOpen(true);
      notify(`Accepted ${req.name}'s request and dispatched invitation email!`, 'success');
      reloadRequests();
    }
  };

  const handleDecline = (req: JoiningRequest) => {
    declineJoiningRequest(req.id);
    notify(`Declined access request from ${req.name}`, 'info');
    reloadRequests();
  };

  const handleViewEmail = (req: JoiningRequest) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const activationLink = `${origin}/login?mode=activate&email=${encodeURIComponent(
      req.email
    )}&name=${encodeURIComponent(req.name)}&role=${req.role}&brand=${encodeURIComponent(req.brand)}&token=${req.activationToken}`;

    setSelectedRequest(req);
    setActiveLink(activationLink);
    setIsEmailModalOpen(true);
  };

  const filtered = requests.filter(item => {
    const query = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.roleTitle.toLowerCase().includes(query)
    );
  });

  const pendingList = filtered.filter(item => item.status === 'pending');
  const acceptedList = filtered.filter(item => item.status === 'accepted');

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-silver/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-3xl font-bold tracking-tight text-ink">
              Invitations
            </h1>
            <span className="inline-flex items-center rounded-full bg-brand-orange/15 px-2.5 py-0.5 text-caption font-bold text-ink">
              {pendingList.length} Pending
            </span>
          </div>
          <p className="mt-1 text-ui text-graphite">
            Review workspace access requests, grant role access, and dispatch secure onboarding invitation emails.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-mid" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search applicants..."
            className="h-10 w-full rounded-full border border-silver/80 bg-paper pl-9 pr-4 text-caption text-ink placeholder:text-mid focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all"
          />
        </div>
      </div>

      {/* Section 1: Pending */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-xl font-bold text-ink flex items-center gap-2">
            Pending
            <span className="text-caption font-medium text-mid">
              ({pendingList.length})
            </span>
          </h2>
        </div>

        {pendingList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-silver/90 bg-silver/10 p-8 text-center text-graphite">
            <p className="text-ui font-medium">No pending joining requests.</p>
            <p className="text-caption text-mid mt-1">
              When new employees request workspace access, their requests will appear here for review.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingList.map(req => (
              <div
                key={req.id}
                className="overflow-hidden rounded-2xl border border-silver/90 bg-paper shadow-2xs transition-shadow hover:shadow-xs flex flex-col sm:flex-row items-stretch"
              >
                {/* Left Profile Details matching Reference Image 2 */}
                <div className="flex flex-1 items-center gap-4 p-5 sm:p-6">
                  {/* Photo Avatar */}
                  <div className="relative size-16 shrink-0 rounded-full overflow-hidden border border-silver/80 bg-silver/20 flex items-center justify-center">
                    {req.avatarUrl ? (
                      <img
                        src={req.avatarUrl}
                        alt={req.name}
                        className="size-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image cannot load
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="font-bold text-ink text-base">
                        {req.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans text-lg font-bold text-ink">
                        {req.name}
                      </span>
                      <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Pending Approval
                      </span>
                    </div>

                    <span className="text-caption font-medium text-graphite">
                      {req.roleTitle}
                    </span>

                    <span className="text-caption text-graphite mt-0.5">
                      Requested to join <strong className="text-ink">{req.brand}</strong> as{' '}
                      <span className="font-semibold text-ink">
                        {req.role === 'brand_manager' ? 'Brand Manager' : 'Content Creator'}
                      </span>
                    </span>

                    <span className="text-[12px] text-mid mt-0.5 flex items-center gap-1.5">
                      <span>{req.connectionsCount} connections</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {req.requestedAt}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right Action Split Box matching Reference Image 2 */}
                <div className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-silver/80 flex flex-row sm:flex-col justify-stretch divide-x sm:divide-x-0 sm:divide-y divide-silver/80 bg-paper">
                  {/* DECLINE button */}
                  <button
                    type="button"
                    onClick={() => handleDecline(req)}
                    className="flex-1 sm:h-1/2 flex items-center justify-center font-bold text-[12px] tracking-wider uppercase text-[#E11D48] hover:bg-rose-50 transition-colors cursor-pointer py-3.5 sm:py-0"
                  >
                    DECLINE
                  </button>

                  {/* ACCEPT button */}
                  <button
                    type="button"
                    onClick={() => handleAccept(req)}
                    className="flex-1 sm:h-1/2 flex items-center justify-center font-bold text-[12px] tracking-wider uppercase text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer py-3.5 sm:py-0"
                  >
                    ACCEPT
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Accepted */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-xl font-bold text-ink flex items-center gap-2">
            Accepted
            <span className="text-caption font-medium text-mid">
              ({acceptedList.length})
            </span>
          </h2>
        </div>

        {acceptedList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-silver/90 bg-silver/10 p-8 text-center text-graphite">
            <p className="text-ui font-medium">No accepted members yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {acceptedList.map(req => (
              <div
                key={req.id}
                className="overflow-hidden rounded-2xl border border-silver/90 bg-paper shadow-2xs transition-shadow hover:shadow-xs flex flex-col sm:flex-row items-stretch"
              >
                {/* Left Profile Details matching Reference Image 2 */}
                <div className="flex flex-1 items-center gap-4 p-5 sm:p-6">
                  {/* Photo Avatar */}
                  <div className="relative size-16 shrink-0 rounded-full overflow-hidden border border-silver/80 bg-silver/20 flex items-center justify-center">
                    {req.avatarUrl ? (
                      <img
                        src={req.avatarUrl}
                        alt={req.name}
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="font-bold text-ink text-base">
                        {req.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans text-lg font-bold text-ink">
                        {req.name}
                      </span>
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Access Granted
                      </span>
                    </div>

                    <span className="text-caption font-medium text-graphite">
                      {req.roleTitle}
                    </span>

                    <span className="text-caption text-graphite mt-0.5">
                      {req.name} and you are now connected · <strong className="text-ink">{req.brand}</strong>
                    </span>

                    <span className="text-[12px] text-mid mt-0.5">
                      {req.connectionsCount} connections
                    </span>
                  </div>
                </div>

                {/* Right Action matching Reference Image 2: SEND MESSAGE / VIEW INVITATION EMAIL */}
                <div className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-silver/80 flex items-center justify-center bg-paper p-3 sm:p-0">
                  <button
                    type="button"
                    onClick={() => handleViewEmail(req)}
                    className="w-full h-full flex items-center justify-center font-bold text-[12px] tracking-wider uppercase text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer py-3 sm:py-0 text-center"
                  >
                    SEND MESSAGE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulated Corporate Email Modal Preview */}
      <SimulatedEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        request={selectedRequest}
        activationLink={activeLink}
      />
    </div>
  );
}
