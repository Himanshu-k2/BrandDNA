import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewsAPI } from '../api/reviews';
import {
  Inbox,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';

export default function ReviewQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await reviewsAPI.getAll({ status: 'pending_approval' });
      const list = Array.isArray(data) ? data : data?.data || [];
      setQueue(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6 text-teal-600" />
            Authorized Approval Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Content drafts awaiting formal human decision before external deployment.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
          {queue.length} Pending Sign-offs
        </span>
      </div>

      {loading ? (
        <LoadingState message="Loading pending approval queue..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchQueue} />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description="There are currently no drafts waiting in the approval queue. Great job!"
        />
      ) : (
        <div className="space-y-4">
          {queue.map((rev) => {
            const revId = rev._id || rev.id;
            return (
              <div
                key={revId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                      {rev.brand?.name || 'Brand Workspace'}
                    </span>
                    <StatusBadge status={rev.status} />
                    <span className="text-xs text-slate-400 capitalize">
                      {rev.contentType?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-500">v{rev.currentVersion || 1}</span>
                    {typeof rev.overallScore === 'number' && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                          rev.overallScore >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : rev.overallScore >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        AI Score: {rev.overallScore}/100
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-relaxed">
                    "{rev.content}"
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Author: {rev.submittedBy?.name || 'Creator'}</span>
                    <span>·</span>
                    <span>Submitted {new Date(rev.submittedAt || rev.createdAt).toLocaleString()}</span>
                    <span>·</span>
                    <span>{rev.findings?.length || 0} AI findings flagged</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/reviews/${revId}`}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    Review & Decide
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
