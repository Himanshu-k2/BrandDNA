import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewsAPI } from '../api/reviews';
import { brandsAPI } from '../api/brands';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck2,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFiltersAndReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandsRes, reviewsRes] = await Promise.all([
        brandsAPI.getAll().catch(() => ({ data: { data: [] } })),
        reviewsAPI.getAll({
          status: statusFilter || undefined,
          brandId: brandFilter || undefined,
          page,
          limit: 15,
        }),
      ]);

      const brandList = Array.isArray(brandsRes.data)
        ? brandsRes.data
        : brandsRes.data?.data || [];
      setBrands(brandList);

      const reviewList = Array.isArray(reviewsRes.data)
        ? reviewsRes.data
        : reviewsRes.data?.data || [];
      setReviews(reviewList);
      if (reviewsRes.data?.pagination?.pages) {
        setTotalPages(reviewsRes.data.pagination.pages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersAndReviews();
  }, [statusFilter, brandFilter, page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Content Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history, AI compliance findings, and approval statuses across all content.
          </p>
        </div>

        {user?.role !== 'reviewer' && (
          <Link
            to="/reviews/new"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-600/25 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            Check New Content
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
          <Filter className="h-3.5 w-3.5" />
          Filter:
        </div>

        {/* Brand Filter */}
        <select
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="analyzed">Ready for Review (Analyzed)</option>
          <option value="submitted">Pending Approval (Submitted)</option>
          <option value="in_review">In Review</option>
          <option value="changes_requested">Needs Changes</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
        </select>

        {(statusFilter || brandFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setBrandFilter('');
              setPage(1);
            }}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 underline ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <LoadingState message="Loading content reviews..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchFiltersAndReviews} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No content reviews found"
          description={
            statusFilter || brandFilter
              ? 'No reviews match your current filter settings.'
              : 'Submit your first piece of copy to verify facts, terminology, and tone.'
          }
          action={
            <Link
              to="/reviews/new"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Check Content
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {reviews.map((rev) => {
            const revId = rev._id || rev.id;
            return (
              <Link
                key={revId}
                to={`/reviews/${revId}`}
                className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors block group"
              >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                    {rev.brand?.name || 'Workspace'}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    {rev.contentType?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
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
                      Score: {rev.overallScore}/100
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-relaxed group-hover:text-teal-700 transition-colors">
                  {rev.content}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span>Author: {rev.submittedBy?.name || 'Creator'}</span>
                  <span>·</span>
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{rev.findings?.length || 0} findings detected</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={rev.status} />
                <span className="text-xs font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Inspect
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
        </div>
      )}
    </div>
  );
}
