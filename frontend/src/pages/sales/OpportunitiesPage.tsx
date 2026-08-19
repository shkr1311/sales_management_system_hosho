import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Opportunity, Customer, Competitor } from '@/types';
import {
  Plus, Search, X, Target, Pencil, Trash2, ArrowRight,
  Eye, Building2, Calendar, ShieldAlert, Award, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';

const STAGES = [
  'PROSPECTING',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];

const DEFAULT_PROBABILITIES: Record<string, number> = {
  PROSPECTING: 10,
  QUALIFICATION: 30,
  PROPOSAL: 60,
  NEGOTIATION: 80,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

export default function OpportunitiesPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('SALES_REP', 'SALES_MANAGER', 'ACCOUNT_MANAGER');

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [viewingOpp, setViewingOpp] = useState<Opportunity | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    customer_id: 0,
    deal_value: 500000,
    stage: 'PROSPECTING',
    probability: 10,
    expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    competitor_id: undefined as number | undefined,
    notes: '',
  });

  const fetchData = () => {
    setLoading(true);
    const params: any = { page, page_size: 15 };
    if (search) params.search = search;
    if (stageFilter) params.stage = stageFilter;
    if (statusFilter) params.status = statusFilter;

    Promise.all([
      api.get('/opportunities', { params }),
      api.get('/customers', { params: { page_size: 100 } }),
      api.get('/competitors').catch(() => ({ data: [] })),
    ])
      .then(([oppsRes, custRes, compRes]) => {
        setOpportunities(oppsRes.data.items || oppsRes.data || []);
        setTotal(oppsRes.data.total || 0);
        setTotalPages(oppsRes.data.total_pages || 1);
        setCustomers(custRes.data.items || custRes.data || []);
        setCompetitors(compRes.data.items || compRes.data || []);
      })
      .catch(err => {
        const detail = err.response?.data?.detail;
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join(', ')
            : 'Failed to load opportunities';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetchData();
  }, [page, search, stageFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingOpp(null);
    setFormData({
      name: '',
      customer_id: customers[0]?.id || 0,
      deal_value: 500000,
      stage: 'PROSPECTING',
      probability: 10,
      expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      competitor_id: undefined,
      notes: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (opp: Opportunity) => {
    setEditingOpp(opp);
    setFormData({
      name: opp.name,
      customer_id: opp.customer_id,
      deal_value: Number(opp.deal_value),
      stage: opp.stage,
      probability: opp.probability,
      expected_close_date: opp.expected_close_date ? opp.expected_close_date.split('T')[0] : '',
      competitor_id: opp.competitor_id || undefined,
      notes: opp.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        customer_id: Number(formData.customer_id),
        deal_value: Number(formData.deal_value),
        probability: Number(formData.probability),
        competitor_id: formData.competitor_id ? Number(formData.competitor_id) : null,
        notes: formData.notes || null,
        expected_close_date: formData.expected_close_date || null,
      };

      if (editingOpp) {
        await api.put(`/opportunities/${editingOpp.id}`, payload);
      } else {
        await api.post('/opportunities', payload);
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save deal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await api.delete(`/opportunities/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete opportunity');
    }
  };

  const handleStageChange = async (opp: Opportunity, newStage: string) => {
    try {
      await api.put(`/opportunities/${opp.id}/stage`, { stage: newStage });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to advance stage');
    }
  };

  const totalValue = opportunities.reduce((sum, o) => sum + (Number(o.deal_value) || 0), 0);

  return (
    <div>
      <PageHeader
        title="Sales Opportunities Pipeline"
        description={`${total} deals totaling ${formatCurrency(totalValue)} across pipeline stages`}
        action={
          canWrite && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> New Opportunity
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
            placeholder="Search deal name, notes, or customer..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          value={stageFilter}
          onChange={e => { setStageFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Deal Stages</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open Pipeline</option>
          <option value="WON">Won Deals</option>
          <option value="LOST">Lost Deals</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading opportunities..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No opportunities found"
          description="Create your first deal to track potential revenue in your pipeline."
          icon={Target}
          action={
            canWrite && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Add Opportunity
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4">Deal Name</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Deal Value</th>
                    <th className="py-3 px-4">Win Prob.</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Target Close</th>
                    <th className="py-3 px-4">Competitor</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {opportunities.map(opp => {
                    const cust = customers.find(c => c.id === opp.customer_id);
                    const comp = competitors.find(c => c.id === opp.competitor_id);
                    const custName = opp.customer_name || cust?.name || `Customer #${opp.customer_id}`;
                    const compName = opp.competitor_name || comp?.name;

                    return (
                      <tr key={opp.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div>
                            <div>{opp.name}</div>
                            {opp.notes && (
                              <div className="text-xs text-gray-400 font-normal truncate max-w-xs">
                                {opp.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{custName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {formatCurrency(opp.deal_value)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  opp.probability >= 70 ? 'bg-emerald-500' :
                                  opp.probability >= 40 ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${opp.probability}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-semibold">{opp.probability}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={opp.stage} />
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600">
                          {opp.expected_close_date ? formatDate(opp.expected_close_date) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {compName ? (
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                              {compName}
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingOpp(opp)}
                              title="View Deal Details"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {canWrite && opp.stage !== 'CLOSED_WON' && opp.stage !== 'CLOSED_LOST' && (
                              <button
                                onClick={() => {
                                  const currIdx = STAGES.indexOf(opp.stage);
                                  if (currIdx < STAGES.length - 2) {
                                    handleStageChange(opp, STAGES[currIdx + 1]);
                                  }
                                }}
                                title="Advance Stage"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}

                            {canWrite && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(opp)}
                                  title="Edit Opportunity"
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(opp.id)}
                                  title="Delete Opportunity"
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-gray-500 text-xs">
              Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} deals
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 font-medium">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingOpp ? 'Edit Opportunity' : 'New Opportunity'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. FY26 Enterprise Security Suite"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Organization *</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={e => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Deal Value (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.deal_value}
                    onChange={e => setFormData({ ...formData, deal_value: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stage *</label>
                  <select
                    value={formData.stage}
                    onChange={e => {
                      const st = e.target.value;
                      const suggestedProb = DEFAULT_PROBABILITIES[st] !== undefined ? DEFAULT_PROBABILITIES[st] : formData.probability;
                      setFormData({ ...formData, stage: st, probability: suggestedProb });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Win Probability (%)</label>
                    <span className="text-xs font-bold text-slate-800">{formData.probability}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={formData.probability}
                    onChange={e => setFormData({ ...formData, probability: Number(e.target.value) })}
                    className="w-full mt-2 accent-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={formData.expected_close_date}
                    onChange={e => setFormData({ ...formData, expected_close_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Competitor (Optional)</label>
                  <select
                    value={formData.competitor_id || ''}
                    onChange={e => setFormData({ ...formData, competitor_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="">-- None / No Competitor --</option>
                    {competitors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opportunity Notes & Strategy</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Strategic notes, pricing discussion, key stakeholders, client requirements..."
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
                  {editingOpp ? 'Update Opportunity' : 'Save Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Opportunity Details Modal */}
      {viewingOpp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Opportunity Details</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{viewingOpp.name}</h3>
              </div>
              <button onClick={() => setViewingOpp(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Customer Account:</span>
                  <span className="font-bold text-gray-900">
                    {viewingOpp.customer_name || customers.find(c => c.id === viewingOpp.customer_id)?.name || `Customer #${viewingOpp.customer_id}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Deal Value:</span>
                  <span className="font-bold text-gray-900 text-sm">{formatCurrency(viewingOpp.deal_value)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Stage:</span>
                  <StatusBadge status={viewingOpp.stage} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Win Probability:</span>
                  <span className="font-semibold text-gray-800">{viewingOpp.probability}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Target Close:</span>
                  <span className="font-semibold text-gray-800">
                    {viewingOpp.expected_close_date ? formatDate(viewingOpp.expected_close_date) : 'Not specified'}
                  </span>
                </div>
                {viewingOpp.competitor_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Competitor:</span>
                    <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {viewingOpp.competitor_name || competitors.find(c => c.id === viewingOpp.competitor_id)?.name || 'Competitor'}
                    </span>
                  </div>
                )}
              </div>

              {viewingOpp.notes && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-1">Opportunity Notes:</span>
                  <p className="p-2.5 bg-gray-50 rounded border text-gray-700">
                    {viewingOpp.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t mt-3">
              {canWrite && (
                <button
                  onClick={() => {
                    const oppToEdit = viewingOpp;
                    setViewingOpp(null);
                    handleOpenEdit(oppToEdit);
                  }}
                  className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Deal
                </button>
              )}
              <button
                onClick={() => setViewingOpp(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
