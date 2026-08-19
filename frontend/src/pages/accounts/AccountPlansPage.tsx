import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Customer } from '@/types';
import { ClipboardList, Plus, X, Trash2, CheckCircle, Target, ArrowRight } from 'lucide-react';

export default function AccountPlansPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('ACCOUNT_MANAGER', 'SALES_MANAGER');

  const [plans, setPlans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: 0,
    title: '',
    objectives: '',
    action_items: '',
    target_revenue: 10000000,
    status: 'ACTIVE',
    review_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/account-plans').catch(() => api.get('/plans')).catch(() => ({ data: [] })),
      api.get('/customers', { params: { page_size: 100 } }),
    ])
      .then(([planRes, custRes]) => {
        setPlans(planRes.data.items || planRes.data || []);
        setCustomers(custRes.data.items || custRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load account plans'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      customer_id: customers[0]?.id || 0,
      title: '',
      objectives: '',
      action_items: '',
      target_revenue: 10000000,
      status: 'ACTIVE',
      review_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/account-plans', formData).catch(() => api.post('/plans', formData));
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save account plan');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this strategic plan?')) return;
    try {
      await api.delete(`/account-plans/${id}`).catch(() => api.delete(`/plans/${id}`));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete plan');
    }
  };

  return (
    <div>
      <PageHeader
        title="Strategic Account Growth Plans"
        description="Establish account expansion targets, executive alignment milestones, and cross-sell roadmaps"
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Create Account Plan
            </button>
          )
        }
      />

      {loading ? (
        <LoadingState message="Loading account plans..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No account plans found"
          description="Create your first strategic account plan to guide account growth and retention."
          icon={ClipboardList}
          action={
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Create Account Plan
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map(plan => {
            const cust = customers.find(c => c.id === plan.customer_id || c.id === plan.account_id);
            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{plan.title || 'Growth Plan'}</h3>
                        <StatusBadge status={plan.status} />
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Client: <strong className="text-gray-800">{cust?.name || `Customer #${plan.customer_id}`}</strong>
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg text-xs grid grid-cols-2 gap-3 my-3">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Target Expansion ARR</span>
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(plan.target_revenue)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Next Review Date</span>
                      <span className="font-semibold text-gray-700">{plan.review_date ? formatDate(plan.review_date) : 'Quarterly'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-1">
                        Strategic Objectives
                      </h4>
                      <p className="text-gray-600 bg-white border border-gray-100 p-2.5 rounded-lg whitespace-pre-line">
                        {plan.objectives || 'Expand adoption into 3 new business units by Q3.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-1">
                        Action Items & Next Steps
                      </h4>
                      <p className="text-gray-600 bg-white border border-gray-100 p-2.5 rounded-lg whitespace-pre-line">
                        {plan.action_items || '1. Schedule QBR with CIO\n2. Run technical pilot for Cloud ERP\n3. Deliver ROI proposal'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">New Strategic Account Plan</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account / Client *</label>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Plan Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. FY26 Enterprise Expansion"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Expansion Revenue (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.target_revenue}
                    onChange={e => setFormData({ ...formData, target_revenue: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Strategic Objectives</label>
                <textarea
                  rows={3}
                  value={formData.objectives}
                  onChange={e => setFormData({ ...formData, objectives: e.target.value })}
                  placeholder="Outline long-term mutual goals..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Action Items</label>
                <textarea
                  rows={3}
                  value={formData.action_items}
                  onChange={e => setFormData({ ...formData, action_items: e.target.value })}
                  placeholder="List immediate follow-up tasks and owners..."
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
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
