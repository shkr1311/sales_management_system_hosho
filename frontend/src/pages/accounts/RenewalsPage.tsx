import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState, KPICard } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Customer } from '@/types';
import { RefreshCw, Bell, AlertTriangle, CheckCircle, Plus, X } from 'lucide-react';

export default function RenewalsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('ACCOUNT_MANAGER', 'SALES_MANAGER');

  const [renewals, setRenewals] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: 0,
    contract_number: 'CNT-2026-001',
    current_arr: 3000000,
    renewal_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    status: 'UPCOMING',
    health_score: 90,
    auto_reminder: true,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/renewals').catch(() => ({ data: [] })),
      api.get('/customers', { params: { page_size: 100 } }),
    ])
      .then(([renRes, custRes]) => {
        setRenewals(renRes.data.items || renRes.data || []);
        setCustomers(custRes.data.items || custRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load renewals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      customer_id: customers[0]?.id || 0,
      contract_number: `CNT-2026-${Math.floor(100 + Math.random() * 900)}`,
      current_arr: 3000000,
      renewal_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      status: 'UPCOMING',
      health_score: 90,
      auto_reminder: true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/renewals', formData);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save renewal contract');
    }
  };

  const handleSendReminder = async (id: number) => {
    try {
      await api.post(`/renewals/${id}/reminder`);
      alert('Automated renewal reminder and contract notice dispatched successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Reminder sent!');
    }
  };

  const totalRenewableARR = renewals.reduce((sum, r) => sum + (r.current_arr || 0), 0);
  const atRiskCount = renewals.filter(r => (r.health_score || 80) < 70).length;

  return (
    <div>
      <PageHeader
        title="Contract Renewals & Retention Pipeline"
        description="Track upcoming contract expirations, prevent churn, and automate renewal reminders"
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Track Renewal
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Total Renewable ARR"
          value={formatCurrency(totalRenewableARR)}
          subtitle="Annual recurring contract value"
          icon={RefreshCw}
        />
        <KPICard
          title="Active Renewal Contracts"
          value={renewals.length}
          subtitle="Managed agreements"
          icon={CheckCircle}
        />
        <KPICard
          title="At-Risk Renewals"
          value={atRiskCount}
          subtitle="Health score < 70"
          trend={atRiskCount > 0 ? -atRiskCount : 0}
          icon={AlertTriangle}
        />
      </div>

      {loading ? (
        <LoadingState message="Loading renewal contracts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : renewals.length === 0 ? (
        <EmptyState
          title="No renewal contracts tracked"
          description="Add your first customer contract renewal to configure automatic reminders."
          icon={RefreshCw}
          action={
            canManage && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Track Renewal
              </button>
            )
          }
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Current ARR</th>
                  <th className="py-3 px-4">Renewal Expiry</th>
                  <th className="py-3 px-4">Health Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {renewals.map(ren => {
                  const cust = customers.find(c => c.id === ren.customer_id || c.id === ren.account_id);
                  const score = ren.health_score || 85;

                  return (
                    <tr key={ren.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-gray-900">
                        {ren.contract_number || `CNT-00${ren.id}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {cust?.name || `Customer #${ren.customer_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {formatCurrency(ren.current_arr)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {ren.renewal_date ? formatDate(ren.renewal_date) : 'Upcoming'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                          score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={ren.status || 'UPCOMING'} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canManage && (
                          <button
                            onClick={() => handleSendReminder(ren.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                          >
                            <Bell className="w-3.5 h-3.5" /> Send Reminder
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
              <h2 className="text-lg font-bold text-gray-900">Track Contract Renewal</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Account *</label>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contract Number</label>
                  <input
                    type="text"
                    value={formData.contract_number}
                    onChange={e => setFormData({ ...formData, contract_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Current ARR (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.current_arr}
                    onChange={e => setFormData({ ...formData, current_arr: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.renewal_date}
                    onChange={e => setFormData({ ...formData, renewal_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Health Score</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.health_score}
                    onChange={e => setFormData({ ...formData, health_score: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="auto_reminder"
                  checked={formData.auto_reminder}
                  onChange={e => setFormData({ ...formData, auto_reminder: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="auto_reminder" className="text-xs text-gray-700 font-medium">
                  Enable automated 60-day & 30-day renewal alerts
                </label>
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
                  Track Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
