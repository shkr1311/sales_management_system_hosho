import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KPICard, LoadingState, ErrorState, PageHeader } from '@/components/common';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';
import {
  IndianRupee, Target, TrendingUp, Users, Calendar, GitBranch,
  BadgePercent, BarChart3, Building2, RefreshCw, Star, AlertCircle,
  Megaphone, UserCheck, PieChart, Package, MessageSquare, Lightbulb,
  LineChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = ['#334155', '#64748b', '#94a3b8', '#cbd5e1', '#0f172a', '#475569'];

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  if (hasRole('SALES_REP')) return <SalesRepDashboard />;
  if (hasRole('SALES_MANAGER')) return <ManagerDashboard />;
  if (hasRole('ACCOUNT_MANAGER')) return <AccountDashboard />;
  if (hasRole('MARKETING')) return <MarketingDashboard />;
  if (hasRole('PRODUCT_MANAGER')) return <ProductDashboard />;
  if (hasRole('EXECUTIVE')) return <ExecutiveDashboard />;

  return <SalesRepDashboard />;
}

function SalesRepDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/sales-rep')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Sales Dashboard" description="Your sales performance overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Revenue" value={formatCurrency(data.revenue)} icon={IndianRupee} />
        <KPICard title="Target" value={formatCurrency(data.target)} icon={Target} />
        <KPICard title="Achievement" value={`${data.achievement_pct}%`} icon={TrendingUp}
          subtitle={data.achievement_pct >= 100 ? 'Target reached' : 'In progress'} />
        <KPICard title="Win Rate" value={`${data.win_rate}%`} icon={BarChart3} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard title="Open Opportunities" value={data.open_opportunities} icon={GitBranch} />
        <KPICard title="Pipeline Value" value={formatCurrency(data.pipeline_value)} icon={IndianRupee} />
        <KPICard title="Upcoming Activities" value={data.upcoming_activities} icon={Calendar}
          subtitle="Next 7 days" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Deals Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={[
                  { name: 'Won', value: data.won_deals },
                  { name: 'Lost', value: data.lost_deals },
                  { name: 'Open', value: data.open_opportunities },
                ]}
                cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {[0, 1, 2].map((_, i) => (
                  <Cell key={i} fill={['#059669', '#dc2626', '#3b82f6'][i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/manager')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Manager Dashboard" description="Team performance overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Team Revenue" value={formatCurrency(data.team_revenue)} icon={IndianRupee} />
        <KPICard title="Team Target" value={formatCurrency(data.team_target)} icon={Target} />
        <KPICard title="Achievement" value={`${data.achievement_pct}%`} icon={TrendingUp} />
        <KPICard title="Win Rate" value={`${data.win_rate}%`} icon={BarChart3} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard title="Pipeline Value" value={formatCurrency(data.pipeline_value)} icon={GitBranch} />
        <KPICard title="Pending Discounts" value={data.pending_discounts} icon={BadgePercent} />
        <KPICard title="Deals Won" value={data.total_won} icon={TrendingUp} subtitle={`${data.total_lost} lost`} />
      </div>
      {data.rep_performance && data.rep_performance.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Rep Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.rep_performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function AccountDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/account')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Account Dashboard" description="Account management overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Managed Accounts" value={data.managed_accounts} icon={Building2} />
        <KPICard title="Upcoming Renewals" value={data.upcoming_renewals} icon={RefreshCw} subtitle="Next 30 days" />
        <KPICard title="Overdue Renewals" value={data.overdue_renewals} icon={AlertCircle} />
        <KPICard title="Avg Satisfaction" value={`${data.avg_satisfaction}/10`} icon={Star}
          subtitle={`${data.low_satisfaction_count} low scores`} />
      </div>
    </div>
  );
}

function MarketingDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/marketing')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Marketing Dashboard" description="Campaign and lead performance" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Active Campaigns" value={data.active_campaigns} icon={Megaphone} subtitle={`${data.total_campaigns} total`} />
        <KPICard title="Total Leads" value={data.total_leads} icon={UserCheck} />
        <KPICard title="Qualified Leads" value={data.qualified_leads} icon={Users} />
        <KPICard title="Conversion Rate" value={`${data.conversion_rate}%`} icon={PieChart} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Campaign Spend" value={formatCurrency(data.total_cost)} icon={IndianRupee} />
        <KPICard title="Revenue Influenced" value={formatCurrency(data.revenue_influenced)} icon={TrendingUp} />
        <KPICard title="Campaign ROI" value={`${data.roi}%`} icon={BarChart3} />
      </div>
    </div>
  );
}

function ProductDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/product')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Product Dashboard" description="Product feedback and roadmap overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title="Total Feedback" value={data.total_feedback} icon={MessageSquare} subtitle={`${data.new_feedback} new`} />
        <KPICard title="Feature Requests" value={data.total_feature_requests} icon={Lightbulb} subtitle={`${data.pending_features} pending`} />
        <KPICard title="Avg Product Rating" value={`${data.avg_product_rating}/5`} icon={Star} />
        <KPICard title="Upcoming Releases" value={data.upcoming_releases} icon={Package} />
      </div>
    </div>
  );
}

function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/executive')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Executive Dashboard" description="Business performance overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Revenue" value={formatCurrency(data.total_revenue)} icon={IndianRupee} />
        <KPICard title="Win Rate" value={`${data.win_rate}%`} icon={TrendingUp} />
        <KPICard title="Avg Deal Size" value={formatCurrency(data.avg_deal_size)} icon={BarChart3} />
        <KPICard title="Target Achievement" value={`${data.target_achievement}%`} icon={Target} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard title="Pipeline Value" value={formatCurrency(data.pipeline_value)} icon={GitBranch} />
        <KPICard title="Weighted Pipeline" value={formatCurrency(data.weighted_pipeline)} icon={LineChart} />
        <KPICard title="Total Deals" value={data.total_deals} icon={Users} subtitle={`${data.won_deals} won / ${data.lost_deals} lost`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.revenue_by_region && data.revenue_by_region.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Revenue by Region</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenue_by_region}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']} />
                <Bar dataKey="revenue" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {data.pipeline_by_stage && data.pipeline_by_stage.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Pipeline by Stage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={data.pipeline_by_stage}
                  cx="50%" cy="50%" outerRadius={90}
                  dataKey="value" nameKey="stage"
                  label={(entry: any) => `${entry.stage || ''}: ${entry.count || ''}`}
                >
                  {data.pipeline_by_stage.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Pipeline Value']} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
