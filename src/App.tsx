import { useGameStore } from './store';
import { Sidebar } from './components/layout/Sidebar';
import { GameDetail } from './components/games/GameDetail';

export default function App() {
  const { games, activeGameId } = useGameStore();
  const activeGame = games.find(g => g.id === activeGameId);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {activeGame ? (
          <GameDetail game={activeGame} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-xl">
            Sélectionnez ou créez un jeu
          </div>
        )}
      </main>
    </div>
  );
}
