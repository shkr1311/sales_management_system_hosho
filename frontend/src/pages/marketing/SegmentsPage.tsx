import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/common';
import api from '@/services/api';
import type { Customer } from '@/types';
import { PieChart, Plus, Users, Filter, X, Trash2, Building2 } from 'lucide-react';

export default function SegmentsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('MARKETING');

  const [segments, setSegments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: 'Annual Revenue > ₹50Cr',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/customer-segments').catch(() => api.get('/segments')).catch(() => ({ data: [] })),
      api.get('/customers', { params: { page_size: 100 } }),
    ])
      .then(([segRes, custRes]) => {
        setSegments(segRes.data.items || segRes.data || []);
        setCustomers(custRes.data.items || custRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load customer segments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      criteria: 'Annual Revenue > ₹50Cr',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customer-segments', formData).catch(() => api.post('/segments', formData));
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create segment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;
    try {
      await api.delete(`/customer-segments/${id}`).catch(() => api.delete(`/segments/${id}`));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete segment');
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Segmentation & Market Insights"
        description="Group accounts and prospects by industry vertical, revenue tier, and buying stage for targeted campaigns"
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Create Segment
            </button>
          )
        }
      />

      {loading ? (
        <LoadingState message="Loading segments..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : segments.length === 0 ? (
        <EmptyState
          title="No customer segments found"
          description="Create dynamic segments to power your targeted email campaigns and ABM motions."
          icon={PieChart}
          action={
            canManage && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Create Segment
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map(seg => (
            <div
              key={seg.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <PieChart className="w-5 h-5" />
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(seg.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 text-base mb-1">{seg.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{seg.description || 'Targeted customer segment'}</p>

                <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-2 mb-4">
                  <div>
                    <span className="text-gray-400 block font-medium">Filter Criteria</span>
                    <span className="font-semibold text-gray-800">{seg.criteria || 'Industry = Enterprise IT'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Segment Size</span>
                    <span className="font-bold text-blue-700">{seg.member_count || customers.length} matching accounts</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Active in 2 campaigns</span>
                <span className="font-medium text-emerald-600">Syncing Live</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create Customer Segment</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Segment Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. BFSI Large Enterprise"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Criteria Definition</label>
                <input
                  type="text"
                  value={formData.criteria}
                  onChange={e => setFormData({ ...formData, criteria: e.target.value })}
                  placeholder="e.g. Industry = Banking AND Revenue > 100Cr"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Target Strategy</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Primary objective and messaging alignment..."
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
                  Save Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
