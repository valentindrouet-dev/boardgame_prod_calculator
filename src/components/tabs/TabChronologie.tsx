import { useMemo } from 'react';
import { Trash2, Scissors, Plus } from 'lucide-react';
import type { Game, PaymentMilestone } from '../../types';
import { useGameStore } from '../../store';
import { buildPaymentMilestones, fmt } from '../../utils/calculations';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Fiscal year: September of year N to August of year N+1
function getFiscalYearKey(value: string): { key: string; label: string } {
  const [year, month] = value.split('-').map(Number);
  const startYear = month >= 9 ? year : year - 1;
  return { key: String(startYear), label: `Année fiscale ${startYear}-${startYear + 1} (sept. à août)` };
}

export function TabChronologie({ game }: { game: Game }) {
  const { updateGame } = useGameStore();
  const milestones = useMemo(() => buildPaymentMilestones(game), [game]);
  const vatMult = 1 + game.vatRate / 100;

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

  function addInstallment(milestone: PaymentMilestone) {
    const newInstallment = { id: uid(), label: 'Nouvelle échéance', amount: 0, date: null, paid: false };
    updateMilestone(milestone.id, { installments: [...milestone.installments, newInstallment] });
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

  // Group entries by month for the timeline frieze, with running cumulative treasury
  const groupsMap = new Map<string, typeof timelineEntries>();
  timelineEntries.forEach(entry => {
    const key = entry.date!;
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key)!.push(entry);
  });

  let cumulative = 0;
  let cumulativeTTC = 0;
  const timelineGroups = Array.from(groupsMap.entries()).map(([date, entries]) => {
    const monthTotal = entries.reduce((s, e) => s + e.amount, 0);
    cumulative += monthTotal;
    cumulativeTTC += monthTotal * vatMult;
    return { date, entries, monthTotal, monthTotalTTC: monthTotal * vatMult, cumulative, cumulativeTTC };
  });

  // Group month-groups into fiscal years (Sept -> Aug)
  const fiscalYearsMap = new Map<string, { label: string; groups: typeof timelineGroups }>();
  timelineGroups.forEach(group => {
    const { key, label } = getFiscalYearKey(group.date);
    if (!fiscalYearsMap.has(key)) fiscalYearsMap.set(key, { label, groups: [] });
    fiscalYearsMap.get(key)!.groups.push(group);
  });
  const fiscalYears = Array.from(fiscalYearsMap.values());

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
          Total prévisionnel : <span className="font-bold text-gray-800">{fmt(grandTotal)} HT</span>
          <span className="text-gray-400"> · {fmt(grandTotal * vatMult)} TTC</span>
        </div>
      </div>

      {/* Milestones / installments editor */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-700 text-white text-xs">
              <th className="px-3 py-2 text-left">Étape</th>
              <th className="px-3 py-2 text-left">Échéance</th>
              <th className="px-3 py-2 text-right w-28">Montant HT</th>
              <th className="px-3 py-2 text-right w-28">Montant TTC</th>
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
                          onChange={e => updateInstallment(m, inst.id, { amount: Math.round((parseFloat(e.target.value) || 0) * 100) / 100 })}
                          className="w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={Math.round(inst.amount * vatMult * 100) / 100 || ''}
                          onChange={e => updateInstallment(m, inst.id, { amount: Math.round(((parseFloat(e.target.value) || 0) / vatMult) * 100) / 100 })}
                          className="w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm text-gray-500 focus:outline-none focus:border-yellow-400"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="month"
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
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td colSpan={6} className="px-3 py-1">
                      <button
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => addInstallment(m)}
                      >
                        <Plus size={12} />
                        Ajouter une échéance à cette étape
                      </button>
                    </td>
                  </tr>
                </>
              );
            })}

            {milestones.length === 0 && (
              <tr>
                <td colSpan={7} className="text-gray-400 text-center py-8 text-sm">
                  Aucune dépense enregistrée pour l'instant. Ajoutez des postes dans Développement, Fabrication, Communication ou les frais de transport.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Frise chronologique</h3>
        {fiscalYears.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune échéance datée. Renseignez un mois de paiement ci-dessus pour la voir apparaître ici.</p>
        ) : (
          fiscalYears.map(fy => {
            const fyTotal = fy.groups.reduce((s, g) => s + g.monthTotal, 0);
            return (
              <div key={fy.label} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">{fy.label}</h4>
                  <span className="text-xs text-gray-500">
                    Total : <span className="font-semibold text-gray-700">{fmt(fyTotal)}</span> HT
                  </span>
                </div>
                <div
                  className="relative grid gap-2 pt-3"
                  style={{ gridTemplateColumns: `repeat(auto-fit, minmax(90px, 1fr))` }}
                >
                  {fy.groups.map(group => {
                    const allPaid = group.entries.every(e => e.paid);
                    return (
                      <div key={group.date} className="relative flex flex-col items-center min-w-0">
                        <div className={`w-3 h-3 rounded-full border-2 border-white z-10 ${allPaid ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div className="text-[11px] font-bold text-gray-700 mt-1.5 truncate w-full text-center">{formatMonth(group.date)}</div>
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-1.5 mt-1.5 w-full text-[11px] space-y-1 min-w-0">
                          {group.entries.map(e => (
                            <div key={e.id} className={`flex items-center justify-between gap-1 ${e.paid ? 'text-green-600' : 'text-gray-600'}`}>
                              <span className="truncate" title={`${e.milestoneLabel} — ${e.label}`}>{e.label}</span>
                              <span className="font-medium whitespace-nowrap">{fmt(e.amount)}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-100 pt-1 mt-1">
                            <div className="flex items-center justify-between font-bold text-gray-800">
                              <span className="truncate">Mois</span>
                              <span className="whitespace-nowrap">{fmt(group.monthTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-gray-400">
                              <span>TTC</span>
                              <span className="whitespace-nowrap">{fmt(group.monthTotalTTC)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-800 text-white rounded p-1 mt-1 w-full text-[10px] text-center">
                          <div className="text-gray-300">Cumul</div>
                          <div className="font-bold text-yellow-400 whitespace-nowrap">{fmt(group.cumulative)}</div>
                          <div className="text-gray-400 whitespace-nowrap">{fmt(group.cumulativeTTC)} TTC</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
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
