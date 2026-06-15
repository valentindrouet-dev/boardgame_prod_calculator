import type { Game } from '../../types';
import {
  calcFabPerUnitEUR, calcFabTotalHT, calcLogisticsPerUnit,
  calcCostPerUnitHT, calcDevTotalHT, calcFabToolingEUR, calcFabComponentsPerUnitEUR,
  calcLogisticsTotalHT, calcCommTotalHT, calcCommPerUnit, calcDevPerUnit,
  calcSales, fmt
} from '../../utils/calculations';

export function TabResume({ game }: { game: Game }) {
  if (game.factoryQuotes.length === 0) {
    return (
      <div className="text-center text-gray-400 py-20">
        Ajoutez au moins un devis d'usine dans l'onglet "Fabrication" pour voir le résumé.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-800">Résumé</h2>

      {/* Per-factory cost cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Coûts par usine</h3>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(game.factoryQuotes.length, 3)}, 1fr)` }}>
          {game.factoryQuotes.map(q => {
            const compPerUnit = calcFabComponentsPerUnitEUR(q);
            const toolingEUR = calcFabToolingEUR(q);
            const fabPerUnit = calcFabPerUnitEUR(q);
            const logPerUnit = calcLogisticsPerUnit(game, q);
            const devPerUnit = calcDevPerUnit(game, q);
            const commPerUnit = calcCommPerUnit(game, q);
            const totalPerUnit = calcCostPerUnitHT(game, q, true, true);
            void fabPerUnit;
            return (
              <div key={q.id} className="bg-white rounded-lg shadow p-4 border-t-4 border-yellow-400">
                <h3 className="font-bold text-gray-800 mb-3">{q.factoryName} — {q.quantity.toLocaleString('fr-FR')} unités</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Développement</span>
                    <span>{fmt(devPerUnit)}/u</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Composants (avec marge)</span>
                    <span>{fmt(compPerUnit)}/u</span>
                  </div>
                  {toolingEUR > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Outillage (amorti)</span>
                      <span>{fmt(toolingEUR / (q.quantity || 1))}/u</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transport</span>
                    <span>{fmt(logPerUnit)}/u</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Communication</span>
                    <span>{fmt(commPerUnit)}/u</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-yellow-800">
                    <span>TOTAL / unité HT</span>
                    <span className="text-lg">{fmt(totalPerUnit)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>TOTAL / unité TTC</span>
                    <span className="font-semibold">{fmt(totalPerUnit * (1 + game.vatRate / 100))}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>TOTAL fabrication</span>
                    <span className="font-semibold">{fmt(calcFabTotalHT(q))}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed costs */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Coûts fixes (communs à toutes les usines)</h3>
        <div className="flex flex-wrap gap-8 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-600">Développement total HT :</span>
            <span className="font-semibold">{fmt(calcDevTotalHT(game))}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">Transport total HT :</span>
            <span className="font-semibold">{fmt(calcLogisticsTotalHT(game))}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">Communication total HT :</span>
            <span className="font-semibold">{fmt(calcCommTotalHT(game))}</span>
          </div>
        </div>
      </div>

      {/* Sales scenarios summary */}
      {game.salesScenarios.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Scénarios de vente</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-800 text-white text-xs">
                  <th className="px-4 py-2 text-left">Scénario</th>
                  <th className="px-4 py-2 text-left">Usine</th>
                  <th className="px-4 py-2 text-right">Coût/u HT</th>
                  <th className="px-4 py-2 text-right">PVC HT</th>
                  <th className="px-4 py-2 text-right">Ventes HT</th>
                  <th className="px-4 py-2 text-right">Coût total</th>
                  <th className="px-4 py-2 text-right">Marge Brute</th>
                  <th className="px-4 py-2 text-right">Marge Finale</th>
                  <th className="px-4 py-2 text-center text-xs font-normal">Dév / Comm</th>
                </tr>
              </thead>
              <tbody>
                {game.salesScenarios.map((scenario, idx) => {
                  const calc = calcSales(game, idx);
                  const quote = game.factoryQuotes.find(q => q.id === scenario.factoryQuoteId);
                  if (!calc || !quote) return null;
                  const isPositive = calc.totalMarginMinusAuthor >= 0;
                  const inclDev = scenario.includeDevelopmentCost;
                  const inclComm = scenario.includeCommunicationCost ?? true;
                  return (
                    <tr key={scenario.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-2.5 font-semibold text-purple-800">{scenario.name}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">
                        {quote.factoryName}
                        <br /><span className="text-gray-400">{quote.quantity.toLocaleString('fr-FR')} u.</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-600 font-medium">{fmt(calc.costPerUnitHT)}</td>
                      <td className="px-4 py-2.5 text-right">{fmt(scenario.pvcHT)}</td>
                      <td className="px-4 py-2.5 text-right">{fmt(calc.totalVentesHT)}</td>
                      <td className="px-4 py-2.5 text-right text-red-500">−{fmt(calc.totalCost)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${calc.totalMarginHT >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {fmt(calc.totalMarginHT)}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold text-base ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                        {fmt(calc.totalMarginMinusAuthor)}
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs">
                        <span className={inclDev ? 'text-green-600' : 'text-gray-300'}>Dév</span>
                        <span className="text-gray-300 mx-1">/</span>
                        <span className={inclComm ? 'text-green-600' : 'text-gray-300'}>Comm</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
