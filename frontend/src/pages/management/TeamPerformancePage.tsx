import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, KPICard } from '@/components/common';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';
import type { User, Opportunity, SalesTarget } from '@/types';
import { Users, Trophy, TrendingUp, Target, Award, CheckCircle2 } from 'lucide-react';

interface RepStats {
  user: User;
  totalDeals: number;
  wonDeals: number;
  wonRevenue: number;
  pipelineValue: number;
  target: number;
  attainment: number;
  winRate: number;
}

export default function TeamPerformancePage() {
  const [repStats, setRepStats] = useState<RepStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPerformance = () => {
    setLoading(true);
    Promise.all([
      api.get('/users'),
      api.get('/opportunities', { params: { page_size: 200 } }),
      api.get('/targets'),
    ])
      .then(([usersRes, oppsRes, targetsRes]) => {
        const usersList: User[] = usersRes.data.items || usersRes.data || [];
        const oppsList: Opportunity[] = oppsRes.data.items || oppsRes.data || [];
        const targetsList: SalesTarget[] = targetsRes.data.items || targetsRes.data || [];

        const salesUsers = usersList.filter(u => u.role?.name === 'SALES_REP' || u.role?.name === 'SALES_MANAGER');

        const stats: RepStats[] = salesUsers.map(u => {
          const userOpps = oppsList.filter(o => o.owner_id === u.id);
          const won = userOpps.filter(o => o.stage === 'CLOSED_WON');
          const totalWonRev = won.reduce((sum, o) => sum + (o.deal_value || 0), 0);
          const pipelineVal = userOpps.filter(o => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST')
            .reduce((sum, o) => sum + (o.deal_value || 0), 0);

          const userTarget = targetsList.find(t => t.user_id === u.id)?.target_amount || 5000000;
          const attainment = Math.round((totalWonRev / userTarget) * 100);
          const closedCount = userOpps.filter(o => o.stage === 'CLOSED_WON' || o.stage === 'CLOSED_LOST').length;
          const winRate = closedCount > 0 ? Math.round((won.length / closedCount) * 100) : 0;

          return {
            user: u,
            totalDeals: userOpps.length,
            wonDeals: won.length,
            wonRevenue: totalWonRev,
            pipelineValue: pipelineVal,
            target: userTarget,
            attainment,
            winRate,
          };
        });

        stats.sort((a, b) => b.wonRevenue - a.wonRevenue);
        setRepStats(stats);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load team performance'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const totalTeamWon = repStats.reduce((sum, r) => sum + r.wonRevenue, 0);
  const totalTeamPipeline = repStats.reduce((sum, r) => sum + r.pipelineValue, 0);
  const avgWinRate = repStats.length > 0
    ? Math.round(repStats.reduce((sum, r) => sum + r.winRate, 0) / repStats.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="Sales Team Performance & Leaderboard"
        description="Monitor rep quota attainment, conversion rates, and closed revenue"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Team Closed Revenue"
          value={formatCurrency(totalTeamWon)}
          subtitle="YTD closed-won deals"
          icon={Trophy}
        />
        <KPICard
          title="Active Team Pipeline"
          value={formatCurrency(totalTeamPipeline)}
          subtitle="In-flight opportunities"
          icon={TrendingUp}
        />
        <KPICard
          title="Average Win Rate"
          value={`${avgWinRate}%`}
          subtitle="Closed deal conversion"
          icon={CheckCircle2}
        />
        <KPICard
          title="Active Sales Reps"
          value={repStats.length}
          subtitle="Reps tracked"
          icon={Users}
        />
      </div>

      {loading ? (
        <LoadingState message="Loading team performance stats..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPerformance} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Representative Leaderboard</h3>
            <span className="text-xs text-gray-500">Sorted by Closed Revenue</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Sales Representative</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Closed Revenue</th>
                  <th className="py-3 px-4">Active Pipeline</th>
                  <th className="py-3 px-4">Win Rate</th>
                  <th className="py-3 px-4 w-56">Quota Attainment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {repStats.map((stat, idx) => (
                  <tr key={stat.user.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 text-center font-bold">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{stat.user.full_name}</div>
                      <div className="text-xs text-gray-400">{stat.user.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                        {stat.user.role?.name || 'REP'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatCurrency(stat.wonRevenue)}
                      <div className="text-xs font-normal text-gray-400">{stat.wonDeals} deals won</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {formatCurrency(stat.pipelineValue)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600">
                      {stat.winRate}%
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{stat.attainment}%</span>
                          <span className="text-gray-400">Target: {formatCurrency(stat.target)}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              stat.attainment >= 100 ? 'bg-emerald-500' : stat.attainment >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, stat.attainment)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
