export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  if (type === 'severity') {
    const severities = {
      critical: {
        label: 'Critical',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
      },
      warning: {
        label: 'Warning',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
      },
      info: {
        label: 'Notice',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500'
      }
    };
    const s = severities[status.toLowerCase()] || {
      label: status,
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
        {s.label}
      </span>
    );
  }

  const statuses = {
    draft: {
      label: 'Draft',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400'
    },
    under_review: {
      label: 'Under AI Review',
      bg: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
      dot: 'bg-blue-500'
    },
    analyzing: {
      label: 'Under AI Review',
      bg: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
      dot: 'bg-blue-500'
    },
    analyzed: {
      label: 'Analyzed',
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500'
    },
    needs_changes: {
      label: 'Needs Changes',
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500'
    },
    changes_requested: {
      label: 'Needs Changes',
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500'
    },
    pending_approval: {
      label: 'Pending Approval',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500'
    },
    submitted: {
      label: 'Pending Approval',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500'
    },
    in_review: {
      label: 'In Review',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500'
    },
    approved: {
      label: 'Approved',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500'
    },
    active: {
      label: 'Active',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    archived: {
      label: 'Archived',
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      dot: 'bg-slate-400'
    }
  };

  const current = statuses[status.toLowerCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
}
