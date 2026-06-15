import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Game, FactoryQuote } from '../../types';
import { useGameStore } from '../../store';
import {
  calcFabPerUnitEUR, calcFabTotalHT,
  calcLogisticsSubtotalHT, calcLogisticsTotalHT, calcLogisticsPerUnit,
  fmt, fmtUSD
} from '../../utils/calculations';

function NumInput({ value, onChange, step = '0.01', className = '' }: {
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

function QuoteCard({ game, quote }: { game: Game; quote: FactoryQuote }) {
  const { updateFactoryQuote, removeFactoryQuote, addComponent, updateComponent, removeComponent, addLogisticsItem, updateLogisticsItem, removeLogisticsItem } = useGameStore();
  const [expanded, setExpanded] = useState(true);

  const update = (patch: Partial<FactoryQuote>) => updateFactoryQuote(game.id, quote.id, patch);

  const compSubtotalEUR = quote.components.reduce((s, c) => s + c.priceUSD * c.quantity * quote.dollarToEuroRate, 0);
  const fabPerUnit = calcFabPerUnitEUR(quote);
  const fabTotal = calcFabTotalHT(quote);
  const logSubtotal = calcLogisticsSubtotalHT(quote);
  const logTotal = calcLogisticsTotalHT(quote);
  const logPerUnit = calcLogisticsPerUnit(quote);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
      {/* Quote header */}
      <div className="bg-gray-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            className="bg-gray-600 text-white font-bold text-base px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-yellow-400 w-40"
            value={quote.factoryName}
            onChange={e => update({ factoryName: e.target.value })}
          />
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-300">Quantité :</span>
            <input
              type="number"
              className="bg-gray-600 text-white w-20 px-1 py-0.5 rounded text-right text-sm border border-gray-500 focus:outline-none focus:border-yellow-400"
              value={quote.quantity || ''}
              onChange={e => update({ quantity: parseInt(e.target.value) || 0 })}
            />
            <span className="text-gray-300">unités</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-300 hover:text-white" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button className="text-red-400 hover:text-red-300" onClick={() => removeFactoryQuote(game.id, quote.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-6">
          {/* Parameters */}
          <div className="flex gap-6 bg-gray-50 p-3 rounded text-sm">
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Taux $ → €</span>
              <input
                type="number" step="0.001"
                value={quote.dollarToEuroRate || ''}
                onChange={e => update({ dollarToEuroRate: parseFloat(e.target.value) || 0 })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-600 italic">Marge d'Incertitude</span>
              <input
                type="number" step="1" min="0" max="100"
                value={quote.uncertaintyMarginPercent || ''}
                onChange={e => update({ uncertaintyMarginPercent: parseFloat(e.target.value) || 0 })}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
              />
              <span className="text-gray-600">%</span>
            </label>
          </div>

          {/* Manufacturing components */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Composants de Fabrication</h3>
              <button
                className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                onClick={() => addComponent(game.id, quote.id)}
              >
                <Plus size={12} />
                Composant
              </button>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-amber-100 text-xs text-amber-900">
                  <th className="px-2 py-1.5 text-left">Composant</th>
                  <th className="px-2 py-1.5 text-center w-16">Qté</th>
                  <th className="px-2 py-1.5 text-right w-28">Prix $ (total)</th>
                  <th className="px-2 py-1.5 text-right w-28">Prix € (total)</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {quote.components.map((comp, idx) => (
                  <tr key={comp.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-2 py-1">
                      <input
                        type="text" value={comp.name} placeholder="Nom..."
                        onChange={e => updateComponent(game.id, quote.id, comp.id, { name: e.target.value })}
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <NumInput value={comp.quantity} step="1" onChange={v => updateComponent(game.id, quote.id, comp.id, { quantity: v })} />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        defaultValue={comp.priceUSD || ''}
                        key={comp.id + '-price'}
                        onBlur={e => updateComponent(game.id, quote.id, comp.id, { priceUSD: parseFloat(e.target.value) || 0 })}
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </td>
                    <td className="px-2 py-1 text-right font-medium text-amber-700">
                      {fmt(comp.priceUSD * comp.quantity * quote.dollarToEuroRate)}
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        className="text-red-400 hover:text-red-600"
                        onClick={() => removeComponent(game.id, quote.id, comp.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Sous-total */}
                <tr className="bg-amber-50 text-xs italic text-gray-600 border-t border-amber-200">
                  <td className="px-2 py-1" colSpan={3}>
                    Marge d'Incertitude {quote.uncertaintyMarginPercent}%
                  </td>
                  <td className="px-2 py-1 text-right">{fmt(fabPerUnit - compSubtotalEUR)}</td>
                  <td></td>
                </tr>
                <tr className="bg-amber-100 font-bold text-sm border-t border-amber-300">
                  <td className="px-2 py-1.5" colSpan={2}>TOTAL Fabrication / unité</td>
                  <td className="px-2 py-1.5 text-right text-xs text-gray-500">{fmtUSD(quote.components.reduce((s,c) => s + c.priceUSD * c.quantity, 0))}</td>
                  <td className="px-2 py-1.5 text-right text-amber-800">{fmt(fabPerUnit)}</td>
                  <td></td>
                </tr>
                <tr className="bg-amber-200 font-bold text-sm">
                  <td className="px-2 py-1.5" colSpan={2}>TOTAL Fabrication ({quote.quantity} unités)</td>
                  <td colSpan={2} className="px-2 py-1.5 text-right text-amber-900">{fmt(fabTotal)}</td>

                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Logistics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Transport & Logistique</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-gray-600 italic">
                  Marge Sécurité
                  <input
                    type="number" step="1" min="0" max="100"
                    value={quote.logisticsSafetyMarginPercent || ''}
                    onChange={e => update({ logisticsSafetyMarginPercent: parseFloat(e.target.value) || 0 })}
                    className="w-14 px-1 py-0.5 border border-gray-300 rounded text-right text-xs focus:outline-none focus:border-yellow-400"
                  />
                  %
                </label>
                <button
                  className="flex items-center gap-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                  onClick={() => addLogisticsItem(game.id, quote.id)}
                >
                  <Plus size={12} />
                  Poste
                </button>
              </div>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-100 text-xs text-green-900">
                  <th className="px-2 py-1.5 text-left">Poste</th>
                  <th className="px-2 py-1.5 text-left">Description</th>
                  <th className="px-2 py-1.5 text-right w-28">Prix HT</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {quote.logistics.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-2 py-1">
                      <input
                        type="text" value={item.name} placeholder="Poste..."
                        onChange={e => updateLogisticsItem(game.id, quote.id, item.id, { name: e.target.value })}
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text" value={item.description} placeholder="Détail..."
                        onChange={e => updateLogisticsItem(game.id, quote.id, item.id, { description: e.target.value })}
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <NumInput value={item.priceHT} onChange={v => updateLogisticsItem(game.id, quote.id, item.id, { priceHT: v })} />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        className="text-red-400 hover:text-red-600"
                        onClick={() => removeLogisticsItem(game.id, quote.id, item.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-green-50 text-xs italic text-gray-600 border-t border-green-200">
                  <td className="px-2 py-1" colSpan={2}>Marge Sécurité {quote.logisticsSafetyMarginPercent}%</td>
                  <td className="px-2 py-1 text-right">{fmt(logTotal - logSubtotal)}</td>
                  <td></td>
                </tr>
                <tr className="bg-green-100 text-xs text-gray-600 border-t border-green-200">
                  <td className="px-2 py-1" colSpan={2}>TOTAL Transport / unité</td>
                  <td className="px-2 py-1 text-right font-medium">{fmt(logPerUnit)}</td>
                  <td></td>
                </tr>
                <tr className="bg-green-200 font-bold text-sm">
                  <td className="px-2 py-1.5" colSpan={2}>TOTAL Transport</td>
                  <td className="px-2 py-1.5 text-right text-green-900">{fmt(logTotal)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function TabFabrication({ game }: { game: Game }) {
  const { addFactoryQuote } = useGameStore();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Fabrication</h2>
        <button
          className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold text-sm px-3 py-1.5 rounded transition-colors"
          onClick={() => addFactoryQuote(game.id)}
        >
          <Plus size={14} />
          Ajouter Usine
        </button>
      </div>

      {game.factoryQuotes.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          Aucun devis d'usine. Cliquez sur "Ajouter Usine" pour commencer.
        </p>
      )}

      {game.factoryQuotes.map(quote => (
        <QuoteCard key={quote.id} game={game} quote={quote} />
      ))}
    </div>
  );
}
