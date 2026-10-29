import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../api/notifications';
import {
  Bell,
  CheckCheck,
  Check,
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
  MessageSquare,
  FileCheck2,
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await notificationsAPI.getAll({ unreadOnly });
      const list = Array.isArray(data) ? data : data?.data || [];
      setNotifications(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'review_analyzed':
        return <Sparkles className="h-4 w-4 text-teal-600" />;
      case 'review_approved':
        return <CheckCheck className="h-4 w-4 text-emerald-600" />;
      case 'changes_requested':
      case 'review_rejected':
        return <AlertCircle className="h-4 w-4 text-rose-600" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-teal-600" />
            Audit Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workflow alerts, AI analysis completions, and review updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              unreadOnly
                ? 'bg-teal-50 text-teal-800 border-teal-200 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {unreadOnly ? 'Showing Unread Only' : 'Show All'}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Fetching notifications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description={
            unreadOnly
              ? 'You have read all notifications.'
              : 'You have no new alerts or review updates.'
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {notifications.map((n) => {
            const reviewId = n.relatedReview?._id || n.relatedReview;
            return (
              <div
                key={n._id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  !n.isRead ? 'bg-teal-50/20' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-bold ${
                          !n.isRead ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n._id, e)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg transition-colors text-xs font-semibold"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {reviewId && (
                    <Link
                      to={`/reviews/${reviewId}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      Open
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
