import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Lead, User } from '@/types';
import { UserCheck, UserPlus, CheckCircle2, ArrowRight, Building2, Mail, Phone } from 'lucide-react';

export default function QualifiedLeadsPage() {
  const { hasRole } = useAuth();
  const canAssign = hasRole('MARKETING', 'SALES_MANAGER');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assignment Modal
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<number | ''>('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/leads', { params: { status: 'QUALIFIED' } }),
      api.get('/users'),
    ])
      .then(([leadRes, userRes]) => {
        setLeads(leadRes.data.items || leadRes.data || []);
        setUsers(userRes.data.items || userRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load marketing qualified leads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!assigningLead || !selectedRepId) return;
    try {
      await api.post(`/leads/${assigningLead.id}/assign`, { assigned_to: Number(selectedRepId) });
      setAssigningLead(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to hand off lead to sales rep');
    }
  };

  const salesReps = users.filter(u => u.role?.name === 'SALES_REP' || u.role?.name === 'SALES_MANAGER');

  return (
    <div>
      <PageHeader
        title="Marketing Qualified Leads (MQL) Handoff"
        description="Share high-intent qualified leads with the sales team for prompt pipeline conversion"
      />

      {loading ? (
        <LoadingState message="Loading qualified marketing leads..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No pending MQLs"
          description="All marketing qualified leads have been successfully assigned to sales representatives."
          icon={UserCheck}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map(lead => {
            const assignedRep = users.find(u => u.id === lead.assigned_to);

            return (
              <div
                key={lead.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      MQL Ready
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm mb-1">{lead.title}</h3>
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-3">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>{lead.company_name || 'Direct Business'}</span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 text-gray-600 mb-4">
                    <div className="font-semibold text-gray-900">{lead.contact_name || 'Primary Contact'}</div>
                    {lead.contact_email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{lead.contact_email}</span>
                      </div>
                    )}
                    {lead.contact_phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{lead.contact_phone}</span>
                      </div>
                    )}
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-gray-500 line-clamp-2 italic mb-3">
                      "{lead.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {assignedRep ? `Assigned to: ${assignedRep.full_name}` : 'Unassigned'}
                  </span>
                  {canAssign && (
                    <button
                      onClick={() => { setAssigningLead(lead); setSelectedRepId(lead.assigned_to || ''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Assign to Rep
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      {assigningLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Handoff Lead to Sales</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a sales representative to take immediate ownership of <strong className="text-gray-900">{assigningLead.title}</strong>:
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sales Representative</label>
              <select
                value={selectedRepId}
                onChange={e => setSelectedRepId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
              >
                <option value="">-- Select Sales Rep --</option>
                {salesReps.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} ({r.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAssigningLead(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedRepId}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Handoff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
