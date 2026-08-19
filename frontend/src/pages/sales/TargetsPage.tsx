import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState, KPICard } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { SalesTarget, User } from '@/types';
import { Target, TrendingUp, Plus, X, Award, CheckCircle } from 'lucide-react';

export default function TargetsPage() {
  const { hasRole, user } = useAuth();
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: 0,
    target_amount: 5000000,
    achieved_amount: 0,
    period: 'Q1_2026',
    start_date: '2026-01-01',
    end_date: '2026-03-31',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/targets'),
      api.get('/users').catch(() => ({ data: [] })),
    ])
      .then(([tarRes, userRes]) => {
        setTargets(tarRes.data.items || tarRes.data || []);
        setUsers(userRes.data.items || userRes.data || []);
      })
      .catch(err => {
        const detail = err.response?.data?.detail;
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join(', ')
            : 'Failed to load sales targets';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      user_id: users[0]?.id || user?.id || 0,
      target_amount: 5000000,
      achieved_amount: 0,
      period: 'Q1_2026',
      start_date: '2026-01-01',
      end_date: '2026-03-31',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/targets', formData);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to set target');
    }
  };

  const totalTarget = targets.reduce((sum, t) => sum + Number(t.target_amount || 0), 0);
  const totalAchieved = targets.reduce((sum, t) => sum + Number(t.achieved_amount || 0), 0);
  const overallPercentage = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;


  return (
    <div>
      <PageHeader
        title="Sales Targets & Quota Performance"
        description="Track individual and team quota attainment metrics in real-time"
        action={
          hasRole('SALES_MANAGER', 'EXECUTIVE') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Set New Target
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Total Team Target"
          value={formatCurrency(totalTarget)}
          subtitle="Assigned team quota"
          icon={Target}
        />
        <KPICard
          title="Total Achieved"
          value={formatCurrency(totalAchieved)}
          subtitle={`${overallPercentage}% of quota reached`}
          trend={overallPercentage - 100}
          icon={Award}
        />
        <KPICard
          title="Remaining to Quota"
          value={formatCurrency(Math.max(0, totalTarget - totalAchieved))}
          subtitle="Gap to 100% goal"
          icon={TrendingUp}
        />
      </div>

      {loading ? (
        <LoadingState message="Loading sales targets..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : targets.length === 0 ? (
        <EmptyState
          title="No targets defined"
          description="Create sales targets for reps and managers to track attainment."
          icon={Target}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="py-3 px-4">Sales Representative</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Target Quota</th>
                  <th className="py-3 px-4">Achieved Value</th>
                  <th className="py-3 px-4 w-64">Attainment %</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {targets.map(tar => {
                  const targetUser = users.find(u => u.id === tar.user_id);
                  const targetAmt = Number(tar.target_amount || 0);
                  const achievedAmt = Number(tar.achieved_amount || 0);
                  const pct = targetAmt > 0 ? Math.round((achievedAmt / targetAmt) * 100) : 0;


                  return (
                    <tr key={tar.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {targetUser ? targetUser.full_name : `User #${tar.user_id}`}
                        <div className="text-xs text-gray-400 font-normal">
                          {targetUser?.email || ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-700">
                        {tar.period.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {formatCurrency(tar.target_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {formatCurrency(tar.achieved_amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{pct}%</span>
                            <span className="text-gray-400">{pct >= 100 ? 'Goal Exceeded' : 'In Progress'}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {pct >= 100 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle className="w-3 h-3" /> Met Quota
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                            On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Set Target Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Set Sales Quota Target</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Representative *</label>
                <select
                  value={formData.user_id}
                  onChange={e => setFormData({ ...formData, user_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role?.name || 'User'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Period</label>
                <input
                  type="text"
                  value={formData.period}
                  onChange={e => setFormData({ ...formData, period: e.target.value })}
                  placeholder="e.g. Q1_2026 or FY26"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.target_amount}
                  onChange={e => setFormData({ ...formData, target_amount: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                >
                  Assign Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
