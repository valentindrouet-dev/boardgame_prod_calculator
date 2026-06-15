import { useState } from 'react';
import { Plus, Trash2, Gamepad2 } from 'lucide-react';
import { useGameStore } from '../../store';

export function Sidebar() {
  const { games, activeGameId, setActiveGame, addGame, removeGame } = useGameStore();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    if (!newName.trim()) return;
    addGame(newName.trim());
    setNewName('');
    setAdding(false);
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Gamepad2 className="text-yellow-400" size={22} />
          <span className="font-bold text-lg">BBG Calculator</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Production de jeux de société</p>
      </div>

      <div className="flex-1 overflow-auto py-2">
        {games.map(game => (
          <div
            key={game.id}
            className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
              game.id === activeGameId ? 'bg-gray-700 border-l-4 border-yellow-400' : 'hover:bg-gray-800'
            }`}
            onClick={() => setActiveGame(game.id)}
          >
            <span className="text-sm font-medium truncate">{game.name}</span>
            <button
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
              onClick={(e) => { e.stopPropagation(); removeGame(game.id); }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700">
        {adding ? (
          <div className="space-y-2">
            <input
              autoFocus
              className="w-full bg-gray-700 text-white text-sm px-2 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-yellow-400"
              placeholder="Nom du jeu..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 bg-yellow-400 text-gray-900 text-xs font-bold py-1.5 rounded hover:bg-yellow-300 transition-colors"
                onClick={handleAdd}
              >
                Créer
              </button>
              <button
                className="flex-1 bg-gray-700 text-gray-300 text-xs py-1.5 rounded hover:bg-gray-600 transition-colors"
                onClick={() => setAdding(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-bold text-sm py-2 rounded hover:bg-yellow-300 transition-colors"
            onClick={() => setAdding(true)}
          >
            <Plus size={16} />
            Nouveau Jeu
          </button>
        )}
      </div>
    </aside>
  );
}
