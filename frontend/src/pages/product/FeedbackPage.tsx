import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Customer, Product } from '@/types';
import { MessageSquare, Plus, X, Tag, Trash2, Building2 } from 'lucide-react';

export default function FeedbackPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole('PRODUCT_MANAGER', 'SALES_REP', 'ACCOUNT_MANAGER');
  const canDelete = hasRole('PRODUCT_MANAGER');

  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: 0,
    product_id: undefined as number | undefined,
    category: 'USABILITY',
    feedback_text: '',
    sentiment: 'NEUTRAL',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/customer-feedback').catch(() => api.get('/feedback')).catch(() => ({ data: [] })),
      api.get('/customers', { params: { page_size: 100 } }),
      api.get('/products'),
    ])
      .then(([fbRes, custRes, prodRes]) => {
        setFeedbackList(fbRes.data.items || fbRes.data || []);
        setCustomers(custRes.data.items || custRes.data || []);
        setProducts(prodRes.data.items || prodRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load customer feedback'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      customer_id: customers[0]?.id || 0,
      product_id: products[0]?.id || undefined,
      category: 'USABILITY',
      feedback_text: '',
      sentiment: 'POSITIVE',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customer-feedback', formData).catch(() => api.post('/feedback', formData));
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit feedback');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feedback log?')) return;
    try {
      await api.delete(`/customer-feedback/${id}`).catch(() => api.delete(`/feedback/${id}`));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete feedback');
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Feedback from Sales Interactions"
        description="Aggregate real-time client feedback, product friction points, and sentiment captured by sales reps"
        action={
          canCreate && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Log Customer Feedback
            </button>
          )
        }
      />

      {loading ? (
        <LoadingState message="Loading customer feedback..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : feedbackList.length === 0 ? (
        <EmptyState
          title="No feedback collected"
          description="Log client feedback from sales demos and calls to improve product roadmap decisions."
          icon={MessageSquare}
          action={
            canCreate && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Log Customer Feedback
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbackList.map(item => {
            const cust = customers.find(c => c.id === item.customer_id);
            const prod = products.find(p => p.id === item.product_id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      item.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-700' :
                      item.sentiment === 'NEGATIVE' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.sentiment || 'NEUTRAL'}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-800">{cust?.name || `Customer #${item.customer_id}`}</span>
                  </div>

                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed mb-3">
                    "{item.feedback_text || item.feedback}"
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>{prod?.name || 'Hosho Core'}</span>
                  <span>{item.category || 'Feedback'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Log Customer Feedback</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer / Account *</label>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="USABILITY">Usability</option>
                    <option value="PERFORMANCE">Performance</option>
                    <option value="INTEGRATION">Integration</option>
                    <option value="PRICING">Pricing / Packaging</option>
                    <option value="FEATURE_GAP">Feature Gap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sentiment</label>
                  <select
                    value={formData.sentiment}
                    onChange={e => setFormData({ ...formData, sentiment: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="POSITIVE">Positive</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="NEGATIVE">Negative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Remarks / Pain Point *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.feedback_text}
                  onChange={e => setFormData({ ...formData, feedback_text: e.target.value })}
                  placeholder="Exact client feedback from demo or status check..."
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
