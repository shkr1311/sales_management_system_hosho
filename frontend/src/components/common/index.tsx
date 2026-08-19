import { cn, getStatusColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Loader2, FileX2 } from 'lucide-react';

// ---- KPI Card ----
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ElementType;
  className?: string;
}

export function KPICard({ title, value, subtitle, trend, icon: Icon, className }: KPICardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
            )}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

// ---- Status Badge ----
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const displayStatus = status.replace(/_/g, ' ');
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
      getStatusColor(status),
      className
    )}>
      {displayStatus}
    </span>
  );
}

// ---- Loading State ----
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ---- Empty State ----
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
}

export function EmptyState({ title, description, action, icon: Icon = FileX2 }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 text-center max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ---- Error State ----
interface ErrorStateProps {
  message?: any;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  const displayMessage = (() => {
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) {
      return message
        .map((m: any) => (typeof m === 'string' ? m : m?.msg || JSON.stringify(m)))
        .join(', ');
    }
    if (typeof message === 'object' && message !== null) {
      if (typeof message.detail === 'string') return message.detail;
      if (Array.isArray(message.detail)) {
        return message.detail
          .map((m: any) => (typeof m === 'string' ? m : m?.msg || JSON.stringify(m)))
          .join(', ');
      }
      return JSON.stringify(message);
    }
    return String(message || 'Something went wrong');
  })();

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
        <FileX2 className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Error</h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-md">{displayMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition"
        >
          Try again
        </button>
      )}
    </div>
  );
}


// ---- Page Header ----
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
