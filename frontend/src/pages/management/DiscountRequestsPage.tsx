import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { DiscountRequest, Opportunity, User } from '@/types';
import { BadgePercent, CheckCircle2, XCircle, Plus, X } from 'lucide-react';

export default function DiscountRequestsPage() {
  const { hasRole, user } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountRequest[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showRequest, setShowRequest] = useState(false);
  const [reviewModalDisc, setReviewModalDisc] = useState<DiscountRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewerNotes, setReviewerNotes] = useState('');

  const [formData, setFormData] = useState({
    opportunity_id: 0,
    discount_percent: 15,
    original_price: 1000000,
    discounted_price: 850000,
    reason: '',
  });

  const fetchData = () => {
    setLoading(true);
    const params: any = {};
    if (statusFilter) params.status = statusFilter;

    Promise.all([
      api.get('/discounts', { params }),
      api.get('/opportunities', { params: { page_size: 100 } }),
      api.get('/users').catch(() => ({ data: [] })),
    ])
      .then(([discRes, oppRes, userRes]) => {
        setDiscounts(discRes.data.items || discRes.data || []);
        setOpportunities(oppRes.data.items || oppRes.data || []);
        setUsers(userRes.data.items || userRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load discount requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenRequest = () => {
    const opp = opportunities[0];
    const orig = opp?.deal_value || 1000000;
    const pct = 15;
    setFormData({
      opportunity_id: opp?.id || 0,
      discount_percent: pct,
      original_price: orig,
      discounted_price: orig * (1 - pct / 100),
      reason: '',
    });
    setShowRequest(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/discounts', formData);
      setShowRequest(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit discount request');
    }
  };

  const handleReview = async () => {
    if (!reviewModalDisc) return;
    try {
      await api.put(`/discounts/${reviewModalDisc.id}/review`, {
        status: reviewAction,
        reviewer_notes: reviewerNotes || (reviewAction === 'APPROVED' ? 'Approved by manager' : 'Margin too low'),
      });
      setReviewModalDisc(null);
      setReviewerNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to review request');
    }
  };

  const canApprove = hasRole('SALES_MANAGER', 'EXECUTIVE');

  return (
    <div>
      <PageHeader
        title="Discount Approval Workflow"
        description="Review, evaluate margin impact, and approve deal discount requests"
        action={
          <button
            onClick={handleOpenRequest}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
          >
            <Plus className="w-4 h-4" /> Request Discount
          </button>
        }
      />

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Review Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading discount requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : discounts.length === 0 ? (
        <EmptyState
          title="No discount requests"
          description="All clear! No pending or historical discount requests found."
          icon={BadgePercent}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Original Price</th>
                  <th className="py-3 px-4">Discount %</th>
                  <th className="py-3 px-4">Discounted Price</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {discounts.map(disc => {
                  const opp = opportunities.find(o => o.id === disc.opportunity_id);
                  const requester = users.find(u => u.id === disc.requested_by);
                  return (
                    <tr key={disc.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {opp?.name || `Opportunity #${disc.opportunity_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {requester?.full_name || `User #${disc.requested_by}`}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 line-through">
                        {formatCurrency(disc.original_price || disc.original_value || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700">
                          {disc.discount_percent || disc.requested_discount || 0}% OFF
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {formatCurrency(disc.discounted_price || disc.discounted_value || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs truncate" title={disc.reason || ''}>
                        {disc.reason || 'Competitive pressure'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={disc.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {disc.status === 'PENDING' && canApprove ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setReviewModalDisc(disc); setReviewAction('APPROVED'); }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => { setReviewModalDisc(disc); setReviewAction('REJECTED'); }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {disc.status === 'APPROVED' ? 'Approved' : disc.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                          </span>
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

      {/* Request Modal */}
      {showRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Request Deal Discount</h2>
              <button onClick={() => setShowRequest(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opportunity *</label>
                <select
                  value={formData.opportunity_id}
                  onChange={e => {
                    const oppId = Number(e.target.value);
                    const opp = opportunities.find(o => o.id === oppId);
                    const orig = opp?.deal_value || 1000000;
                    setFormData({
                      ...formData,
                      opportunity_id: oppId,
                      original_price: orig,
                      discounted_price: orig * (1 - formData.discount_percent / 100),
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                >
                  {opportunities.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({formatCurrency(o.deal_value)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discount % *</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={formData.discount_percent}
                    onChange={e => {
                      const pct = Number(e.target.value);
                      setFormData({
                        ...formData,
                        discount_percent: pct,
                        discounted_price: formData.original_price * (1 - pct / 100),
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Final Price (₹)</label>
                  <input
                    type="number"
                    readOnly
                    value={Math.round(formData.discounted_price)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Justification / Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why this discount is required (e.g. competitor matching, multi-year commitment)..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRequest(false)}
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

      {/* Review Modal */}
      {reviewModalDisc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {reviewAction === 'APPROVED' ? 'Approve Discount' : 'Reject Discount'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Discount of <strong className="text-gray-900">{reviewModalDisc.discount_percent || reviewModalDisc.requested_discount || 0}%</strong> requested. Original: {formatCurrency(reviewModalDisc.original_price || reviewModalDisc.original_value || 0)} → New: {formatCurrency(reviewModalDisc.discounted_price || reviewModalDisc.discounted_value || 0)}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reviewer Feedback Notes</label>
              <textarea
                rows={3}
                value={reviewerNotes}
                onChange={e => setReviewerNotes(e.target.value)}
                placeholder="Add comments or conditional approval guidelines..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReviewModalDisc(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${
                  reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {reviewAction === 'APPROVED' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
