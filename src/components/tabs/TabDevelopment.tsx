import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Game, DevelopmentItem } from '../../types';
import { useGameStore } from '../../store';
import { calcDevTotalHT, calcDevTotalTTC, fmt } from '../../utils/calculations';

function NumInput({ value, onChange, step = '1', className = '' }: {
  value: number; onChange: (v: number) => void; step?: string; className?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value || ''}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400 ${className}`}
    />
  );
}

function TextInput({ value, onChange, placeholder = '', className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400 ${className}`}
    />
  );
}

export function TabDevelopment({ game }: { game: Game }) {
  const { addDevItem, updateDevItem, removeDevItem, moveDevItem, updateGame } = useGameStore();

  function update(item: DevelopmentItem, patch: Partial<DevelopmentItem>) {
    const merged = { ...item, ...patch };
    if (!merged.manualTTC && patch.htPerUnit !== undefined) {
      merged.ttcPerUnit = merged.htPerUnit * (1 + game.vatRate / 100);
    }
    updateDevItem(game.id, item.id, merged);
  }

  const subtotalHT = game.developmentItems.reduce((s, i) => s + i.htPerUnit * i.quantity, 0);
  const subtotalTTC = game.developmentItems.reduce((s, i) => {
    const ttu = i.manualTTC ? i.ttcPerUnit : i.htPerUnit * (1 + game.vatRate / 100);
    return s + ttu * i.quantity;
  }, 0);
  const marginHT = calcDevTotalHT(game) - subtotalHT;
  const marginTTC = calcDevTotalTTC(game) - subtotalTTC;
  const totalHT = calcDevTotalHT(game);
  const totalTTC = calcDevTotalTTC(game);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Coûts de Développement</h2>
        <button
          className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold text-sm px-3 py-1.5 rounded transition-colors"
          onClick={() => addDevItem(game.id)}
        >
          <Plus size={14} />
          Ajouter ligne
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-700 text-white text-xs">
              <th className="px-2 py-2 text-left w-48">Composant + Dév.</th>
              <th className="px-2 py-2 text-center w-16">Quantité</th>
              <th className="px-2 py-2 text-center w-16">Nb Cartes</th>
              <th className="px-2 py-2 text-right w-24">HT/unité</th>
              <th className="px-2 py-2 text-right w-24">TTC/unité</th>
              <th className="px-2 py-2 text-right w-24">HT total</th>
              <th className="px-2 py-2 text-right w-24">TTC total</th>
              <th className="px-2 py-2 text-left w-28">Notes (prix base)</th>
              <th className="px-2 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {game.developmentItems.map((item, idx) => {
              const ttcUnit = item.manualTTC ? item.ttcPerUnit : item.htPerUnit * (1 + game.vatRate / 100);
              const htTotal = item.htPerUnit * item.quantity;
              const ttcTotal = ttcUnit * item.quantity;
              return (
                <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-2 py-1">
                    <TextInput value={item.name} onChange={v => update(item, { name: v })} placeholder="Nom..." />
                  </td>
                  <td className="px-2 py-1">
                    <NumInput value={item.quantity} onChange={v => update(item, { quantity: v })} />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={item.nbCards ?? ''}
                      onChange={e => update(item, { nbCards: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumInput value={item.htPerUnit} onChange={v => update(item, { htPerUnit: v })} step="0.01" />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-1">
                      <NumInput
                        value={ttcUnit}
                        onChange={v => update(item, { ttcPerUnit: v, manualTTC: true })}
                        step="0.01"
                        className={item.manualTTC ? 'text-blue-600' : ''}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1 text-right font-medium text-yellow-700">{fmt(htTotal)}</td>
                  <td className="px-2 py-1 text-right text-yellow-600">{fmt(ttcTotal)}</td>
                  <td className="px-2 py-1">
                    <TextInput value={item.notes} onChange={v => update(item, { notes: v })} />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-0.5">
                      <button
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                        onClick={() => moveDevItem(game.id, item.id, 'up')}
                        disabled={idx === 0}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                        onClick={() => moveDevItem(game.id, item.id, 'down')}
                        disabled={idx === game.developmentItems.length - 1}
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        className="text-red-400 hover:text-red-600 transition-colors ml-1"
                        onClick={() => removeDevItem(game.id, item.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Marge sécurité row */}
            <tr className="bg-amber-50 text-gray-600 italic text-xs border-t border-amber-200">
              <td className="px-2 py-1 flex items-center gap-1">
                <span>Marge Sécurité</span>
                <input
                  type="number"
                  value={game.developmentSafetyMarginPercent}
                  step="1" min="0" max="100"
                  onChange={e => updateGame(game.id, { developmentSafetyMarginPercent: parseFloat(e.target.value) || 0 })}
                  className="w-12 px-1 bg-amber-100 border border-amber-300 rounded text-right focus:outline-none"
                />
                <span>%</span>
              </td>
              <td colSpan={4}></td>
              <td className="px-2 py-1 text-right">{fmt(marginHT)}</td>
              <td className="px-2 py-1 text-right">{fmt(marginTTC)}</td>
              <td colSpan={2}></td>
            </tr>

            {/* Total row */}
            <tr className="bg-yellow-100 font-bold border-t-2 border-yellow-400">
              <td className="px-2 py-2" colSpan={5}>TOTAL Développement</td>
              <td className="px-2 py-2 text-right text-yellow-800">{fmt(totalHT)}</td>
              <td className="px-2 py-2 text-right text-yellow-700">{fmt(totalTTC)}</td>
              <td colSpan={2}></td>
            </tr>

            {/* Per unit rows for each factory quote */}
            {game.factoryQuotes.map(q => (
              <tr key={q.id} className="bg-yellow-50 text-xs text-gray-600">
                <td className="px-2 py-1 italic" colSpan={5}>
                  Dév. / unité — {q.factoryName} ({q.quantity} unités)
                </td>
                <td className="px-2 py-1 text-right font-medium">
                  {q.quantity > 0 ? fmt(totalHT / q.quantity) : '—'}
                </td>
                <td className="px-2 py-1 text-right">
                  {q.quantity > 0 ? fmt(totalTTC / q.quantity) : '—'}
                </td>
                <td colSpan={2}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
