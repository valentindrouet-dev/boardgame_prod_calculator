import { useState } from 'react';
import { Download, FileJson, Settings, ArrowLeftRight } from 'lucide-react';
import type { Game } from '../../types';
import { useGameStore } from '../../store';
import { exportJSON, exportPDF } from '../../utils/export';
import { TabDevelopment } from '../tabs/TabDevelopment';
import { TabFabrication } from '../tabs/TabFabrication';
import { TabCommunication } from '../tabs/TabCommunication';
import { TabResume } from '../tabs/TabResume';
import { TabVentes } from '../tabs/TabVentes';
import { TabComposants } from '../tabs/TabComposants';

const TABS = ['Résumé', 'Composants', 'Développement', 'Fabrication', 'Communication', 'Ventes'] as const;
type Tab = typeof TABS[number];

function HTTCConverter({ vatRate }: { vatRate: number }) {
  const [ht, setHt] = useState('');
  const [ttc, setTtc] = useState('');
  const mult = 1 + vatRate / 100;

  function fromHT(val: string) {
    setHt(val);
    const n = parseFloat(val);
    setTtc(isNaN(n) ? '' : (n * mult).toFixed(2));
  }

  function fromTTC(val: string) {
    setTtc(val);
    const n = parseFloat(val);
    setHt(isNaN(n) ? '' : (n / mult).toFixed(2));
  }

  return (
    <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded text-sm">
      <span className="text-gray-300 text-xs">HT↔TTC</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.01"
          placeholder="HT"
          value={ht}
          onChange={e => fromHT(e.target.value)}
          className="w-20 bg-gray-600 text-white px-1.5 py-0.5 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-yellow-400 placeholder-gray-400"
        />
        <span className="text-gray-400 text-xs">€ HT</span>
      </div>
      <ArrowLeftRight size={12} className="text-yellow-400 flex-shrink-0" />
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.01"
          placeholder="TTC"
          value={ttc}
          onChange={e => fromTTC(e.target.value)}
          className="w-20 bg-gray-600 text-white px-1.5 py-0.5 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-yellow-400 placeholder-gray-400"
        />
        <span className="text-gray-400 text-xs">€ TTC</span>
      </div>
      <span className="text-gray-500 text-xs">(TVA {vatRate}%)</span>
    </div>
  );
}

export function GameDetail({ game }: { game: Game }) {
  const [tab, setTab] = useState<Tab>('Résumé');
  const { updateGame } = useGameStore();
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(game.name);

  function saveName() {
    if (nameVal.trim()) updateGame(game.id, { name: nameVal.trim() });
    setEditName(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {editName ? (
            <input
              autoFocus
              className="bg-gray-700 text-white font-bold text-xl px-2 py-1 rounded border border-yellow-400 focus:outline-none"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false); }}
            />
          ) : (
            <h1
              className="text-xl font-bold text-yellow-400 cursor-pointer hover:text-yellow-300"
              onClick={() => { setNameVal(game.name); setEditName(true); }}
              title="Cliquer pour renommer"
            >
              {game.name}
            </h1>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Settings size={12} />
            <span>TVA</span>
            <input
              type="number"
              className="bg-gray-700 text-white w-12 px-1 py-0.5 rounded text-xs"
              value={game.vatRate}
              min={0} max={100} step={0.1}
              onChange={e => updateGame(game.id, { vatRate: parseFloat(e.target.value) || 0 })}
            />
            <span>%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <HTTCConverter vatRate={game.vatRate} />
          <button
            className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-sm px-3 py-1.5 rounded transition-colors"
            onClick={() => exportJSON(game)}
          >
            <FileJson size={14} />
            JSON
          </button>
          <button
            className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold text-sm px-3 py-1.5 rounded transition-colors"
            onClick={() => exportPDF(game)}
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              tab === t
                ? 'border-yellow-400 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'Composants' ? (
              <span className="flex items-center gap-1.5">
                Composants
                {(game.gameComponents ?? []).length > 0 && (
                  <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                    {(game.gameComponents ?? []).length}
                  </span>
                )}
              </span>
            ) : t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === 'Résumé' && <TabResume game={game} />}
        {tab === 'Composants' && <TabComposants game={game} />}
        {tab === 'Développement' && <TabDevelopment game={game} />}
        {tab === 'Fabrication' && <TabFabrication game={game} />}
        {tab === 'Communication' && <TabCommunication game={game} />}
        {tab === 'Ventes' && <TabVentes game={game} />}
      </div>
    </div>
  );
}
