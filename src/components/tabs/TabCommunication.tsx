import { Plus, Trash2 } from 'lucide-react';
import type { Game } from '../../types';
import { useGameStore } from '../../store';
import { calcCommTotalHT, fmt } from '../../utils/calculations';

export function TabCommunication({ game }: { game: Game }) {
  const { addCommItem, updateCommItem, removeCommItem } = useGameStore();

  const commSubtotalHT = game.communicationItems.reduce((s, item) => s + item.monthlyPriceHT * item.months, 0);
  const totalHT = calcCommTotalHT(game);
  const marginHT = totalHT - commSubtotalHT;
  const totalTTC = totalHT * (1 + game.vatRate / 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Communication</h2>
        <button
          className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold text-sm px-3 py-1.5 rounded transition-colors"
          onClick={() => addCommItem(game.id)}
        >
          <Plus size={14} />
          Ajouter ligne
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-700 text-white text-xs">
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2 text-right w-28">HT / mois</th>
              <th className="px-3 py-2 text-center w-16">Mois</th>
              <th className="px-3 py-2 text-center w-20">Marge %</th>
              <th className="px-3 py-2 text-right w-28">Total HT</th>
              <th className="px-3 py-2 text-right w-28">Total TTC</th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {game.communicationItems.map((item, idx) => {
              const total = item.monthlyPriceHT * item.months * (1 + item.safetyMarginPercent / 100);
              const totalTTCItem = total * (1 + game.vatRate / 100);
              return (
                <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-3 py-1.5">
                    <input
                      type="text" value={item.name}
                      onChange={e => updateCommItem(game.id, item.id, { name: e.target.value })}
                      className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number" step="0.01" value={item.monthlyPriceHT || ''}
                      onChange={e => updateCommItem(game.id, item.id, { monthlyPriceHT: parseFloat(e.target.value) || 0 })}
                      className="w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number" step="1" value={item.months || ''}
                      onChange={e => updateCommItem(game.id, item.id, { months: parseInt(e.target.value) || 0 })}
                      className="w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number" step="1" min="0" max="100" value={item.safetyMarginPercent || ''}
                        onChange={e => updateCommItem(game.id, item.id, { safetyMarginPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-purple-700">{fmt(total)}</td>
                  <td className="px-3 py-1.5 text-right text-purple-600">{fmt(totalTTCItem)}</td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      className="text-red-400 hover:text-red-600"
                      onClick={() => removeCommItem(game.id, item.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {game.communicationItems.length > 0 && (
              <>
                <tr className="bg-purple-50 border-t border-purple-200 text-xs text-gray-600 italic">
                  <td className="px-3 py-1.5" colSpan={4}>Sous-total HT (avant marges)</td>
                  <td className="px-3 py-1.5 text-right">{fmt(commSubtotalHT)}</td>
                  <td className="px-3 py-1.5 text-right">{fmt(commSubtotalHT * (1 + game.vatRate / 100))}</td>
                  <td></td>
                </tr>
                <tr className="bg-purple-50 text-xs text-purple-700 italic">
                  <td className="px-3 py-1.5" colSpan={4}>+ Marges de sécurité</td>
                  <td className="px-3 py-1.5 text-right">+{fmt(marginHT)}</td>
                  <td className="px-3 py-1.5 text-right">+{fmt(marginHT * (1 + game.vatRate / 100))}</td>
                  <td></td>
                </tr>
                <tr className="bg-purple-100 font-bold border-t-2 border-purple-300">
                  <td className="px-3 py-2" colSpan={4}>TOTAL Communication</td>
                  <td className="px-3 py-2 text-right text-purple-800">{fmt(totalHT)}</td>
                  <td className="px-3 py-2 text-right text-purple-700">{fmt(totalTTC)}</td>
                  <td></td>
                </tr>
              </>
            )}

            {/* Per-unit for each factory quote */}
            {game.factoryQuotes.map(q => (
              <tr key={q.id} className="bg-purple-50 text-xs text-gray-600 italic">
                <td className="px-3 py-1" colSpan={4}>
                  Comm. / unité — {q.factoryName} ({q.quantity} unités)
                </td>
                <td className="px-3 py-1 text-right font-medium">
                  {q.quantity > 0 ? fmt(totalHT / q.quantity) : '—'}
                </td>
                <td className="px-3 py-1 text-right">
                  {q.quantity > 0 ? fmt(totalTTC / q.quantity) : '—'}
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {game.communicationItems.length === 0 && (
          <p className="text-gray-400 text-center py-8 text-sm">
            Aucun poste de communication. Cliquez sur "Ajouter ligne" pour commencer.
          </p>
        )}
      </div>
    </div>
  );
}
