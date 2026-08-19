import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';
import type { Product, Competitor } from '@/types';
import { Package, Plus, X, Trash2, Shield, Check, Tag } from 'lucide-react';

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: 'HSH-PRO-01',
    description: '',
    category: 'Software Platform',
    price: 1500000,
    is_active: true,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/products'),
      api.get('/competitors').catch(() => ({ data: [] })),
    ])
      .then(([prodRes, compRes]) => {
        setProducts(prodRes.data.items || prodRes.data || []);
        setCompetitors(compRes.data.items || compRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      sku: `HSH-${Math.floor(100 + Math.random() * 900)}`,
      description: '',
      category: 'Enterprise SaaS',
      price: 1500000,
      is_active: true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  return (
    <div>
      <PageHeader
        title="Product Catalog & Competitor Matrix"
        description="Maintain product pricing tiers, SKUs, and competitive advantages against market rivals"
        action={
          hasRole('PRODUCT_MANAGER', 'EXECUTIVE') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )
        }
      />

      {loading ? (
        <LoadingState message="Loading product catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <div className="space-y-8">
          {/* Products Grid */}
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" /> Active Product Tiers & Pricing
            </h3>
            {products.length === 0 ? (
              <EmptyState title="No products in catalog" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map(prod => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                          {prod.sku || `SKU-${prod.id}`}
                        </span>
                        {hasRole('PRODUCT_MANAGER') && (
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <h4 className="font-bold text-gray-900 text-base mb-1">{prod.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                        {prod.description || 'Enterprise grade solution with high availability and dedicated support.'}
                      </p>

                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(prod.price || prod.base_price || 0)}
                        <span className="text-xs font-normal text-gray-400"> / license</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-600">{prod.category || 'Platform'}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <Check className="w-3.5 h-3.5" /> Ready for Sales
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Competitor Analysis Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" /> Competitive Intelligence & Battle Matrix
            </h3>
            {competitors.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No competitors tracked.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitors.map(comp => (
                  <div key={comp.id} className="p-4 bg-gray-50 rounded-lg text-xs space-y-2 border border-gray-100">
                    <div className="flex items-center justify-between font-bold text-gray-900 text-sm">
                      <span>{comp.name}</span>
                      <span className="text-[11px] font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Rival</span>
                    </div>
                    <p className="text-gray-500">{comp.description || 'Direct market competitor.'}</p>
                    {comp.strengths && (
                      <div className="text-emerald-700">
                        <strong>Their Strength:</strong> {comp.strengths}
                      </div>
                    )}
                    {comp.weaknesses && (
                      <div className="text-red-700">
                        <strong>Our Advantage:</strong> {comp.weaknesses}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add New Product SKU</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Hosho Cloud Intelligence Suite"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Base Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description & Key Capabilities</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Target use cases and architecture..."
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
