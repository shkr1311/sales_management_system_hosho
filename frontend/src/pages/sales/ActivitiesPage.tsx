import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Activity, Customer, CustomerContact, Opportunity } from '@/types';
import {
  Plus, Search, Calendar, Phone, Mail, Users, CheckCircle2,
  Trash2, X, Clock, Pencil, Eye, Building2, UserCheck, ArrowRight,
  Filter, AlertCircle, Sparkles, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';

const ACTIVITY_TYPES = [
  { value: 'CALL', label: 'Call', icon: Phone, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'MEETING', label: 'Meeting', icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { value: 'DEMO', label: 'Demo', icon: Sparkles, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'FOLLOW_UP', label: 'Follow-up', icon: Clock, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
];

export default function ActivitiesPage() {
  const { hasRole, user } = useAuth();
  const canWrite = hasRole('SALES_REP', 'SALES_MANAGER', 'ACCOUNT_MANAGER');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'ALL' | 'PLANNED' | 'COMPLETED' | 'FOLLOW_UP'>('ALL');
  const [typeFilter, setTypeFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  const [completeModalAct, setCompleteModalAct] = useState<Activity | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    activity_type: 'CALL',
    status: 'PLANNED',
    customer_id: 0,
    contact_id: undefined as number | undefined,
    opportunity_id: undefined as number | undefined,
    scheduled_date: new Date().toISOString().slice(0, 16),
    follow_up_date: '',
    duration_minutes: 30,
    location: '',
    notes: '',
    outcome: '',
  });

  // Completion modal state
  const [completeData, setCompleteData] = useState({
    outcome: '',
    follow_up_date: '',
  });

  const fetchData = () => {
    setLoading(true);
    const params: any = { page, page_size: 15 };
    if (typeFilter) params.activity_type = typeFilter;
    if (customerFilter) params.customer_id = customerFilter;
    if (search) params.search = search;

    if (activeTab === 'PLANNED') {
      params.status = 'PLANNED';
    } else if (activeTab === 'COMPLETED') {
      params.status = 'COMPLETED';
    }

    Promise.all([
      api.get('/activities', { params }),
      api.get('/customers', { params: { page_size: 100 } }),
      api.get('/contacts', { params: { page_size: 100 } }),
      api.get('/opportunities', { params: { page_size: 100 } }),
    ])
      .then(([actRes, custRes, contRes, oppRes]) => {
        let items: Activity[] = actRes.data.items || actRes.data || [];
        if (activeTab === 'FOLLOW_UP') {
          items = items.filter(a => !!a.follow_up_date);
        }
        setActivities(items);
        setTotal(actRes.data.total || items.length);
        setTotalPages(actRes.data.total_pages || 1);
        setCustomers(custRes.data.items || custRes.data || []);
        setContacts(contRes.data.items || contRes.data || []);
        setOpportunities(oppRes.data.items || oppRes.data || []);
      })
      .catch(err => {
        const detail = err.response?.data?.detail;
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join(', ')
            : 'Failed to load activities';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetchData();
  }, [page, typeFilter, customerFilter, activeTab, search]);

  const handleOpenCreate = () => {
    setEditingActivity(null);
    const firstCustId = customers[0]?.id || 0;
    const firstCustContacts = contacts.filter(c => c.customer_id === firstCustId);

    setFormData({
      title: '',
      activity_type: 'CALL',
      status: 'PLANNED',
      customer_id: firstCustId,
      contact_id: firstCustContacts[0]?.id || undefined,
      opportunity_id: undefined,
      scheduled_date: new Date().toISOString().slice(0, 16),
      follow_up_date: '',
      duration_minutes: 30,
      location: '',
      notes: '',
      outcome: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setFormData({
      title: act.title,
      activity_type: act.activity_type || act.type || 'CALL',
      status: act.status || 'PLANNED',
      customer_id: act.customer_id || 0,
      contact_id: act.contact_id || undefined,
      opportunity_id: act.opportunity_id || undefined,
      scheduled_date: act.scheduled_date ? act.scheduled_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
      follow_up_date: act.follow_up_date ? act.follow_up_date.slice(0, 16) : '',
      duration_minutes: act.duration_minutes || 30,
      location: act.location || '',
      notes: act.notes || act.description || '',
      outcome: act.outcome || '',
    });
    setShowForm(true);
  };

  const handleCustomerChange = (custId: number) => {
    const custContacts = contacts.filter(c => c.customer_id === custId);
    setFormData(prev => ({
      ...prev,
      customer_id: custId,
      contact_id: custContacts[0]?.id || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: formData.title,
        activity_type: formData.activity_type,
        status: formData.status,
        customer_id: formData.customer_id ? Number(formData.customer_id) : null,
        contact_id: formData.contact_id ? Number(formData.contact_id) : null,
        opportunity_id: formData.opportunity_id ? Number(formData.opportunity_id) : null,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        duration_minutes: Number(formData.duration_minutes) || null,
        location: formData.location || null,
        notes: formData.notes || null,
        outcome: formData.outcome || null,
        follow_up_date: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null,
      };

      if (editingActivity) {
        await api.put(`/activities/${editingActivity.id}`, payload);
      } else {
        await api.post('/activities', payload);
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save activity');
    }
  };

  const handleOpenComplete = (act: Activity) => {
    setCompleteModalAct(act);
    setCompleteData({
      outcome: act.outcome || 'Call/Meeting completed. Customer interested in next steps.',
      follow_up_date: act.follow_up_date ? act.follow_up_date.slice(0, 16) : '',
    });
  };

  const handleSaveComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalAct) return;
    try {
      await api.put(`/activities/${completeModalAct.id}/complete`, {
        outcome: completeData.outcome,
        follow_up_date: completeData.follow_up_date ? new Date(completeData.follow_up_date).toISOString() : null,
      });
      setCompleteModalAct(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete activity');
    }
  };

  const handleDelete = async (act: Activity) => {
    if (!confirm(`Are you sure you want to delete "${act.title}"?`)) return;
    try {
      await api.delete(`/activities/${act.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete activity');
    }
  };

  // Contacts available for current selected customer in form
  const currentCustomerContacts = contacts.filter(c => c.customer_id === formData.customer_id);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales Activities & Touchpoints"
        description="Log and manage customer meetings, calls, product demos, emails, and scheduled follow-ups"
        action={
          canWrite && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Log Activity
            </button>
          )
        }
      />

      {/* Tabs & Quick Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          {(['ALL', 'PLANNED', 'COMPLETED', 'FOLLOW_UP'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'ALL' && 'All Activities'}
              {tab === 'PLANNED' && 'Upcoming & Planned'}
              {tab === 'COMPLETED' && 'Completed History'}
              {tab === 'FOLLOW_UP' && 'Follow-ups Scheduled'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes, title, outcome..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent text-xs outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none"
          >
            <option value="">All Types</option>
            {ACTIVITY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={customerFilter}
            onChange={e => { setCustomerFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none max-w-xs"
          >
            <option value="">All Customer Accounts</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading activities log..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : activities.length === 0 ? (
        <EmptyState
          title="No activities recorded"
          description="Log sales calls, meetings, client product demos, and follow-ups to maintain an accurate activity trail."
          icon={Calendar}
          action={
            canWrite && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Log First Activity
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {activities.map(act => {
              const cust = customers.find(c => c.id === act.customer_id);
              const cont = contacts.find(c => c.id === act.contact_id);
              const opp = opportunities.find(o => o.id === act.opportunity_id);
              const typeConfig = ACTIVITY_TYPES.find(t => t.value === (act.activity_type || act.type)) || ACTIVITY_TYPES[0];
              const TypeIcon = typeConfig.icon;
              const isCompleted = act.status === 'COMPLETED';

              return (
                <div
                  key={act.id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-xl border flex-shrink-0 ${typeConfig.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{act.title}</h3>
                        <StatusBadge status={act.status} />
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        {act.duration_minutes && (
                          <span className="text-xs text-gray-400 font-medium">
                            • {act.duration_minutes} mins
                          </span>
                        )}
                      </div>

                      {/* Customer & Contact link row */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-800">
                            {act.customer_name || cust?.name || (act.customer_id ? `Customer #${act.customer_id}` : 'General Activity')}
                          </span>
                        </div>

                        {(act.contact_name || cont) && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700">
                              Contact: <strong>{act.contact_name || (cont ? `${cont.first_name || ''} ${cont.last_name || ''}`.trim() : '')}</strong>
                              {cont?.designation ? ` (${cont.designation})` : ''}
                            </span>
                          </div>
                        )}


                        {opp && (
                          <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded">
                            <span>Deal: <strong>{opp.name}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Scheduled / Completed date */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 pt-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>Scheduled: <strong>{formatDate(act.scheduled_date || act.scheduled_at || act.created_at || '')}</strong></span>
                        </div>
                        {isCompleted && act.completed_date && (
                          <span className="text-emerald-600 font-medium">
                            • Completed on {formatDate(act.completed_date)}
                          </span>
                        )}
                      </div>

                      {/* Notes / Description */}
                      {(act.notes || act.description) && (
                        <p className="text-xs text-gray-700 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 mt-2">
                          {act.notes || act.description}
                        </p>
                      )}

                      {/* Outcome & Follow-up row */}
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                        {act.outcome && (
                          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span><strong>Outcome:</strong> {act.outcome}</span>
                          </div>
                        )}

                        {act.follow_up_date && (
                          <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span><strong>Follow-up scheduled:</strong> {formatDate(act.follow_up_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end md:self-start flex-shrink-0 pt-1">
                    <button
                      onClick={() => setViewingActivity(act)}
                      title="View Details"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {!isCompleted && canWrite && (
                      <button
                        onClick={() => handleOpenComplete(act)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition border border-emerald-200"
                        title="Mark as Completed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                      </button>
                    )}

                    {canWrite && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(act)}
                          title="Edit Activity"
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(act)}
                          title="Delete Activity"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-gray-500 text-xs">
              Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} activities
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

      {/* Log / Edit Activity Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingActivity ? 'Edit Sales Activity' : 'Log New Sales Activity'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Activity Subject / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Discovery Call with CTO / Product Demo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Activity Type *</label>
                  <select
                    required
                    value={formData.activity_type}
                    onChange={e => setFormData({ ...formData, activity_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="PLANNED">Planned / Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_date}
                    onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    placeholder="30"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer / Organization *</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={e => handleCustomerChange(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Key Stakeholder / Contact</label>
                  <select
                    value={formData.contact_id || ''}
                    onChange={e => setFormData({ ...formData, contact_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  >
                    <option value="">-- Select Contact (Optional) --</option>
                    {currentCustomerContacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} {c.designation ? `(${c.designation})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Associated Opportunity Deal (Optional)</label>
                <select
                  value={formData.opportunity_id || ''}
                  onChange={e => setFormData({ ...formData, opportunity_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                >
                  <option value="">-- None / General Touchpoint --</option>
                  {opportunities.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Discussion Agenda</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key topics to discuss, client pain points, demonstration outline..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting / Call Outcome</label>
                  <input
                    type="text"
                    value={formData.outcome}
                    onChange={e => setFormData({ ...formData, outcome: e.target.value })}
                    placeholder="e.g. Requested customized pricing quote"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Date</label>
                  <input
                    type="datetime-local"
                    value={formData.follow_up_date}
                    onChange={e => setFormData({ ...formData, follow_up_date: e.target.value })}
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
                  {editingActivity ? 'Update Activity' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Mark-Complete Modal */}
      {completeModalAct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Complete Activity: {completeModalAct.title}
              </h3>
              <button onClick={() => setCompleteModalAct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Outcome & Key Takeaways *</label>
                <textarea
                  required
                  rows={3}
                  value={completeData.outcome}
                  onChange={e => setCompleteData({ ...completeData, outcome: e.target.value })}
                  placeholder="Summarize the outcome, client response, and next commitments..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Schedule Follow-up Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={completeData.follow_up_date}
                  onChange={e => setCompleteData({ ...completeData, follow_up_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCompleteModalAct(null)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                >
                  Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Activity Detail Modal */}
      {viewingActivity && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {viewingActivity.activity_type || viewingActivity.type} Details
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{viewingActivity.title}</h3>
              </div>
              <button onClick={() => setViewingActivity(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  <StatusBadge status={viewingActivity.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Customer Account:</span>
                  <span className="font-bold text-gray-900">
                    {viewingActivity.customer_name || customers.find(c => c.id === viewingActivity.customer_id)?.name || 'General'}
                  </span>
                </div>
                {viewingActivity.contact_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Contact:</span>
                    <span className="font-semibold text-gray-800">{viewingActivity.contact_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Scheduled Date:</span>
                  <span className="font-semibold text-gray-800">
                    {formatDate(viewingActivity.scheduled_date || viewingActivity.scheduled_at || '')}
                  </span>
                </div>
              </div>

              {(viewingActivity.notes || viewingActivity.description) && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-1">Notes & Discussion:</span>
                  <p className="p-2.5 bg-gray-50 rounded border text-gray-700">
                    {viewingActivity.notes || viewingActivity.description}
                  </p>
                </div>
              )}

              {viewingActivity.outcome && (
                <div>
                  <span className="font-semibold text-emerald-700 block mb-1">Recorded Outcome:</span>
                  <p className="p-2.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-100">
                    {viewingActivity.outcome}
                  </p>
                </div>
              )}

              {viewingActivity.follow_up_date && (
                <div className="p-2.5 bg-amber-50 rounded border border-amber-100 text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Follow-up Date: <strong>{formatDate(viewingActivity.follow_up_date)}</strong></span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t mt-3">
              <button
                onClick={() => setViewingActivity(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
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
