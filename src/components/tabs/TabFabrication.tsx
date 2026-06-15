import { Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { Game, FactoryQuote } from '../../types';
import { useGameStore } from '../../store';
import {
  calcFabPerUnitEUR, calcFabTotalHT, calcFabToolingEUR, calcFabComponentsPerUnitEUR,
  calcLogisticsSubtotalHT, calcLogisticsTotalHT,
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
  const { updateFactoryQuote, removeFactoryQuote, addComponent, updateComponent, removeComponent, moveComponent } = useGameStore();
  const [expanded, setExpanded] = useState(true);

  const update = (patch: Partial<FactoryQuote>) => updateFactoryQuote(game.id, quote.id, patch);

  const fabPerUnit = calcFabPerUnitEUR(quote);
  const fabPerUnitTTC = fabPerUnit * (1 + game.vatRate / 100);
  const fabTotal = calcFabTotalHT(quote);
  const fabTotalTTC = fabTotal * (1 + game.vatRate / 100);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
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
        <div className="p-4">
          {/* Parameters */}
          <div className="flex gap-6 bg-gray-50 p-3 rounded text-sm mb-4">
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

          {/* Components table */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700 text-sm">Composants de Fabrication</h3>
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
                <th className="px-2 py-1.5 text-left w-24">Taille</th>
                <th className="px-2 py-1.5 text-left">Description</th>
                <th className="px-2 py-1.5 text-center w-16">Qté</th>
                <th className="px-2 py-1.5 text-right w-28">Prix $ (unit.)</th>
                <th className="px-2 py-1.5 text-right w-28">Prix HT €</th>
                <th className="px-2 py-1.5 text-right w-28">Prix TTC €</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {quote.components.map((comp, idx) => {
                const active = !comp.disabled;
                const priceEUR = active ? comp.priceUSD * comp.quantity * quote.dollarToEuroRate : 0;
                const priceTTC = priceEUR * (1 + game.vatRate / 100);
                const rowBase = active ? (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') : 'bg-gray-100 opacity-50';
                return (
                  <tr key={comp.id} className={`border-b border-gray-100 ${rowBase}`}>
                    <td className="px-2 py-1">
                      <input
                        type="text" value={comp.name} placeholder="Nom..."
                        onChange={e => updateComponent(game.id, quote.id, comp.id, { name: e.target.value })}
                        className={`w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400 ${!active ? 'line-through text-gray-400' : ''}`}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text" value={comp.size ?? ''} placeholder="ex: 63×88mm"
                        onChange={e => updateComponent(game.id, quote.id, comp.id, { size: e.target.value })}
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400 text-gray-500"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text" value={comp.description ?? ''} placeholder="Description..."
                        onChange={e => updateComponent(game.id, quote.id, comp.id, { description: e.target.value })}
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400 text-gray-500"
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
                    <td className="px-2 py-1 text-right font-medium text-amber-700">{active ? fmt(priceEUR) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-2 py-1 text-right text-amber-600">{active ? fmt(priceTTC) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-0.5">
                        <button
                          title={active ? 'Désactiver (exclure du calcul)' : 'Activer'}
                          className={`${active ? 'text-gray-400 hover:text-gray-700' : 'text-red-400 hover:text-red-600'}`}
                          onClick={() => updateComponent(game.id, quote.id, comp.id, { disabled: !comp.disabled })}
                        >{active ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                        <button
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          onClick={() => moveComponent(game.id, quote.id, comp.id, 'up')}
                          disabled={idx === 0}
                        ><ChevronUp size={13} /></button>
                        <button
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          onClick={() => moveComponent(game.id, quote.id, comp.id, 'down')}
                          disabled={idx === quote.components.length - 1}
                        ><ChevronDown size={13} /></button>
                        <button
                          className="text-red-400 hover:text-red-600 ml-0.5"
                          onClick={() => removeComponent(game.id, quote.id, comp.id)}
                        ><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal / margin row */}
              {(() => {
                const compSubtotal = quote.components.reduce((s, c) => s + c.priceUSD * c.quantity * quote.dollarToEuroRate, 0);
                const compPerUnit = calcFabComponentsPerUnitEUR(quote);
                const toolingEUR = calcFabToolingEUR(quote);
                return (
                  <>
                    <tr className="bg-amber-50 text-xs italic text-gray-600 border-t border-amber-200">
                      <td className="px-2 py-1" colSpan={4}>
                        Marge d'Incertitude {quote.uncertaintyMarginPercent}%
                      </td>
                      <td className="px-2 py-1 text-right">{fmt(compPerUnit - compSubtotal)}</td>
                      <td className="px-2 py-1 text-right">{fmt((compPerUnit - compSubtotal) * (1 + game.vatRate / 100))}</td>
                      <td></td>
                      <td></td>
                    </tr>

                    {/* Tooling row */}
                    <tr className="bg-orange-50 border-t border-orange-200 text-xs">
                      <td className="px-2 py-1.5 font-semibold text-orange-800" colSpan={3}>
                        Outillage / Tooling (coût unique, non multiplié)
                      </td>
                      <td></td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number" step="1" min="0"
                            value={quote.toolingUSD || ''}
                            onChange={e => update({ toolingUSD: parseFloat(e.target.value) || 0 })}
                            className="w-24 px-1 py-0.5 border border-orange-200 rounded text-right text-sm focus:outline-none focus:border-orange-400"
                            placeholder="0"
                          />
                          <span className="text-gray-400 text-xs">USD</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium text-orange-700">{fmt(toolingEUR)}</td>
                      <td className="px-2 py-1.5 text-right text-orange-600">{fmt(toolingEUR * (1 + game.vatRate / 100))}</td>
                      <td></td>
                    </tr>

                    <tr className="bg-amber-100 font-bold text-sm border-t border-amber-300">
                      <td className="px-2 py-1.5" colSpan={4}>TOTAL Fabrication / unité (amorti)</td>
                      <td className="px-2 py-1.5 text-right text-amber-800">{fmt(fabPerUnit)}</td>
                      <td className="px-2 py-1.5 text-right text-amber-700">{fmt(fabPerUnitTTC)}</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr className="bg-amber-200 font-bold text-sm">
                      <td className="px-2 py-1.5" colSpan={4}>TOTAL Fabrication ({quote.quantity.toLocaleString('fr-FR')} unités)</td>
                      <td className="px-2 py-1.5 text-right text-amber-900">{fmt(fabTotal)}</td>
                      <td className="px-2 py-1.5 text-right text-amber-800">{fmt(fabTotalTTC)}</td>
                      <td></td>
                      <td></td>
                    </tr>
                    {/* USD subtotal info */}
                    <tr className="bg-gray-50 text-xs text-gray-400">
                      <td className="px-2 py-1" colSpan={8}>
                        Sous-total USD composants actifs : {fmtUSD(quote.components.filter(c => !c.disabled).reduce((s, c) => s + c.priceUSD * c.quantity, 0))} · Taux : {quote.dollarToEuroRate}
                        {quote.components.some(c => c.disabled) && <span className="ml-2 text-red-300">({quote.components.filter(c => c.disabled).length} composant(s) désactivé(s))</span>}
                      </td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LogisticsSection({ game }: { game: Game }) {
  const { addLogisticsItem, updateLogisticsItem, removeLogisticsItem, moveLogisticsItem, updateGame } = useGameStore();

  const logSubtotal = calcLogisticsSubtotalHT(game);
  const logTotal = calcLogisticsTotalHT(game);
  const logTotalTTC = logTotal * (1 + game.vatRate / 100);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="bg-green-800 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-bold">Transport &amp; Logistique</h3>
          <span className="text-green-300 text-xs">— commun à toutes les usines</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm text-green-200 italic">
            Marge Sécurité
            <input
              type="number" step="1" min="0" max="100"
              value={game.logisticsSafetyMarginPercent ?? 20}
              onChange={e => updateGame(game.id, { logisticsSafetyMarginPercent: parseFloat(e.target.value) || 0 })}
              className="w-14 bg-green-700 text-white px-1 py-0.5 rounded text-right text-sm border border-green-600 focus:outline-none focus:border-yellow-400"
            />
            %
          </label>
          <button
            className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded transition-colors"
            onClick={() => addLogisticsItem(game.id)}
          >
            <Plus size={12} />
            Poste
          </button>
        </div>
      </div>

      <div className="p-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-green-100 text-xs text-green-900">
              <th className="px-2 py-1.5 text-left">Poste</th>
              <th className="px-2 py-1.5 text-left">Description</th>
              <th className="px-2 py-1.5 text-right w-28">Prix HT</th>
              <th className="px-2 py-1.5 text-right w-28">Prix TTC</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {(game.logistics ?? []).map((item, idx) => (
              <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-2 py-1">
                  <input
                    type="text" value={item.name} placeholder="Poste..."
                    onChange={e => updateLogisticsItem(game.id, item.id, { name: e.target.value })}
                    className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text" value={item.description} placeholder="Détail..."
                    onChange={e => updateLogisticsItem(game.id, item.id, { description: e.target.value })}
                    className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
                  />
                </td>
                <td className="px-2 py-1">
                  <NumInput value={item.priceHT} onChange={v => updateLogisticsItem(game.id, item.id, { priceHT: v })} />
                </td>
                <td className="px-2 py-1 text-right text-green-700 font-medium">
                  {fmt(item.priceHT * (1 + game.vatRate / 100))}
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-0.5">
                    <button
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      onClick={() => moveLogisticsItem(game.id, item.id, 'up')}
                      disabled={idx === 0}
                    ><ChevronUp size={13} /></button>
                    <button
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      onClick={() => moveLogisticsItem(game.id, item.id, 'down')}
                      disabled={idx === (game.logistics ?? []).length - 1}
                    ><ChevronDown size={13} /></button>
                    <button
                      className="text-red-400 hover:text-red-600 ml-0.5"
                      onClick={() => removeLogisticsItem(game.id, item.id)}
                    ><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}

            {(game.logistics ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-gray-400 text-sm">
                  Cliquez sur "+ Poste" pour ajouter un poste logistique
                </td>
              </tr>
            )}

            <tr className="bg-green-50 text-xs italic text-gray-600 border-t border-green-200">
              <td className="px-2 py-1" colSpan={2}>Marge Sécurité {game.logisticsSafetyMarginPercent ?? 20}%</td>
              <td className="px-2 py-1 text-right">{fmt(logTotal - logSubtotal)}</td>
              <td className="px-2 py-1 text-right">{fmt((logTotal - logSubtotal) * (1 + game.vatRate / 100))}</td>
              <td></td>
            </tr>
            <tr className="bg-green-200 font-bold text-sm">
              <td className="px-2 py-1.5" colSpan={2}>TOTAL Transport</td>
              <td className="px-2 py-1.5 text-right text-green-900">{fmt(logTotal)}</td>
              <td className="px-2 py-1.5 text-right text-green-800">{fmt(logTotalTTC)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {/* Per-unit breakdown for each factory quote */}
        {game.factoryQuotes.length > 0 && (
          <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(game.factoryQuotes.length, 4)}, 1fr)` }}>
            {game.factoryQuotes.map(q => (
              <div key={q.id} className="bg-green-50 border border-green-200 rounded px-3 py-2 text-xs">
                <div className="font-semibold text-green-800">{q.factoryName} ({q.quantity.toLocaleString('fr-FR')} u.)</div>
                <div className="text-green-700 mt-0.5">
                  {q.quantity > 0 ? `${fmt(logTotal / q.quantity)} / unité HT` : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
        <p className="text-gray-400 text-center py-8">
          Aucun devis d'usine. Cliquez sur "Ajouter Usine" pour commencer.
        </p>
      )}

      {game.factoryQuotes.map(quote => (
        <QuoteCard key={quote.id} game={game} quote={quote} />
      ))}

      <div className="mt-2">
        <LogisticsSection game={game} />
      </div>
    </div>
  );
}
