import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Lead, User } from '@/types';
import { Plus, Search, X, UserPlus, UserCheck, ArrowRightCircle, Trash2, Pencil } from 'lucide-react';

export default function LeadsPage() {
  const { hasRole } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [assignModalLead, setAssignModalLead] = useState<Lead | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<number | ''>('');
  const [convertModalLead, setConvertModalLead] = useState<Lead | null>(null);
  const [dealValue, setDealValue] = useState<number>(500000);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    source: 'WEBSITE',
    priority: 'MEDIUM',
    estimated_value: 0,
    notes: '',
  });

  const fetchUsers = () => {
    api.get('/users').then(res => setUsers(res.data.items || res.data)).catch(() => {});
  };

  const fetchLeads = () => {
    setLoading(true);
    const params: any = { page, page_size: 15 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;

    api.get('/leads', { params })
      .then(res => {
        setLeads(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch(err => {
        const detail = err.response?.data?.detail;
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join(', ')
            : 'Failed to load leads';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, search, statusFilter, priorityFilter]);

  const handleOpenCreate = () => {
    setEditingLead(null);
    setFormData({
      title: '',
      company_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      source: 'WEBSITE',
      priority: 'MEDIUM',
      estimated_value: 100000,
      notes: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      title: lead.title,
      company_name: lead.company_name || '',
      contact_name: lead.contact_name || '',
      contact_email: lead.contact_email || '',
      contact_phone: lead.contact_phone || '',
      source: lead.source || 'WEBSITE',
      priority: lead.priority || 'MEDIUM',
      estimated_value: lead.estimated_value || 0,
      notes: lead.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, formData);
      } else {
        await api.post('/leads', formData);
      }
      setShowForm(false);
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving lead');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete lead');
    }
  };

  const handleAssign = async () => {
    if (!assignModalLead || !selectedRepId) return;
    try {
      await api.post(`/leads/${assignModalLead.id}/assign`, { assigned_to: Number(selectedRepId) });
      setAssignModalLead(null);
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign lead');
    }
  };

  const handleConvert = async () => {
    if (!convertModalLead) return;
    try {
      await api.post(`/leads/${convertModalLead.id}/convert`, { deal_value: dealValue });
      setConvertModalLead(null);
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to convert lead');
    }
  };

  const canManage = hasRole('SALES_REP', 'SALES_MANAGER', 'MARKETING');

  return (
    <div>
      <PageHeader
        title="Leads Management"
        description={`${total} total leads in qualification pipeline`}
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search company, title, or contact..."
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
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="UNQUALIFIED">Unqualified</option>
          <option value="CONVERTED">Converted</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading leads..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLeads} />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Create a new lead or adjust your search filter criteria."
          icon={UserPlus}
          action={
            canManage && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
              >
                Add Lead
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
                  <th className="py-3 px-4">Lead Title / Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {leads.map(lead => {
                  const assignedUser = users.find(u => u.id === lead.assigned_to);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{lead.title}</div>
                        <div className="text-xs text-gray-500">{lead.company_name || 'Individual'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800">{lead.contact_name || '—'}</div>
                        <div className="text-xs text-gray-500">{lead.contact_email || lead.contact_phone || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {lead.source || 'Direct'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          lead.priority === 'HIGH' ? 'bg-red-50 text-red-700' :
                          lead.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {assignedUser ? assignedUser.full_name : <span className="text-gray-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.status !== 'CONVERTED' && hasRole('SALES_REP', 'SALES_MANAGER', 'MARKETING') && (
                            <button
                              onClick={() => { setConvertModalLead(lead); setDealValue(lead.estimated_value || 500000); }}
                              title="Convert to Opportunity"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <ArrowRightCircle className="w-4 h-4" />
                            </button>
                          )}
                          {hasRole('SALES_MANAGER', 'MARKETING') && (
                            <button
                              onClick={() => { setAssignModalLead(lead); setSelectedRepId(lead.assigned_to || ''); }}
                              title="Assign to Sales Rep"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          {hasRole('SALES_REP', 'SALES_MANAGER', 'MARKETING') && (
                            <button
                              onClick={() => handleOpenEdit(lead)}
                              title="Edit Lead"
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasRole('SALES_MANAGER', 'MARKETING') && (
                            <button
                              onClick={() => handleDelete(lead.id)}
                              title="Delete Lead"
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editingLead ? 'Edit Lead' : 'Create New Lead'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Title / Requirement *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Enterprise Cloud ERP Migration"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="e.g. Rahul Verma"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="rahul@acme.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+91-9876543210"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="CAMPAIGN">Campaign</option>
                    <option value="COLD_OUTREACH">Cold Outreach</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Est. Value (₹)</label>
                  <input
                    type="number"
                    value={formData.estimated_value}
                    onChange={e => setFormData({ ...formData, estimated_value: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Requirement Details</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key customer pain points and timeline..."
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
                  {editingLead ? 'Update Lead' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModalLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Assign Lead</h3>
            <p className="text-sm text-gray-600 mb-4">
              Assign <strong className="text-gray-900">{assignModalLead.title}</strong> to a sales representative:
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Sales Representative</label>
              <select
                value={selectedRepId}
                onChange={e => setSelectedRepId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
              >
                <option value="">-- Choose Sales Rep --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role?.name || 'User'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAssignModalLead(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedRepId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Opportunity Modal */}
      {convertModalLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Convert to Opportunity</h3>
            <p className="text-sm text-gray-600 mb-4">
              Converting <strong className="text-gray-900">{convertModalLead.title}</strong> will move it into your active sales pipeline.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Deal Value (₹)</label>
              <input
                type="number"
                value={dealValue}
                onChange={e => setDealValue(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConvertModalLead(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Convert to Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
