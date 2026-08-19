import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatusBadge, LoadingState, ErrorState } from '@/components/common';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/services/api';
import type { Opportunity, Customer } from '@/types';
import { GitBranch, Plus, ChevronRight, ChevronLeft, Building2 } from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'PROSPECTING', label: 'Prospecting', color: 'border-t-blue-500' },
  { key: 'QUALIFICATION', label: 'Qualification', color: 'border-t-indigo-500' },
  { key: 'PROPOSAL', label: 'Proposal / Demo', color: 'border-t-amber-500' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'border-t-purple-500' },
  { key: 'CLOSED_WON', label: 'Closed Won', color: 'border-t-emerald-500' },
  { key: 'CLOSED_LOST', label: 'Closed Lost', color: 'border-t-red-500' },
];

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPipeline = () => {
    setLoading(true);
    Promise.all([
      api.get('/opportunities', { params: { page_size: 100 } }),
      api.get('/customers', { params: { page_size: 100 } }),
    ])
      .then(([oppRes, custRes]) => {
        setOpportunities(oppRes.data.items || []);
        setCustomers(custRes.data.items || custRes.data || []);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load pipeline'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleMoveStage = async (opp: Opportunity, direction: 'prev' | 'next') => {
    const stageKeys = PIPELINE_STAGES.map(s => s.key);
    const currIdx = stageKeys.indexOf(opp.stage);
    const targetIdx = direction === 'next' ? currIdx + 1 : currIdx - 1;

    if (targetIdx >= 0 && targetIdx < stageKeys.length) {
      try {
        await api.put(`/opportunities/${opp.id}/stage`, { stage: stageKeys[targetIdx] });
        fetchPipeline();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to update deal stage');
      }
    }
  };

  const totalPipeline = opportunities
    .filter(o => o.stage !== 'CLOSED_LOST')
    .reduce((sum, o) => sum + Number(o.deal_value || 0), 0);

  const weightedPipeline = opportunities
    .filter(o => o.stage !== 'CLOSED_LOST')
    .reduce((sum, o) => sum + (Number(o.deal_value || 0) * Number(o.probability || 0)) / 100, 0);

  return (
    <div>
      <PageHeader
        title="Visual Sales Pipeline"
        description={`Total Open Pipeline: ${formatCurrency(totalPipeline)} | Weighted Forecast: ${formatCurrency(weightedPipeline)}`}
      />

      {loading ? (
        <LoadingState message="Loading visual sales pipeline..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPipeline} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((col, colIdx) => {
            const stageDeals = opportunities.filter(o => o.stage === col.key);
            const stageValue = stageDeals.reduce((sum, o) => sum + Number(o.deal_value || 0), 0);

            return (
              <div
                key={col.key}
                className={`bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col min-w-[240px] border-t-4 ${col.color}`}
              >
                {/* Stage Header */}
                <div className="p-3 bg-white border-b border-gray-200/80 rounded-t-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-800">
                      {col.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-semibold">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-600">
                    {formatCurrency(stageValue)}
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {stageDeals.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400 italic">
                      No deals in this stage
                    </div>
                  ) : (
                    stageDeals.map(deal => {
                      const customer = customers.find(c => c.id === deal.customer_id);
                      return (
                        <div
                          key={deal.id}
                          className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group"
                        >
                          <div className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                            {deal.name}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{customer?.name || `Customer #${deal.customer_id}`}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-gray-900 pt-2 border-t border-gray-100">
                            <span>{formatCurrency(deal.deal_value)}</span>
                            <span className="text-blue-600 font-medium">{deal.probability}%</span>
                          </div>

                          {/* Quick stage nav */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-gray-400">
                            <button
                              disabled={colIdx === 0}
                              onClick={() => handleMoveStage(deal, 'prev')}
                              className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-20"
                              title="Move stage back"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Move</span>
                            <button
                              disabled={colIdx === PIPELINE_STAGES.length - 1}
                              onClick={() => handleMoveStage(deal, 'next')}
                              className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-20"
                              title="Move stage forward"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
