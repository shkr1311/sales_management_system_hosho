import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState, KPICard } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Campaign } from '@/types';
import { Megaphone, Plus, TrendingUp, DollarSign, Users, X, Trash2 } from 'lucide-react';

export default function CampaignsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('MARKETING');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'DIGITAL',
    budget: 500000,
    actual_spend: 350000,
    leads_count: 45,
    status: 'ACTIVE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    revenue_generated: 2800000,
  });

  const fetchData = () => {
    setLoading(true);
    api.get('/campaigns')
      .then(res => setCampaigns(res.data.items || res.data || []))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load campaigns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      type: 'DIGITAL',
      budget: 500000,
      actual_spend: 0,
      leads_count: 0,
      status: 'ACTIVE',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      revenue_generated: 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/campaigns', formData);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create campaign');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this marketing campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete campaign');
    }
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + ((c as any).revenue_generated || 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads_count || 0), 0);
  const roi = totalBudget > 0 ? Math.round(((totalRevenue - totalBudget) / totalBudget) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Marketing Campaigns & Sales ROI"
        description="Track campaign performance, acquisition spend, generated pipeline, and marketing ROI"
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Launch Campaign
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Generated Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="Influenced closed revenue"
          icon={TrendingUp}
        />
        <KPICard
          title="Total Marketing Spend"
          value={formatCurrency(totalBudget)}
          subtitle="Allocated campaign budget"
          icon={DollarSign}
        />
        <KPICard
          title="Overall Marketing ROI"
          value={`${roi}%`}
          subtitle="Revenue-to-spend multiplier"
          trend={roi}
          icon={Megaphone}
        />
        <KPICard
          title="Generated Leads"
          value={totalLeads}
          subtitle="Inbound qualified leads"
          icon={Users}
        />
      </div>

      {loading ? (
        <LoadingState message="Loading marketing campaigns..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns found"
          description="Create your first marketing campaign to track lead generation and ROI."
          icon={Megaphone}
          action={
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Launch Campaign
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Channel / Type</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Leads Acquired</th>
                  <th className="py-3 px-4">Revenue Generated</th>
                  <th className="py-3 px-4">Campaign ROI</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {campaigns.map(camp => {
                  const rev = (camp as any).revenue_generated || 0;
                  const bud = camp.budget || 1;
                  const campRoi = Math.round(((rev - bud) / bud) * 100);

                  return (
                    <tr key={camp.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {camp.name}
                        <div className="text-xs text-gray-400 font-normal">
                          {camp.start_date ? formatDate(camp.start_date) : 'Ongoing'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                          {camp.type || 'DIGITAL'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {formatCurrency(camp.budget || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">
                        {camp.leads_count || 0} leads
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {formatCurrency(rev)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          campRoi > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {campRoi > 0 ? `+${campRoi}%` : `${campRoi}%`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={camp.status || 'ACTIVE'} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canManage && (
                          <button
                            onClick={() => handleDelete(camp.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
              <h2 className="text-lg font-bold text-gray-900">Launch Marketing Campaign</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Q1 LinkedIn Enterprise SaaS Push"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Channel / Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="DIGITAL">Digital Ads</option>
                    <option value="EMAIL">Email Campaign</option>
                    <option value="EVENT">Webinar / Event</option>
                    <option value="CONTENT">Content Syndication</option>
                    <option value="OUTBOUND">Outbound ABM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Budget (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
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
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
