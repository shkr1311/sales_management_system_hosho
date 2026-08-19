export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '0';
  const n = Number(num);
  if (isNaN(n)) return '0';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    INACTIVE: 'bg-gray-100 text-gray-600',
    PROSPECT: 'bg-blue-100 text-blue-700',
    CHURNED: 'bg-red-100 text-red-700',
    NEW: 'bg-sky-100 text-sky-700',
    CONTACTED: 'bg-amber-100 text-amber-700',
    QUALIFIED: 'bg-indigo-100 text-indigo-700',
    CONVERTED: 'bg-emerald-100 text-emerald-700',
    UNQUALIFIED: 'bg-gray-100 text-gray-600',
    LOST: 'bg-red-100 text-red-700',
    OPEN: 'bg-blue-100 text-blue-700',
    WON: 'bg-emerald-100 text-emerald-700',
    ON_HOLD: 'bg-amber-100 text-amber-700',
    PLANNED: 'bg-gray-100 text-gray-600',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    OVERDUE: 'bg-red-100 text-red-700',
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    UPCOMING: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    RENEWED: 'bg-emerald-100 text-emerald-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    IN_REVIEW: 'bg-amber-100 text-amber-700',
    SUBMITTED: 'bg-sky-100 text-sky-700',
    UNDER_REVIEW: 'bg-amber-100 text-amber-700',
    PAUSED: 'bg-amber-100 text-amber-700',
    PROSPECTING: 'bg-gray-100 text-gray-600',
    QUALIFICATION: 'bg-blue-100 text-blue-700',
    PROPOSAL: 'bg-indigo-100 text-indigo-700',
    NEGOTIATION: 'bg-amber-100 text-amber-700',
    CLOSED_WON: 'bg-emerald-100 text-emerald-700',
    CLOSED_LOST: 'bg-red-100 text-red-700',
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-amber-100 text-amber-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}
