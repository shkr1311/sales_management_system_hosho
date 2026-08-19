import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/common';
import { formatDate, getInitials } from '@/lib/utils';
import api from '@/services/api';
import type { CustomerContact, Customer } from '@/types';
import {
  Users, UserPlus, Search, Filter, Mail, Phone, Building2,
  Star, Pencil, Trash2, X, Eye, Briefcase, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function ContactsPage() {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customer_id');

  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<number | ''>(
    initialCustomerId ? Number(initialCustomerId) : ''
  );

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null);
  const [viewingContact, setViewingContact] = useState<CustomerContact | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customer_id: 0,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    is_primary: false,
  });

  const fetchData = () => {
    setLoading(true);
    const params: any = { page, page_size: 15 };
    if (search) params.search = search;
    if (customerFilter) params.customer_id = customerFilter;

    Promise.all([
      api.get('/contacts', { params }),
      api.get('/customers', { params: { page_size: 100 } }),
    ])
      .then(([contRes, custRes]) => {
        setContacts(contRes.data.items || contRes.data || []);
        setTotal(contRes.data.total || 0);
        setTotalPages(contRes.data.total_pages || 1);
        setCustomers(custRes.data.items || custRes.data || []);
      })
      .catch(err => {
        const detail = err.response?.data?.detail;
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join(', ')
            : 'Failed to load customer contacts';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetchData();
  }, [page, search, customerFilter]);

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData({
      customer_id: (customerFilter ? Number(customerFilter) : customers[0]?.id) || 0,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      designation: '',
      department: 'Management',
      is_primary: false,
    });
    setShowForm(true);
  };

  const handleOpenEdit = (contact: CustomerContact) => {
    setEditingContact(contact);
    setFormData({
      customer_id: contact.customer_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      designation: contact.designation || '',
      department: contact.department || '',
      is_primary: contact.is_primary,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, formData);
      } else {
        await api.post('/contacts', formData);
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save contact');
    }
  };

  const handleDelete = async (contact: CustomerContact) => {
    if (!confirm(`Are you sure you want to delete ${contact.first_name} ${contact.last_name}?`)) return;
    try {
      await api.delete(`/contacts/${contact.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete contact');
    }
  };

  const canWrite = hasRole('SALES_REP', 'SALES_MANAGER', 'ACCOUNT_MANAGER');

  return (
    <div>
      <PageHeader
        title="Customer Contacts Directory"
        description={`${total} client contact${total !== 1 ? 's' : ''} across enterprise accounts`}
        action={
          canWrite && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <UserPlus className="w-4 h-4" /> Add Contact
            </button>
          )
        }
      />

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contact name, designation, email, or company..."
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
          value={customerFilter}
          onChange={e => { setCustomerFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none max-w-xs"
        >
          <option value="">All Customer Accounts</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading client contacts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description="Create client contacts to maintain an organized database of stakeholder interactions."
          icon={Users}
          action={
            canWrite && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Add First Contact
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
                  <th className="py-3 px-4">Contact Name</th>
                  <th className="py-3 px-4">Linked Customer</th>
                  <th className="py-3 px-4">Designation & Department</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {contacts.map(contact => {
                  const cust = customers.find(c => c.id === contact.customer_id);
                  const custName = contact.customer_name || cust?.name || `Customer #${contact.customer_id}`;

                  return (
                    <tr key={contact.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                            {getInitials(`${contact.first_name || ''} ${contact.last_name || ''}`)}
                          </div>
                          <div>
                            <div>{contact.first_name} {contact.last_name}</div>

                            {contact.is_primary && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-bold">
                                Key Decision Maker
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">{custName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800">{contact.designation || 'Stakeholder'}</div>
                        <div className="text-xs text-gray-400">{contact.department || 'General'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Mail className="w-3.5 h-3.5" /> {contact.email}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
                          >
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> {contact.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {contact.is_primary ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" /> Primary
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Secondary</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingContact(contact)}
                            title="View Contact Details"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canWrite && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(contact)}
                                title="Edit Contact"
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(contact)}
                                title="Delete Contact"
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
          <p className="text-gray-500">
            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
      )}

      {/* Create / Edit Contact Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingContact ? 'Edit Contact' : 'Add New Customer Contact'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Linked Customer Organization *</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Rahul"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Verma"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Chief Technology Officer"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Information Technology"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul.verma@client.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-9876543210"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary}
                  onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_primary" className="text-xs text-gray-700 font-medium">
                  Mark as Primary Point of Contact for this Customer
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
                  {editingContact ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Contact Detail Modal */}
      {viewingContact && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-base text-slate-800">
                  {getInitials(`${viewingContact.first_name || ''} ${viewingContact.last_name || ''}`)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {viewingContact.first_name} {viewingContact.last_name}
                  </h3>
                  <div className="text-xs text-gray-500">
                    {viewingContact.designation || 'Stakeholder'}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingContact(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Customer Account:</span>
                  <span className="font-bold text-gray-900">
                    {viewingContact.customer_name || customers.find(c => c.id === viewingContact.customer_id)?.name || 'Linked Account'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Department:</span>
                  <span className="font-semibold text-gray-700">{viewingContact.department || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Contact Role:</span>
                  <span className="font-semibold text-gray-700">
                    {viewingContact.is_primary ? 'Primary Decision Maker' : 'Secondary Contact'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{viewingContact.email || 'No email on file'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{viewingContact.phone || 'No phone on file'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              {viewingContact.email && (
                <a
                  href={`mailto:${viewingContact.email}`}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                >
                  Send Email
                </a>
              )}
              {viewingContact.phone && (
                <a
                  href={`tel:${viewingContact.phone}`}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
                >
                  Call Contact
                </a>
              )}
              <button
                onClick={() => setViewingContact(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
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
