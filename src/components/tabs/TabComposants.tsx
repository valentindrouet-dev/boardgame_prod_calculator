import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Game, GameComponent } from '../../types';
import { useGameStore } from '../../store';

const CATEGORIES = [
  'Cartes', 'Plateaux', 'Tuiles', 'Jetons/Tokens', 'Dés',
  'Figurines/Meeples', 'Marqueurs', 'Règles', 'Boîte', 'Insert',
  'Illustrations', 'Design', 'Autre'
];

function ProgressBar({ value }: { value: number }) {
  const color =
    value === 100 ? 'bg-green-500' :
    value >= 75 ? 'bg-blue-500' :
    value >= 50 ? 'bg-yellow-400' :
    value >= 25 ? 'bg-orange-400' :
    'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold w-9 text-right">{value}%</span>
    </div>
  );
}

function StatusBadge({ value }: { value: number }) {
  if (value === 100) return <span className="px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">✓ Terminé</span>;
  if (value >= 75) return <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">En cours</span>;
  if (value >= 25) return <span className="px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">Démarré</span>;
  if (value > 0) return <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-medium">Début</span>;
  return <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 font-medium">Non démarré</span>;
}

export function TabComposants({ game }: { game: Game }) {
  const { addGameComponent, updateGameComponent, removeGameComponent } = useGameStore();
  const [sortField, setSortField] = useState<'name' | 'category' | 'progress'>('category');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterCat, setFilterCat] = useState('');

  const components = game.gameComponents ?? [];

  const filtered = components
    .filter(c => !filterCat || c.category === filterCat)
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else cmp = a.progressPercent - b.progressPercent;
      return sortAsc ? cmp : -cmp;
    });

  const totalDone = components.filter(c => c.progressPercent === 100).length;
  const avgProgress = components.length > 0
    ? Math.round(components.reduce((s, c) => s + c.progressPercent, 0) / components.length)
    : 0;

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Composants du jeu</h2>
          {components.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {totalDone}/{components.length} terminés · Avancement global moyen : <span className="font-semibold">{avgProgress}%</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold text-sm px-3 py-1.5 rounded transition-colors"
            onClick={() => addGameComponent(game.id)}
          >
            <Plus size={14} />
            Ajouter composant
          </button>
        </div>
      </div>

      {/* Global progress bar */}
      {components.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Avancement global</span>
            <span className="text-lg font-bold text-gray-800">{avgProgress}%</span>
          </div>
          <ProgressBar value={avgProgress} />
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            {[
              { label: 'Non démarré', color: 'bg-red-400', count: components.filter(c => c.progressPercent === 0).length },
              { label: 'Début (1–24%)', color: 'bg-orange-400', count: components.filter(c => c.progressPercent > 0 && c.progressPercent < 25).length },
              { label: 'En cours (25–74%)', color: 'bg-yellow-400', count: components.filter(c => c.progressPercent >= 25 && c.progressPercent < 75).length },
              { label: 'Avancé (75–99%)', color: 'bg-blue-500', count: components.filter(c => c.progressPercent >= 75 && c.progressPercent < 100).length },
              { label: 'Terminé', color: 'bg-green-500', count: totalDone },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span>{s.label} ({s.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {components.length === 0 ? (
          <p className="text-gray-400 text-center py-12 text-sm">
            Aucun composant. Cliquez sur "Ajouter composant" pour commencer.
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-700 text-white text-xs">
                <th
                  className="px-3 py-2 text-left cursor-pointer hover:bg-gray-600 select-none"
                  onClick={() => toggleSort('name')}
                >
                  Composant <SortIcon field="name" />
                </th>
                <th
                  className="px-3 py-2 text-left w-36 cursor-pointer hover:bg-gray-600 select-none"
                  onClick={() => toggleSort('category')}
                >
                  Catégorie <SortIcon field="category" />
                </th>
                <th
                  className="px-3 py-2 text-center w-48 cursor-pointer hover:bg-gray-600 select-none"
                  onClick={() => toggleSort('progress')}
                >
                  Avancement <SortIcon field="progress" />
                </th>
                <th className="px-3 py-2 text-center w-28">Statut</th>
                <th className="px-3 py-2 text-left w-48">Notes</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comp, idx) => (
                <ComponentRow
                  key={comp.id}
                  comp={comp}
                  idx={idx}
                  gameId={game.id}
                  onUpdate={(patch) => updateGameComponent(game.id, comp.id, patch)}
                  onRemove={() => removeGameComponent(game.id, comp.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ComponentRow({
  comp, idx, gameId: _gameId, onUpdate, onRemove
}: {
  comp: GameComponent;
  idx: number;
  gameId: string;
  onUpdate: (patch: Partial<GameComponent>) => void;
  onRemove: () => void;
}) {
  const [localProgress, setLocalProgress] = useState(comp.progressPercent);

  return (
    <tr className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
      <td className="px-3 py-2">
        <input
          type="text"
          value={comp.name}
          placeholder="Nom du composant..."
          onChange={e => onUpdate({ name: e.target.value })}
          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={comp.category}
          onChange={e => onUpdate({ category: e.target.value })}
          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400 bg-white"
        >
          <option value="">—</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <div className="space-y-1.5">
          <ProgressBar value={localProgress} />
          <input
            type="range"
            min={0} max={100} step={5}
            value={localProgress}
            onChange={e => setLocalProgress(parseInt(e.target.value))}
            onMouseUp={e => onUpdate({ progressPercent: parseInt((e.target as HTMLInputElement).value) })}
            onTouchEnd={e => onUpdate({ progressPercent: parseInt((e.target as HTMLInputElement).value) })}
            className="w-full h-1.5 accent-yellow-400 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400">
            {[0, 25, 50, 75, 100].map(v => (
              <button
                key={v}
                className={`px-1 py-0.5 rounded text-xs transition-colors ${localProgress === v ? 'bg-yellow-400 text-gray-900 font-bold' : 'hover:bg-gray-200'}`}
                onClick={() => { setLocalProgress(v); onUpdate({ progressPercent: v }); }}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <StatusBadge value={comp.progressPercent} />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={comp.notes}
          placeholder="Notes..."
          onChange={e => onUpdate({ notes: e.target.value })}
          className="w-full px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-yellow-400"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <button className="text-red-400 hover:text-red-600 transition-colors" onClick={onRemove}>
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}
