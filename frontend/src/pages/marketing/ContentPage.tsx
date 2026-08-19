import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/common';
import api from '@/services/api';
import { FileEdit, Plus, Download, FileText, Presentation, Shield, Trash2, X, ExternalLink } from 'lucide-react';

const CONTENT_TYPES = [
  { value: 'PITCH_DECK', label: 'Pitch Deck', icon: Presentation },
  { value: 'CASE_STUDY', label: 'Case Study', icon: FileText },
  { value: 'ONE_PAGER', label: 'One Pager', icon: FileEdit },
  { value: 'BATTLE_CARD', label: 'Competitor Battlecard', icon: Shield },
];

export default function ContentPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('MARKETING');

  const [contentItems, setContentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'PITCH_DECK',
    target_audience: 'Enterprise CIOs & CTOs',
    file_url: 'https://docs.hosho.in/collateral/pitch-deck-2026.pdf',
    description: '',
  });

  const fetchData = () => {
    setLoading(true);
    const params: any = {};
    if (typeFilter) params.type = typeFilter;

    api.get('/content-items', { params }).catch(() => api.get('/content', { params }))
      .then(res => setContentItems(res.data.items || res.data || []))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load marketing collateral'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      type: 'PITCH_DECK',
      target_audience: 'Enterprise CIOs & CTOs',
      file_url: 'https://docs.hosho.in/collateral/pitch-deck-2026.pdf',
      description: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/content-items', formData).catch(() => api.post('/content', formData));
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to publish collateral');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;
    try {
      await api.delete(`/content-items/${id}`).catch(() => api.delete(`/content/${id}`));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete content');
    }
  };

  return (
    <div>
      <PageHeader
        title="Sales Collateral & Content Enablement"
        description="Equip sales reps with battlecards, customer case studies, solution decks, and ROI calculators"
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Collateral
            </button>
          )
        }
      />

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Content Types</option>
          {CONTENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading sales collateral..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : contentItems.length === 0 ? (
        <EmptyState
          title="No collateral uploaded"
          description="Publish sales collateral, competitive battlecards, and case studies."
          icon={FileEdit}
          action={
            canManage && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Add Collateral
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentItems.map(item => {
            const Icon = CONTENT_TYPES.find(t => t.value === item.type)?.icon || FileText;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-slate-100 text-slate-800 rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {item.description || 'Sales enablement asset aligned with customer pain points.'}
                  </p>

                  <div className="p-2.5 bg-gray-50 rounded-lg text-xs space-y-1 text-gray-600 mb-4">
                    <div>
                      <span className="text-gray-400 font-medium">Target Persona: </span>
                      <span className="font-semibold text-gray-800">{item.target_audience || 'All Decision Makers'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Format: </span>
                      <span className="font-semibold text-gray-800">{item.type?.replace('_', ' ') || 'PDF Document'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <a
                    href={item.file_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Asset
                  </a>
                  <button
                    onClick={() => alert(`Downloading ${item.title}...`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
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
              <h2 className="text-lg font-bold text-gray-900">Upload Sales Collateral</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. FY26 Product Battlecard vs TechRival"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Collateral Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    {CONTENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={formData.target_audience}
                    onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                    placeholder="e.g. VP of Engineering"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Asset Link / Cloud URL</label>
                <input
                  type="url"
                  value={formData.file_url}
                  onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary and key talking points..."
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
                  Publish Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
