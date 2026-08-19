import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/common';
import api from '@/services/api';
import type { Territory, User, Customer } from '@/types';
import { Map, Plus, Users, Building2, UserCheck, X } from 'lucide-react';

export default function TerritoriesPage() {
  const { hasRole } = useAuth();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showAssignRep, setShowAssignRep] = useState<Territory | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<number | ''>('');

  const [formData, setFormData] = useState({
    name: '',
    region: 'North',
    description: '',
    manager_id: undefined as number | undefined,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/territories'),
      api.get('/users'),
      api.get('/customers', { params: { page_size: 100 } }),
    ])
      .then(([terrRes, usersRes, custRes]) => {
        setTerritories(terrRes.data.items || terrRes.data || []);
        setUsers(usersRes.data.items || usersRes.data || []);
        setCustomers(custRes.data.items || custRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load territories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/territories', formData);
      setShowCreate(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create territory');
    }
  };

  const handleAssignRep = async () => {
    if (!showAssignRep || !selectedRepId) return;
    try {
      await api.post(`/territories/${showAssignRep.id}/assign-rep`, { user_id: Number(selectedRepId) });
      setShowAssignRep(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign rep to territory');
    }
  };

  return (
    <div>
      <PageHeader
        title="Territory Management & Lead Routing"
        description="Distribute geographical coverage, assign regional sales managers, and balance rep workloads"
        action={
          hasRole('SALES_MANAGER', 'EXECUTIVE') && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Territory
            </button>
          )
        }
      />

      {loading ? (
        <LoadingState message="Loading territories..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : territories.length === 0 ? (
        <EmptyState
          title="No territories found"
          description="Create your first sales territory to assign accounts and reps."
          icon={Map}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {territories.map(terr => {
            const manager = users.find(u => u.id === terr.manager_id);
            const assignedReps = users.filter(u => u.territory_id === terr.id);
            const regionCustomers = customers.filter(c => c.region?.toLowerCase() === terr.region?.toLowerCase());

            return (
              <div
                key={terr.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">{terr.name}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {terr.region}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{terr.description || 'Geographic region coverage'}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                      <Map className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-gray-50 rounded-lg text-xs">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Assigned Manager</span>
                      <span className="font-semibold text-gray-900">
                        {manager ? manager.full_name : <span className="text-gray-400 italic">Unassigned</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Total Accounts</span>
                      <span className="font-semibold text-gray-900">
                        {regionCustomers.length} active client{regionCustomers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Assigned Representatives ({assignedReps.length})
                    </h4>
                    {assignedReps.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No reps currently assigned.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedReps.map(r => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {r.full_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => { setShowAssignRep(terr); setSelectedRepId(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Assign Rep
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Territory Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add Sales Territory</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Territory Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Central India"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={e => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g. Central"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description / States Covered</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Covers MP, Chhattisgarh..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Territory Manager</label>
                <select
                  value={formData.manager_id || ''}
                  onChange={e => setFormData({ ...formData, manager_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
                >
                  <option value="">-- Select Manager --</option>
                  {users.filter(u => u.role?.name === 'SALES_MANAGER' || u.role?.name === 'EXECUTIVE').map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                >
                  Create Territory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Rep Modal */}
      {showAssignRep && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Assign Representative</h3>
            <p className="text-sm text-gray-600 mb-4">
              Assign a sales representative to <strong className="text-gray-900">{showAssignRep.name}</strong>:
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sales Rep</label>
              <select
                value={selectedRepId}
                onChange={e => setSelectedRepId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-800"
              >
                <option value="">-- Choose Rep --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role?.name || 'User'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAssignRep(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRep}
                disabled={!selectedRepId}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
