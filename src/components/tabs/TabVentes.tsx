import { Plus, Trash2 } from 'lucide-react';
import type { Game, SalesScenario } from '../../types';
import { useGameStore } from '../../store';
import { calcSales, fmt } from '../../utils/calculations';

function NumInput({ value, onChange, step = '0.01', min, className = '' }: {
  value: number; onChange: (v: number) => void; step?: string; min?: number; className?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      min={min}
      value={value || ''}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400 ${className}`}
    />
  );
}

function Row({ label, value, sub, className = '', valueClass = '' }: {
  label: string; value: string; sub?: string; className?: string; valueClass?: string;
}) {
  return (
    <tr className={`border-b border-gray-100 ${className}`}>
      <td className="px-2 py-1 text-xs text-gray-600">{label}</td>
      <td className={`px-2 py-1 text-right text-sm font-medium ${valueClass}`}>{value}</td>
      {sub && <td className="px-2 py-1 text-xs text-gray-400">{sub}</td>}
    </tr>
  );
}

function ScenarioCard({ game, scenario }: { game: Game; scenario: SalesScenario }) {
  const { updateSalesScenario, removeSalesScenario } = useGameStore();
  const update = (patch: Partial<SalesScenario>) => updateSalesScenario(game.id, scenario.id, patch);
  const calc = calcSales(game, game.salesScenarios.indexOf(scenario));
  const selectedQuote = game.factoryQuotes.find(q => q.id === scenario.factoryQuoteId);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 min-w-72 flex-1">
      {/* Card header */}
      <div className="bg-purple-800 text-white px-3 py-2 rounded-t-lg">
        <div className="flex items-center justify-between">
          <input
            className="bg-purple-700 text-white font-bold text-sm px-2 py-0.5 rounded border border-purple-600 focus:outline-none focus:border-yellow-400 w-32"
            value={scenario.name}
            onChange={e => update({ name: e.target.value })}
          />
          <button className="text-red-300 hover:text-red-200" onClick={() => removeSalesScenario(game.id, scenario.id)}>
            <Trash2 size={14} />
          </button>
        </div>
        <div className="mt-1">
          <select
            className="bg-purple-700 text-white text-xs px-1 py-0.5 rounded border border-purple-600 focus:outline-none w-full"
            value={scenario.factoryQuoteId}
            onChange={e => update({ factoryQuoteId: e.target.value })}
          >
            <option value="">— Choisir une usine —</option>
            {game.factoryQuotes.map(q => (
              <option key={q.id} value={q.id}>{q.factoryName} ({q.quantity} unités)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Base settings */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex flex-col gap-0.5">
            <span className="text-gray-500 font-medium">PVC HT</span>
            <NumInput value={scenario.pvcHT} step="0.01" onChange={v => update({ pvcHT: v })} />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-gray-500">PVC TTC (auto)</span>
            <div className="px-1 py-0.5 border border-gray-100 rounded text-right text-sm text-gray-600 bg-gray-50">
              {calc ? fmt(calc.pvcTTC) : '—'}
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            id={`dev-${scenario.id}`}
            checked={scenario.includeDevelopmentCost}
            onChange={e => update({ includeDevelopmentCost: e.target.checked })}
            className="rounded"
          />
          <label htmlFor={`dev-${scenario.id}`} className="text-gray-600">Inclure Développement</label>
        </div>

        {calc && selectedQuote && (
          <div className="text-xs bg-gray-50 px-2 py-1 rounded">
            <span className="text-gray-500">Coût/unité HT : </span>
            <span className="font-bold text-red-600">{fmt(calc.costPerUnitHT)}</span>
            <span className="text-gray-400"> · TTC : {fmt(calc.costPerUnitTTC)}</span>
          </div>
        )}

        {/* Boutique */}
        <div className="border border-orange-200 rounded overflow-hidden">
          <div className="bg-orange-100 px-2 py-1 text-xs font-bold text-orange-800">Boutique</div>
          <div className="p-2 space-y-1.5">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">Marge Boutique %</span>
                <div className="flex items-center gap-0.5">
                  <NumInput value={scenario.boutiqueMarginPercent} step="1" min={0} onChange={v => update({ boutiqueMarginPercent: v })} />
                  <span className="text-gray-400">%</span>
                </div>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">% du tirage</span>
                <div className="flex items-center gap-0.5">
                  <NumInput
                    value={selectedQuote && selectedQuote.quantity > 0 ? Math.round(scenario.boutiqueQty / selectedQuote.quantity * 1000) / 10 : 0}
                    step="1" min={0}
                    onChange={v => update({ boutiqueQty: Math.round((selectedQuote?.quantity ?? 0) * v / 100) })}
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">Nb boîtes</span>
                <NumInput value={scenario.boutiqueQty} step="1" min={0} onChange={v => update({ boutiqueQty: Math.round(v) })} />
              </label>
            </div>
            {calc && (
              <table className="w-full">
                <tbody>
                  <Row label="Prix d'achat Boutique HT" value={fmt(calc.boutiquePriceHT)} valueClass="text-orange-700" />
                  <Row label="Prix d'achat Boutique TTC" value={fmt(calc.boutiquePriceTTC)} />
                  <Row label="Marge BBG / jeu" value={fmt(calc.marginBoutiquePerUnit)} valueClass={calc.marginBoutiquePerUnit >= 0 ? 'text-green-600' : 'text-red-600'} />
                  <Row label="Total Achats Boutique HT" value={fmt(calc.totalAchatBoutiqueHT)} />
                  <Row label="Total Marge Boutique" value={fmt(calc.totalMarginBoutiqueHT)} valueClass={calc.totalMarginBoutiqueHT >= 0 ? 'text-green-700' : 'text-red-700'} />
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Distributeur */}
        <div className="border border-blue-200 rounded overflow-hidden">
          <div className="bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">Distributeur</div>
          <div className="p-2 space-y-1.5">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">Marge Distrib. %</span>
                <div className="flex items-center gap-0.5">
                  <NumInput value={scenario.distributeurAdditionalMarginPercent} step="1" min={0} onChange={v => update({ distributeurAdditionalMarginPercent: v })} />
                  <span className="text-gray-400">%</span>
                </div>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">% du tirage</span>
                <div className="flex items-center gap-0.5">
                  <NumInput
                    value={selectedQuote && selectedQuote.quantity > 0 ? Math.round(scenario.distributeurQty / selectedQuote.quantity * 1000) / 10 : 0}
                    step="1" min={0}
                    onChange={v => update({ distributeurQty: Math.round((selectedQuote?.quantity ?? 0) * v / 100) })}
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">Nb boîtes</span>
                <NumInput value={scenario.distributeurQty} step="1" min={0} onChange={v => update({ distributeurQty: Math.round(v) })} />
              </label>
            </div>
            {calc && (
              <table className="w-full">
                <tbody>
                  <Row label="Prix d'achat Distrib. HT" value={fmt(calc.distributeurPriceHT)} valueClass="text-blue-700" />
                  <Row label="Prix d'achat Distrib. TTC" value={fmt(calc.distributeurPriceTTC)} />
                  <Row label="Marge BBG / jeu" value={fmt(calc.marginDistributeurPerUnit)} valueClass={calc.marginDistributeurPerUnit >= 0 ? 'text-green-600' : 'text-red-600'} />
                  <Row label="Total Achats Distrib. HT" value={fmt(calc.totalAchatDistributeurHT)} />
                  <Row label="Total Marge Distrib." value={fmt(calc.totalMarginDistributeurHT)} valueClass={calc.totalMarginDistributeurHT >= 0 ? 'text-green-700' : 'text-red-700'} />
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* BBG Direct */}
        <div className="border border-green-200 rounded overflow-hidden">
          <div className="bg-green-100 px-2 py-1 text-xs font-bold text-green-800">BBG Direct</div>
          <div className="p-2 space-y-1.5">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">% du PVC HT</span>
                <div className="flex items-center gap-0.5">
                  <NumInput value={scenario.bbgSalePricePercent} step="1" min={0} onChange={v => update({ bbgSalePricePercent: v })} />
                  <span className="text-gray-400">%</span>
                </div>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">% du tirage</span>
                <div className="flex items-center gap-0.5">
                  <NumInput
                    value={selectedQuote && selectedQuote.quantity > 0 ? Math.round(scenario.bbgQty / selectedQuote.quantity * 1000) / 10 : 0}
                    step="1" min={0}
                    onChange={v => update({ bbgQty: Math.round((selectedQuote?.quantity ?? 0) * v / 100) })}
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">Nb boîtes</span>
                <NumInput value={scenario.bbgQty} step="1" min={0} onChange={v => update({ bbgQty: Math.round(v) })} />
              </label>
            </div>
            {calc && (
              <table className="w-full">
                <tbody>
                  <Row label="Prix de vente BBG HT" value={fmt(calc.bbgSalePriceHT)} valueClass="text-green-700" />
                  <Row label="Prix de vente BBG TTC" value={fmt(calc.bbgSalePriceTTC)} />
                  <Row label="Marge BBG / jeu" value={fmt(calc.marginBBGPerUnit)} valueClass={calc.marginBBGPerUnit >= 0 ? 'text-green-600' : 'text-red-600'} />
                  <Row label="Total Ventes BBG HT" value={fmt(calc.totalVentesBBGHT)} />
                  <Row label="Total Marge BBG" value={fmt(calc.totalMarginBBGHT)} valueClass={calc.totalMarginBBGHT >= 0 ? 'text-green-700' : 'text-red-700'} />
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invendus */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700">Invendus / Presse</div>
          <div className="p-2 space-y-1.5">
            {calc && selectedQuote && (
              <table className="w-full">
                <tbody>
                  <Row label={`Tirage total (${selectedQuote.quantity} unités)`} value={selectedQuote.quantity.toString()} />
                  <Row label="Vendus (Boutique + Distrib + BBG)" value={calc.totalSoldQty.toString()} valueClass="text-green-700" />
                  <Row
                    label="Invendus / Presse (auto)"
                    value={`${calc.unsoldQty} unités (${selectedQuote.quantity > 0 ? (calc.unsoldQty / selectedQuote.quantity * 100).toFixed(1) : 0}%)`}
                    valueClass={calc.unsoldQty < 0 ? 'text-red-600 font-bold' : 'text-gray-500'}
                  />
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* TOTALS */}
        {calc && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Total Ventes HT</span>
              <span className="font-bold text-yellow-800">{fmt(calc.totalVentesHT)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Total Ventes TTC</span>
              <span>{fmt(calc.totalVentesTTC)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Coût total ({selectedQuote?.quantity ?? 0} unités)</span>
              <span className="text-red-500">-{fmt(calc.totalCost)}</span>
            </div>
            <div className="border-t border-yellow-300 pt-1 flex justify-between text-sm">
              <span className="font-medium text-gray-700">Total Marge HT</span>
              <span className={`font-bold text-base ${calc.totalMarginHT >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {fmt(calc.totalMarginHT)}
              </span>
            </div>

            {/* Droits Auteur */}
            <div className="border-t border-yellow-300 pt-2 mt-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Droits Auteur</span>
                <div className="flex items-center gap-1">
                  <NumInput
                    value={scenario.authorRoyaltyPercent}
                    step="0.5"
                    min={0}
                    className="w-14 text-right"
                    onChange={v => update({ authorRoyaltyPercent: v })}
                  />
                  <span className="text-gray-400">% PVC HT</span>
                </div>
              </div>
              {scenario.authorRoyaltyPercent > 0 && (
                <div className="flex justify-between text-xs text-red-600 pl-2">
                  <span>= {calc.totalSoldQty} vendus × {fmt(scenario.pvcHT)} × {scenario.authorRoyaltyPercent}%</span>
                  <span className="font-medium">-{fmt(calc.authorRoyaltyTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-yellow-300">
                <span className={scenario.authorRoyaltyPercent > 0 ? 'text-gray-700' : 'text-gray-400'}>
                  Marge Finale après Droits
                </span>
                <span className={calc.totalMarginMinusAuthor >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {fmt(calc.totalMarginMinusAuthor)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TabVentes({ game }: { game: Game }) {
  const { addSalesScenario } = useGameStore();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Scénarios de Vente</h2>
        <button
          className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold text-sm px-3 py-1.5 rounded transition-colors"
          onClick={() => addSalesScenario(game.id)}
          disabled={game.factoryQuotes.length === 0}
          title={game.factoryQuotes.length === 0 ? 'Ajoutez d\'abord un devis d\'usine' : ''}
        >
          <Plus size={14} />
          Ajouter Scénario
        </button>
      </div>

      {game.factoryQuotes.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          Ajoutez d'abord un devis d'usine dans l'onglet "Fabrication".
        </div>
      )}

      {game.salesScenarios.length === 0 && game.factoryQuotes.length > 0 && (
        <div className="text-center text-gray-400 py-12">
          Cliquez sur "Ajouter Scénario" pour créer un scénario de vente.
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {game.salesScenarios.map(scenario => (
          <ScenarioCard key={scenario.id} game={game} scenario={scenario} />
        ))}
      </div>
    </div>
  );
}
