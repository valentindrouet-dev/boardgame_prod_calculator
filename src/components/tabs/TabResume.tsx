import type { Game } from '../../types';
import {
  calcDevPerUnit, calcFabPerUnitEUR, calcLogisticsPerUnit,
  calcCostPerUnitHT, calcDevTotalHT, calcFabTotalHT, calcLogisticsTotalHT, calcCommTotalHT,
  calcCommPerUnit, fmt
} from '../../utils/calculations';

export function TabResume({ game }: { game: Game }) {
  if (game.factoryQuotes.length === 0) {
    return (
      <div className="text-center text-gray-400 py-20">
        Ajoutez au moins un devis d'usine dans l'onglet "Fabrication" pour voir le résumé.
      </div>
    );
  }

  const rows = [
    {
      label: 'Développement / unité HT',
      values: game.factoryQuotes.map(q => calcDevPerUnit(game, q)),
      highlight: false,
    },
    {
      label: 'Fabrication / unité HT',
      values: game.factoryQuotes.map(q => calcFabPerUnitEUR(q)),
      highlight: false,
    },
    {
      label: 'Transport / unité HT',
      values: game.factoryQuotes.map(q => calcLogisticsPerUnit(game, q)),
      highlight: false,
    },
    {
      label: 'Communication / unité HT',
      values: game.factoryQuotes.map(q => calcCommPerUnit(game, q)),
      highlight: false,
    },
    {
      label: 'COÛT TOTAL / unité HT',
      values: game.factoryQuotes.map(q => calcCostPerUnitHT(game, q, true)),
      highlight: true,
    },
    {
      label: 'COÛT TOTAL / unité TTC',
      values: game.factoryQuotes.map(q => calcCostPerUnitHT(game, q, true) * (1 + game.vatRate / 100)),
      highlight: true,
    },
    {
      label: 'COÛT TOTAL (production)',
      values: game.factoryQuotes.map(q => calcCostPerUnitHT(game, q, true) * q.quantity),
      highlight: true,
    },
  ];

  const totalsRows = [
    { label: 'Développement total HT', value: calcDevTotalHT(game) },
    { label: 'Transport total HT', value: calcLogisticsTotalHT(game) },
    { label: 'Communication total HT', value: calcCommTotalHT(game) },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-800">Résumé Comparatif</h2>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-4 py-3 text-left w-56">Poste de coût</th>
              {game.factoryQuotes.map(q => (
                <th key={q.id} className="px-4 py-3 text-center">
                  <div className="font-bold">{q.factoryName}</div>
                  <div className="text-xs text-yellow-300 font-normal">{q.quantity.toLocaleString('fr-FR')} unités</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.highlight ? 'bg-yellow-100 font-bold border-t-2 border-yellow-400' : (i % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                <td className="px-4 py-2 text-gray-700">{row.label}</td>
                {row.values.map((v, j) => (
                  <td key={j} className={`px-4 py-2 text-center ${row.highlight ? 'text-yellow-800 text-base' : 'text-gray-800'}`}>
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-factory logistics */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(game.factoryQuotes.length, 3)}, 1fr)` }}>
        {game.factoryQuotes.map(q => (
          <div key={q.id} className="bg-white rounded-lg shadow p-4 border-t-4 border-yellow-400">
            <h3 className="font-bold text-gray-800 mb-3">{q.factoryName} — {q.quantity.toLocaleString('fr-FR')} unités</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Développement</span>
                <span>{fmt(calcDevPerUnit(game, q))}/u · {fmt(calcDevTotalHT(game))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fabrication</span>
                <span>{fmt(calcFabPerUnitEUR(q))}/u · {fmt(calcFabTotalHT(q))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transport</span>
                <span>{fmt(calcLogisticsPerUnit(game, q))}/u · {fmt(calcLogisticsTotalHT(game))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Communication</span>
                <span>{fmt(calcCommPerUnit(game, q))}/u · {fmt(calcCommTotalHT(game))}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-yellow-800">
                <span>TOTAL / unité HT</span>
                <span className="text-lg">{fmt(calcCostPerUnitHT(game, q, true))}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TOTAL / unité TTC</span>
                <span className="font-semibold">{fmt(calcCostPerUnitHT(game, q, true) * (1 + game.vatRate / 100))}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TOTAL production</span>
                <span className="font-semibold">{fmt(calcCostPerUnitHT(game, q, true) * q.quantity)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed costs */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Coûts fixes (indépendants de l'usine)</h3>
        <div className="flex gap-8 text-sm">
          {totalsRows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-600">{r.label} :</span>
              <span className="font-semibold">{fmt(r.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
