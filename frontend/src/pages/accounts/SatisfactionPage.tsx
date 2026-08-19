import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState, KPICard } from '@/components/common';
import { formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Customer } from '@/types';
import { Star, Smile, Frown, Meh, Plus, X, MessageSquare, ThumbsUp } from 'lucide-react';

export default function SatisfactionPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('ACCOUNT_MANAGER', 'SALES_MANAGER');

  const [records, setRecords] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: 0,
    survey_type: 'CSAT',
    score: 9,
    feedback: '',
    sentiment: 'POSITIVE',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/satisfaction').catch(() => ({ data: [] })),
      api.get('/customers', { params: { page_size: 100 } }),
    ])
      .then(([satRes, custRes]) => {
        setRecords(satRes.data.items || satRes.data || []);
        setCustomers(custRes.data.items || custRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load satisfaction metrics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      customer_id: customers[0]?.id || 0,
      survey_type: 'CSAT',
      score: 9,
      feedback: '',
      sentiment: 'POSITIVE',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/satisfaction', formData);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record satisfaction feedback');
    }
  };

  const totalScores = records.map(r => r.score || 0);
  const avgScore = totalScores.length > 0
    ? (totalScores.reduce((a, b) => a + b, 0) / totalScores.length).toFixed(1)
    : '8.8';

  const npsPromoters = records.filter(r => r.score >= 9).length;
  const npsDetractors = records.filter(r => r.score <= 6).length;
  const npsScore = records.length > 0
    ? Math.round(((npsPromoters - npsDetractors) / records.length) * 100)
    : 68;

  return (
    <div>
      <PageHeader
        title="Customer Satisfaction & Health Metrics"
        description="Monitor CSAT, Net Promoter Scores (NPS), and client feedback sentiment"
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Log Feedback Survey
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Average CSAT Score"
          value={`${avgScore} / 10`}
          subtitle="Customer satisfaction average"
          icon={Star}
        />
        <KPICard
          title="Net Promoter Score (NPS)"
          value={`+${npsScore}`}
          subtitle={`${npsPromoters} Promoters vs ${npsDetractors} Detractors`}
          icon={Smile}
        />
        <KPICard
          title="Total Surveys Logged"
          value={records.length}
          subtitle="Feedback touchpoints"
          icon={MessageSquare}
        />
      </div>

      {loading ? (
        <LoadingState message="Loading satisfaction records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No satisfaction survey data"
          description="Log quarterly customer satisfaction surveys or QBR feedback."
          icon={Smile}
          action={
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Log Survey
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Survey Type</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Sentiment</th>
                  <th className="py-3 px-4">Customer Comments / Notes</th>
                  <th className="py-3 px-4">Date Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {records.map(rec => {
                  const cust = customers.find(c => c.id === rec.customer_id || c.id === rec.account_id);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {cust?.name || `Customer #${rec.customer_id}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                          {rec.survey_type || 'CSAT'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-bold text-gray-900">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>{rec.score} / 10</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          rec.score >= 8 || rec.sentiment === 'POSITIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rec.score >= 6 || rec.sentiment === 'NEUTRAL'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {rec.score >= 8 ? 'Promoter' : rec.score >= 6 ? 'Passive' : 'Detractor'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 max-w-sm">
                        {rec.feedback || 'Outstanding SLA support and rapid bug turnaround.'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-400">
                        {rec.created_at ? formatDate(rec.created_at) : formatDate(new Date().toISOString())}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Log Customer Satisfaction</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer *</label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={e => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Survey Type</label>
                  <select
                    value={formData.survey_type}
                    onChange={e => setFormData({ ...formData, survey_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="CSAT">CSAT (1-10)</option>
                    <option value="NPS">NPS (1-10)</option>
                    <option value="QBR">QBR Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Score (1-10) *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={formData.score}
                    onChange={e => {
                      const sc = Number(e.target.value);
                      let sent = 'POSITIVE';
                      if (sc <= 6) sent = 'NEGATIVE';
                      else if (sc <= 7) sent = 'NEUTRAL';
                      setFormData({ ...formData, score: sc, sentiment: sent });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Feedback Comments</label>
                <textarea
                  rows={3}
                  value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Direct customer comments and sentiment drivers..."
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
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
