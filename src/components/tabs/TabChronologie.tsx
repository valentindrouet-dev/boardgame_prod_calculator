import { useMemo } from 'react';
import { Trash2, Scissors } from 'lucide-react';
import type { Game, PaymentMilestone } from '../../types';
import { useGameStore } from '../../store';
import { buildPaymentMilestones, fmt } from '../../utils/calculations';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function TabChronologie({ game }: { game: Game }) {
  const { updateGame } = useGameStore();
  const milestones = useMemo(() => buildPaymentMilestones(game), [game]);

  function saveMilestones(updated: PaymentMilestone[]) {
    updateGame(game.id, { paymentSchedule: updated });
  }

  function updateMilestone(milestoneId: string, patch: Partial<PaymentMilestone>) {
    saveMilestones(milestones.map(m => (m.id === milestoneId ? { ...m, ...patch } : m)));
  }

  function splitInstallment(milestone: PaymentMilestone, installmentId: string) {
    const inst = milestone.installments.find(i => i.id === installmentId);
    if (!inst) return;
    const half = inst.amount / 2;
    const newInstallments = milestone.installments.flatMap(i => {
      if (i.id !== installmentId) return [i];
      return [
        { ...i, amount: half },
        { id: uid(), label: `${i.label} (suite)`, amount: half, date: null, paid: false },
      ];
    });
    updateMilestone(milestone.id, { installments: newInstallments });
  }

  function removeInstallment(milestone: PaymentMilestone, installmentId: string) {
    if (milestone.installments.length <= 1) return;
    updateMilestone(milestone.id, { installments: milestone.installments.filter(i => i.id !== installmentId) });
  }

  function updateInstallment(milestone: PaymentMilestone, installmentId: string, patch: Partial<PaymentMilestone['installments'][number]>) {
    updateMilestone(milestone.id, {
      installments: milestone.installments.map(i => (i.id === installmentId ? { ...i, ...patch } : i)),
    });
  }

  // Timeline: all installments with a date, sorted chronologically
  const timelineEntries = milestones
    .flatMap(m => m.installments.map(inst => ({ milestoneLabel: m.label, ...inst })))
    .filter(i => i.date)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));

  let cumulative = 0;
  const timelineWithCumulative = timelineEntries.map(entry => {
    cumulative += entry.amount;
    return { ...entry, cumulative };
  });

  const undatedTotal = milestones
    .flatMap(m => m.installments)
    .filter(i => !i.date)
    .reduce((s, i) => s + i.amount, 0);

  const grandTotal = milestones.reduce((s, m) => s + m.totalAmount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Chronologie des paiements</h2>
        <div className="text-sm text-gray-500">
          Total prévisionnel : <span className="font-bold text-gray-800">{fmt(grandTotal)}</span>
        </div>
      </div>

      {/* Milestones / installments editor */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-700 text-white text-xs">
              <th className="px-3 py-2 text-left">Étape</th>
              <th className="px-3 py-2 text-left">Échéance</th>
              <th className="px-3 py-2 text-right w-32">Montant HT</th>
              <th className="px-3 py-2 text-center w-36">Date de paiement</th>
              <th className="px-3 py-2 text-center w-16">Payé</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((m) => {
              const sum = m.installments.reduce((s, i) => s + i.amount, 0);
              const mismatch = Math.abs(sum - m.totalAmount) > 0.01;
              return (
                <>
                  {m.installments.map((inst, idx) => (
                    <tr key={inst.id} className="border-b border-gray-100">
                      {idx === 0 && (
                        <td className="px-3 py-1.5 font-medium text-gray-700 align-top" rowSpan={m.installments.length}>
                          {m.label}
                          {mismatch && (
                            <div className="text-xs text-red-500 mt-0.5">
                              Somme des échéances ({fmt(sum)}) ≠ montant ({fmt(m.totalAmount)})
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={inst.label}
                          onChange={e => updateInstallment(m, inst.id, { label: e.target.value })}
                          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={inst.amount || ''}
                          onChange={e => updateInstallment(m, inst.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="date"
                          value={inst.date ?? ''}
                          onChange={e => updateInstallment(m, inst.id, { date: e.target.value || null })}
                          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={inst.paid}
                          onChange={e => updateInstallment(m, inst.id, { paid: e.target.checked })}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            title="Décomposer ce paiement en deux"
                            className="text-yellow-600 hover:text-yellow-700"
                            onClick={() => splitInstallment(m, inst.id)}
                          >
                            <Scissors size={13} />
                          </button>
                          {m.installments.length > 1 && (
                            <button
                              title="Supprimer cette échéance"
                              className="text-red-400 hover:text-red-600"
                              onClick={() => removeInstallment(m, inst.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              );
            })}

            {milestones.length === 0 && (
              <tr>
                <td colSpan={6} className="text-gray-400 text-center py-8 text-sm">
                  Aucune dépense enregistrée pour l'instant. Ajoutez des postes dans Développement, Fabrication, Communication ou les frais de transport.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Frise chronologique</h3>
        {timelineWithCumulative.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune échéance datée. Renseignez une date de paiement ci-dessus pour la voir apparaître ici.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-700 text-white text-xs">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Étape</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                  <th className="px-3 py-2 text-right">Trésorerie cumulée nécessaire</th>
                </tr>
              </thead>
              <tbody>
                {timelineWithCumulative.map((entry, i) => (
                  <tr key={entry.id} className={`border-b border-gray-100 ${entry.paid ? 'bg-green-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-3 py-1.5 font-medium text-gray-700">{entry.date}</td>
                    <td className="px-3 py-1.5 text-gray-600">{entry.milestoneLabel} — {entry.label}</td>
                    <td className="px-3 py-1.5 text-right font-semibold">{fmt(entry.amount)}</td>
                    <td className="px-3 py-1.5 text-right text-yellow-700 font-bold">{fmt(entry.cumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {undatedTotal > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            <span className="font-semibold">{fmt(undatedTotal)}</span> en échéances non datées, non comptabilisées dans la frise.
          </p>
        )}
      </div>
    </div>
  );
}
