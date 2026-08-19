import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/common';
import api from '@/services/api';
import type { Product } from '@/types';
import { BookOpen, Plus, FileCode, Shield, FileText, Search, X, Trash2 } from 'lucide-react';

const DOC_TYPES = [
  { value: 'API_SPEC', label: 'API Specification', icon: FileCode },
  { value: 'USER_GUIDE', label: 'Sales & User Guide', icon: BookOpen },
  { value: 'ARCHITECTURE', label: 'Architecture Overview', icon: FileText },
  { value: 'SECURITY_WHITEPAPER', label: 'Security & Compliance', icon: Shield },
];

export default function DocumentationPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('PRODUCT_MANAGER');

  const [docs, setDocs] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Selected Doc for reading
  const [activeDoc, setActiveDoc] = useState<any | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    doc_type: 'API_SPEC',
    product_id: 0,
    content: '',
  });

  const fetchData = () => {
    setLoading(true);
    const params: any = {};
    if (typeFilter) params.doc_type = typeFilter;

    Promise.all([
      api.get('/product-documents', { params }).catch(() => api.get('/docs', { params })).catch(() => ({ data: [] })),
      api.get('/products'),
    ])
      .then(([docRes, prodRes]) => {
        const list = docRes.data.items || docRes.data || [];
        setDocs(list);
        setProducts(prodRes.data.items || prodRes.data || []);
        if (list.length > 0 && !activeDoc) {
          setActiveDoc(list[0]);
        }
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load product documentation'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      doc_type: 'API_SPEC',
      product_id: products[0]?.id || 0,
      content: '# Overview\nDescribe the technical capabilities and system endpoints...',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/product-documents', formData).catch(() => api.post('/docs', formData));
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to publish document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this technical document?')) return;
    try {
      await api.delete(`/product-documents/${id}`).catch(() => api.delete(`/docs/${id}`));
      setActiveDoc(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete doc');
    }
  };

  const filteredDocs = docs.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.content && d.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        title="Technical & Sales Product Documentation"
        description="Search API specifications, architecture whitepapers, and sales engineering playbooks"
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Document
            </button>
          )
        }
      />

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documentation topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Document Categories</option>
          {DOC_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading documentation..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : docs.length === 0 ? (
        <EmptyState
          title="No documentation found"
          description="Publish technical guides and architecture playbooks for your sales engineers."
          icon={BookOpen}
          action={
            canManage && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Add Document
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doc List */}
          <div className="space-y-2">
            {filteredDocs.map(doc => {
              const Icon = DOC_TYPES.find(t => t.value === doc.doc_type || t.value === doc.category)?.icon || FileText;
              const isSelected = activeDoc?.id === doc.id;

              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">{doc.title}</h4>
                    <span className={`text-[11px] font-medium block mt-0.5 ${isSelected ? 'text-slate-300' : 'text-gray-400'}`}>
                      {doc.doc_type?.replace('_', ' ') || doc.category || 'General'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Doc Content Viewer */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[400px]">
            {activeDoc ? (
              <div>
                <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {activeDoc.doc_type?.replace('_', ' ') || activeDoc.category || 'Specification'}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">{activeDoc.title}</h2>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(activeDoc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {activeDoc.content || 'Detailed technical specs and implementation guidelines.'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs italic">
                Select a document from the left list to view.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Publish Technical Document</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Enterprise REST API Integration Architecture"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Document Type</label>
                  <select
                    value={formData.doc_type}
                    onChange={e => setFormData({ ...formData, doc_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    {DOC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Markdown Documentation Content *</label>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="# Technical Spec..."
                  className="w-full font-mono text-xs border border-gray-300 rounded-lg p-3 outline-none focus:border-slate-800"
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
                  Publish Doc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
