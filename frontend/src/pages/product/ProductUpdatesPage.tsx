import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Product } from '@/types';
import { RefreshCw, Plus, X, Sparkles, Calendar, Tag, Trash2 } from 'lucide-react';

export default function ProductUpdatesPage() {
  const { hasRole } = useAuth();
  const [updates, setUpdates] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: 0,
    version: 'v2.4.0',
    title: 'Spring 2026 Enterprise Security & API Performance Release',
    release_notes: '- 4x faster report rendering\n- Role-based granular row security\n- Enhanced MySQL connector support',
    release_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/product-updates').catch(() => ({ data: [] })),
      api.get('/products'),
    ])
      .then(([updRes, prodRes]) => {
        setUpdates(updRes.data.items || updRes.data || []);
        setProducts(prodRes.data.items || prodRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load product updates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      product_id: products[0]?.id || 0,
      version: 'v2.5.0',
      title: '',
      release_notes: '',
      release_date: new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/product-updates', formData);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to post product update');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this release update?')) return;
    try {
      await api.delete(`/product-updates/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete update');
    }
  };

  return (
    <div>
      <PageHeader
        title="Product Roadmap & Release Changelogs"
        description="Communicate new feature releases, upcoming sprint roadmap, and technical fixes with sales"
        action={
          hasRole('PRODUCT_MANAGER', 'EXECUTIVE') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Publish Release
            </button>
          )
        }
      />

      {loading ? (
        <LoadingState message="Loading release notes..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : updates.length === 0 ? (
        <EmptyState
          title="No product updates recorded"
          description="Publish your first release note to inform sales reps of new product features."
          icon={RefreshCw}
          action={
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Publish Release
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {updates.map(upd => {
            const prod = products.find(p => p.id === upd.product_id);

            return (
              <div
                key={upd.id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md">
                      {upd.version || 'v2.0'}
                    </span>
                    <h3 className="font-bold text-gray-900 text-base">{upd.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {upd.release_date ? formatDate(upd.release_date) : 'Recently'}
                    </span>
                    {prod && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                        {prod.name}
                      </span>
                    )}
                    {hasRole('PRODUCT_MANAGER') && (
                      <button
                        onClick={() => handleDelete(upd.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-lg text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                  {upd.release_notes || 'Feature enhancements, bug fixes, and general system stability updates.'}
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
              <h2 className="text-lg font-bold text-gray-900">Publish Product Release</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product</label>
                  <select
                    value={formData.product_id}
                    onChange={e => setFormData({ ...formData, product_id: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Version Tag *</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                    placeholder="e.g. v2.4.0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Release Headline *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. High-throughput Multi-tenant Pipeline Engine"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Release Notes / Changelog</label>
                <textarea
                  rows={4}
                  required
                  value={formData.release_notes}
                  onChange={e => setFormData({ ...formData, release_notes: e.target.value })}
                  placeholder="- Highlight key user benefits\n- Document API changes"
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
                  Publish Changelog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
