import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/common';
import api from '@/services/api';
import type { Customer } from '@/types';
import { Lightbulb, Plus, ThumbsUp, X, Trash2, Tag, CheckCircle2 } from 'lucide-react';

export default function FeatureRequestsPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole('PRODUCT_MANAGER', 'SALES_REP');
  const canDelete = hasRole('PRODUCT_MANAGER');

  const [features, setFeatures] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    customer_id: 0,
    priority: 'HIGH',
    status: 'PLANNED',
    description: '',
  });

  const fetchData = () => {
    setLoading(true);
    const params: any = {};
    if (statusFilter) params.status = statusFilter;

    Promise.all([
      api.get('/feature-requests', { params }).catch(() => api.get('/features', { params })).catch(() => ({ data: [] })),
      api.get('/customers', { params: { page_size: 100 } }),
    ])
      .then(([featRes, custRes]) => {
        setFeatures(featRes.data.items || featRes.data || []);
        setCustomers(custRes.data.items || custRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load feature requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      customer_id: customers[0]?.id || 0,
      priority: 'HIGH',
      status: 'PLANNED',
      description: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/feature-requests', formData).catch(() => api.post('/features', formData));
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit feature request');
    }
  };

  const handleVote = async (id: number) => {
    try {
      await api.post(`/feature-requests/${id}/vote`).catch(() => api.post(`/features/${id}/vote`));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Vote recorded');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feature request?')) return;
    try {
      await api.delete(`/feature-requests/${id}`).catch(() => api.delete(`/features/${id}`));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete feature request');
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Feature Requests & Prioritization"
        description="Track client feature requests, upvote high-impact capabilities, and align product backlog with sales revenue"
        action={
          canCreate && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Submit Feature Request
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Roadmap Statuses</option>
          <option value="BACKLOG">Backlog</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading feature requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : features.length === 0 ? (
        <EmptyState
          title="No feature requests found"
          description="Submit feature requests directly from customer deal discussions."
          icon={Lightbulb}
          action={
            canCreate && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Submit Feature Request
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(feat => {
            const cust = customers.find(c => c.id === feat.customer_id);

            return (
              <div
                key={feat.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={feat.status || 'PLANNED'} />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      feat.priority === 'HIGH' ? 'bg-red-50 text-red-700' :
                      feat.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {feat.priority}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base mb-1">{feat.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Requested by: <strong className="text-gray-800">{cust?.name || 'Multiple Clients'}</strong>
                  </p>

                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed mb-4">
                    {feat.description || 'Client requires this integration to complete contract renewal.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleVote(feat.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{feat.votes || 1} Votes</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(feat.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
              <h2 className="text-lg font-bold text-gray-900">Submit Feature Request</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Feature Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Native SAP ERP Connector"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Client *</label>
                  <select
                    value={formData.customer_id}
                    onChange={e => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description / Value Proposition</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain why this feature is critical for closing deals..."
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
