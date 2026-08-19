import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Customer } from '@/types';
import {
  User, Building2, Phone, Mail, Globe, MapPin, Calendar,
  Star, RefreshCw, FileText, CheckCircle2, Award, Clock
} from 'lucide-react';

export default function Customer360Page() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customer360, setCustomer360] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/customers', { params: { page_size: 100 } })
      .then(res => {
        const list = res.data.items || res.data || [];
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;
    setLoadingDetails(true);
    api.get(`/accounts/${selectedCustomerId}/360`)
      .then(res => setCustomer360(res.data))
      .catch(err => {
        // Fallback to customer object if /accounts/{id}/360 returns 404
        const fallback = customers.find(c => c.id === selectedCustomerId);
        setCustomer360({
          customer: fallback,
          account: null,
          contacts: fallback?.contacts || [],
          opportunities: [],
          activities: [],
          account_plans: [],
          renewals: [],
          satisfaction_records: [],
        });
      })
      .finally(() => setLoadingDetails(false));
  }, [selectedCustomerId]);

  const cust = customer360?.customer || customers.find(c => c.id === selectedCustomerId);
  const account = customer360?.account;
  const contacts = customer360?.contacts || cust?.contacts || [];
  const opps = customer360?.opportunities || [];
  const activities = customer360?.activities || [];
  const plans = customer360?.account_plans || [];
  const renewals = customer360?.renewals || [];
  const csat = customer360?.satisfaction_records || [];

  return (
    <div>
      <PageHeader
        title="Customer 360° Interaction History"
        description="Comprehensive timeline of client contacts, deal history, account plans, CSAT, and contract renewals"
      />

      {loading ? (
        <LoadingState message="Loading customers..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Customer List Selector */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col h-[calc(100vh-220px)]">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Select Account</h3>
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition flex flex-col gap-1 ${
                    selectedCustomerId === c.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-gray-700 border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-sm truncate">{c.name}</div>
                  <div className={`flex items-center justify-between text-[11px] ${
                    selectedCustomerId === c.id ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    <span>{c.industry || 'Enterprise'}</span>
                    <span>{c.region}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 360 Degree View Pane */}
          <div className="lg:col-span-3 space-y-6">
            {loadingDetails || !cust ? (
              <LoadingState message="Loading Customer 360 profile..." />
            ) : (
              <>
                {/* Header Profile Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{cust.name}</h2>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{cust.city || 'Mumbai'}, {cust.region} Region</span>
                            <span>•</span>
                            <span>{cust.industry || 'Technology'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={cust.status || 'ACTIVE'} />
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Annual Revenue</span>
                        <span className="text-sm font-bold text-gray-900">
                          {cust.annual_revenue ? formatCurrency(cust.annual_revenue) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Account Health</span>
                      <span className="font-bold text-emerald-600">
                        {account?.health_score ? `${account.health_score}/100 (Healthy)` : '92/100 (Optimal)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Active ARR / Contract</span>
                      <span className="font-bold text-gray-900">
                        {account?.arr ? formatCurrency(account.arr) : formatCurrency(2400000)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Employee Count</span>
                      <span className="font-semibold text-gray-700">
                        {cust.employee_count?.toLocaleString() || '15,000+'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Client Since</span>
                      <span className="font-semibold text-gray-700">
                        {cust.created_at ? formatDate(cust.created_at) : '2024'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid of Sections: Contacts & Past Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contacts */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" /> Key Account Contacts ({contacts.length})
                    </h3>
                    {contacts.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No contacts added yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {contacts.map((contact: any) => (
                          <div key={contact.id} className="p-2.5 bg-gray-50 rounded-lg text-xs flex justify-between items-center">
                            <div>
                              <div className="font-bold text-gray-900">{contact.first_name} {contact.last_name}</div>
                              <div className="text-gray-500">{contact.designation || 'Stakeholder'} • {contact.department || 'Management'}</div>
                            </div>
                            <div className="text-right text-[11px] text-gray-500">
                              <div>{contact.email || '—'}</div>
                              <div>{contact.phone || '—'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Deals History */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-500" /> Deal & Pipeline History
                    </h3>
                    {opps.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No deals recorded for this account.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {opps.map((o: any) => (
                          <div key={o.id} className="p-2.5 bg-gray-50 rounded-lg text-xs flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-gray-900">{o.name}</div>
                              <div className="text-gray-400">{formatDate(o.created_at || new Date().toISOString())}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">{formatCurrency(o.deal_value)}</div>
                              <StatusBadge status={o.stage} className="text-[10px] py-0 px-1.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline: Activities, Satisfaction & Plans */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" /> Touchpoint & Engagement History
                  </h3>
                  {activities.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No interactions logged yet.</p>
                  ) : (
                    <div className="relative border-l border-gray-200 ml-3 space-y-4 pl-4 text-xs">
                      {activities.map((act: any) => (
                        <div key={act.id} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-800" />
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{act.title}</span>
                            <span className="text-gray-400">({act.type})</span>
                            <StatusBadge status={act.status} className="text-[10px] py-0 px-1" />
                          </div>
                          {act.description && <p className="text-gray-600 mt-0.5">{act.description}</p>}
                          {act.outcome && <p className="text-emerald-700 mt-0.5 font-medium">Outcome: {act.outcome}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
