import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, KPICard } from '@/components/common';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';
import type { Opportunity } from '@/types';
import { BarChart3, TrendingUp, DollarSign, Calendar, ShieldCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function ForecastPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [forecastReport, setForecastReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/opportunities', { params: { page_size: 200 } }),
      api.get('/reports/forecast').catch(() => ({ data: null })),
    ])
      .then(([oppsRes, repRes]) => {
        setOpportunities(oppsRes.data.items || oppsRes.data || []);
        setForecastReport(repRes.data);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load forecast data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDeals = opportunities.filter(o => o.stage !== 'CLOSED_LOST');
  const committed = openDeals.filter(o => o.probability >= 80).reduce((sum, o) => sum + (o.deal_value || 0), 0);
  const bestCase = openDeals.filter(o => o.probability >= 50).reduce((sum, o) => sum + (o.deal_value || 0), 0);
  const weighted = openDeals.reduce((sum, o) => sum + ((o.deal_value || 0) * (o.probability || 0)) / 100, 0);
  const totalPipeline = openDeals.reduce((sum, o) => sum + (o.deal_value || 0), 0);

  // Group by Stage for chart
  const stageData = [
    { stage: 'Prospecting', total: openDeals.filter(o => o.stage === 'PROSPECTING').reduce((s, o) => s + (o.deal_value || 0), 0) },
    { stage: 'Qualification', total: openDeals.filter(o => o.stage === 'QUALIFICATION').reduce((s, o) => s + (o.deal_value || 0), 0) },
    { stage: 'Proposal', total: openDeals.filter(o => o.stage === 'PROPOSAL').reduce((s, o) => s + (o.deal_value || 0), 0) },
    { stage: 'Negotiation', total: openDeals.filter(o => o.stage === 'NEGOTIATION').reduce((s, o) => s + (o.deal_value || 0), 0) },
    { stage: 'Closed Won', total: openDeals.filter(o => o.stage === 'CLOSED_WON').reduce((s, o) => s + (o.deal_value || 0), 0) },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Forecast & Pipeline Intelligence"
        description="Predict quarterly and annual revenue realization based on deal stage probabilities"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Weighted Forecast"
          value={formatCurrency(weighted)}
          subtitle="Probability-adjusted revenue"
          icon={TrendingUp}
        />
        <KPICard
          title="Commit Forecast"
          value={formatCurrency(committed)}
          subtitle="High confidence deals (≥80%)"
          icon={ShieldCheck}
        />
        <KPICard
          title="Best Case Forecast"
          value={formatCurrency(bestCase)}
          subtitle="Deals ≥50% probability"
          icon={DollarSign}
        />
        <KPICard
          title="Total Open Pipeline"
          value={formatCurrency(totalPipeline)}
          subtitle={`${openDeals.length} active opportunities`}
          icon={BarChart3}
        />
      </div>

      {loading ? (
        <LoadingState message="Calculating forecasts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Pipeline Distribution by Stage</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="stage" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Pipeline Value']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="total" fill="#1E293B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deal Stage Probability Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Key Contributing Deals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4">Deal Name</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Unweighted Deal Value</th>
                    <th className="py-3 px-4">Win Prob.</th>
                    <th className="py-3 px-4">Weighted Forecast Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {openDeals.slice(0, 10).map(deal => {
                    const weightedVal = ((deal.deal_value || 0) * (deal.probability || 0)) / 100;
                    return (
                      <tr key={deal.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">{deal.name}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">{deal.stage.replace('_', ' ')}</td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">{formatCurrency(deal.deal_value)}</td>
                        <td className="py-3.5 px-4 font-bold text-blue-600">{deal.probability}%</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">{formatCurrency(weightedVal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
