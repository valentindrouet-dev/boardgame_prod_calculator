import { useState } from 'react';
import { useGameStore } from './store';
import { Sidebar } from './components/layout/Sidebar';
import { GameDetail } from './components/games/GameDetail';
import { LinksLibrary } from './components/links/LinksLibrary';
import { HomePage } from './components/home/HomePage';

export type ActivePage = 'home' | 'game' | 'links';

export default function App() {
  const { games, activeGameId, setActiveGame } = useGameStore();
  const activeGame = games.find(g => g.id === activeGameId);
  const [activePage, setActivePage] = useState<ActivePage>('home');

  function handleOpenGame(id: string) {
    setActiveGame(id);
    setActivePage('game');
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onOpenGame={handleOpenGame} />
      <main className="flex-1 overflow-auto">
        {activePage === 'home' && <HomePage onOpenGame={handleOpenGame} />}
        {activePage === 'links' && <LinksLibrary />}
        {activePage === 'game' && (
          activeGame
            ? <GameDetail game={activeGame} />
            : <div className="flex items-center justify-center h-full text-gray-400 text-xl">Sélectionnez ou créez un jeu</div>
        )}
      </main>
    </div>
  );
}
