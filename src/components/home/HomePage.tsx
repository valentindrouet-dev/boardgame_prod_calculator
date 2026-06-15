import type { Game } from '../../types';
import { useGameStore } from '../../store';
import { calcSales, calcCostPerUnitHT, calcDevTotalHT, calcFabTotalHT, calcLogisticsTotalHT, calcCommTotalHT, fmt } from '../../utils/calculations';

function StatCard({ label, value, sub, color = 'yellow' }: { label: string; value: string; sub?: string; color?: string }) {
  const border = color === 'green' ? 'border-green-400' : color === 'red' ? 'border-red-400' : color === 'purple' ? 'border-purple-400' : 'border-yellow-400';
  const text = color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-700' : color === 'purple' ? 'text-purple-700' : 'text-yellow-700';
  return (
    <div className={`bg-white rounded-lg shadow p-4 border-t-4 ${border}`}>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${text}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function GameCard({ game, onOpen }: { game: Game; onOpen: () => void }) {
  const scenarios = game.salesScenarios;
  const hasScenarios = scenarios.length > 0;

  const bestScenario = hasScenarios
    ? scenarios.reduce((best, s, idx) => {
        const calc = calcSales(game, idx);
        const bestCalc = calcSales(game, game.salesScenarios.indexOf(best));
        if (!calc || !bestCalc) return best;
        return calc.totalMarginMinusAuthor > bestCalc.totalMarginMinusAuthor ? s : best;
      }, scenarios[0])
    : null;
  const bestCalc = bestScenario ? calcSales(game, game.salesScenarios.indexOf(bestScenario)) : null;

  return (
    <div
      className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <h3 className="font-bold text-yellow-400">{game.name}</h3>
        <span className="text-xs text-gray-400">
          {game.factoryQuotes.length} usine{game.factoryQuotes.length > 1 ? 's' : ''} · {scenarios.length} scénario{scenarios.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Costs summary */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded p-2">
            <div className="text-gray-500">Développement</div>
            <div className="font-semibold">{fmt(calcDevTotalHT(game))}</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-gray-500">Transport</div>
            <div className="font-semibold">{fmt(calcLogisticsTotalHT(game))}</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-gray-500">Communication</div>
            <div className="font-semibold">{fmt(calcCommTotalHT(game))}</div>
          </div>
          {game.factoryQuotes.length > 0 && (
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-500">Fabrication (1er devis)</div>
              <div className="font-semibold">{fmt(calcFabTotalHT(game.factoryQuotes[0]))}</div>
            </div>
          )}
        </div>

        {/* Scenarios */}
        {hasScenarios && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Scénarios de vente</div>
            <div className="space-y-1">
              {scenarios.map((s, idx) => {
                const calc = calcSales(game, idx);
                if (!calc) return null;
                const isPositive = calc.totalMarginMinusAuthor >= 0;
                return (
                  <div key={s.id} className="flex items-center justify-between text-xs border border-gray-100 rounded px-2 py-1">
                    <span className="text-gray-700 font-medium">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{fmt(calc.totalVentesHT)} ventes</span>
                      <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{fmt(calc.totalMarginMinusAuthor)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasScenarios && (
          <p className="text-xs text-gray-400 text-center py-2">Aucun scénario de vente</p>
        )}

        {/* Best scenario highlight */}
        {bestCalc && (
          <div className={`rounded p-2 text-xs text-center ${bestCalc.totalMarginMinusAuthor >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            Meilleure marge : <span className="font-bold">{fmt(bestCalc.totalMarginMinusAuthor)}</span>
            <span className="text-gray-400 ml-1">({bestScenario?.name})</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function HomePage({ onOpenGame }: { onOpenGame: (id: string) => void }) {
  const { games } = useGameStore();

  // Global stats across all games
  const totalGames = games.length;
  const allScenarios = games.flatMap((g) =>
    g.salesScenarios.map((_, si) => ({ game: g, calc: calcSales(g, si) }))
  ).filter(x => x.calc !== null) as { game: Game; calc: NonNullable<ReturnType<typeof calcSales>> }[];

  const totalInvestment = games.reduce((sum, g) => {
    const devComm = calcDevTotalHT(g) + calcLogisticsTotalHT(g) + calcCommTotalHT(g);
    const fab = g.factoryQuotes.reduce((s, q) => s + calcFabTotalHT(q), 0);
    return sum + devComm + fab;
  }, 0);

  const totalRevenue = allScenarios.reduce((sum, { calc }) => sum + calc.totalVentesHT, 0);
  const totalMargin = allScenarios.reduce((sum, { calc }) => sum + calc.totalMarginMinusAuthor, 0);
  const positiveScenarios = allScenarios.filter(x => x.calc.totalMarginMinusAuthor >= 0).length;

  // Per-factory cost/unit table across all games
  const allQuoteRows = games.flatMap(g =>
    g.factoryQuotes.map(q => ({
      gameName: g.name,
      factoryName: q.factoryName,
      quantity: q.quantity,
      costPerUnit: calcCostPerUnitHT(g, q, true, true),
    }))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-800 text-white px-6 py-4">
        <h1 className="text-xl font-bold text-yellow-400">Tableau de bord</h1>
        <p className="text-gray-400 text-sm mt-0.5">{totalGames} projet{totalGames > 1 ? 's' : ''} en cours</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {games.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-lg">
            Aucun projet. Créez un jeu depuis la barre latérale.
          </div>
        ) : (
          <>
            {/* Global stats */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Stats globales</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Projets" value={totalGames.toString()} color="yellow" />
                <StatCard
                  label="Investissement total"
                  value={fmt(totalInvestment)}
                  sub="dév + fab + transport + comm"
                  color="red"
                />
                {allScenarios.length > 0 && (
                  <>
                    <StatCard
                      label="CA total (tous scénarios)"
                      value={fmt(totalRevenue)}
                      sub={`${allScenarios.length} scénario${allScenarios.length > 1 ? 's' : ''}`}
                      color="purple"
                    />
                    <StatCard
                      label="Marge totale"
                      value={fmt(totalMargin)}
                      sub={`${positiveScenarios}/${allScenarios.length} scénarios positifs`}
                      color={totalMargin >= 0 ? 'green' : 'red'}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Cross-project cost/unit comparison */}
            {allQuoteRows.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Coût / unité par usine</h2>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-700 text-white text-xs">
                        <th className="px-4 py-2 text-left">Projet</th>
                        <th className="px-4 py-2 text-left">Usine</th>
                        <th className="px-4 py-2 text-right">Quantité</th>
                        <th className="px-4 py-2 text-right">Coût / unité HT</th>
                        <th className="px-4 py-2 text-right">Coût / unité TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allQuoteRows.map((row, i) => (
                        <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-2 font-medium text-yellow-700">{row.gameName}</td>
                          <td className="px-4 py-2 text-gray-600">{row.factoryName}</td>
                          <td className="px-4 py-2 text-right text-gray-500">{row.quantity.toLocaleString('fr-FR')} u.</td>
                          <td className="px-4 py-2 text-right font-semibold">{fmt(row.costPerUnit)}</td>
                          <td className="px-4 py-2 text-right text-gray-500">
                            {fmt(row.costPerUnit * (1 + (games.find(g => g.factoryQuotes.some(q => q.factoryName === row.factoryName))?.vatRate ?? 20) / 100))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Game cards */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Projets</h2>
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                {games.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onOpen={() => onOpenGame(game.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
