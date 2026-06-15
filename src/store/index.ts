import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Game, DevelopmentItem, FactoryQuote, ManufacturingComponent, LogisticsItem, CommunicationItem, SalesScenario, GameComponent } from '../types';

function uid(): string {
  return crypto.randomUUID();
}

function move<T>(arr: T[], id: string, direction: 'up' | 'down', key: keyof T = 'id' as keyof T): T[] {
  const idx = arr.findIndex(item => (item[key] as unknown as string) === id);
  if (idx === -1) return arr;
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= arr.length) return arr;
  const result = [...arr];
  [result[idx], result[newIdx]] = [result[newIdx], result[idx]];
  return result;
}

interface GameStore {
  games: Game[];
  activeGameId: string | null;
  setActiveGame: (id: string) => void;
  addGame: (name: string) => void;
  removeGame: (id: string) => void;
  updateGame: (id: string, patch: Partial<Omit<Game, 'id' | 'createdAt'>>) => void;

  // Development
  addDevItem: (gameId: string) => void;
  updateDevItem: (gameId: string, itemId: string, patch: Partial<DevelopmentItem>) => void;
  removeDevItem: (gameId: string, itemId: string) => void;
  moveDevItem: (gameId: string, itemId: string, direction: 'up' | 'down') => void;

  // Factory Quotes
  addFactoryQuote: (gameId: string) => void;
  updateFactoryQuote: (gameId: string, quoteId: string, patch: Partial<FactoryQuote>) => void;
  removeFactoryQuote: (gameId: string, quoteId: string) => void;

  // Manufacturing Components
  addComponent: (gameId: string, quoteId: string) => void;
  updateComponent: (gameId: string, quoteId: string, compId: string, patch: Partial<ManufacturingComponent>) => void;
  removeComponent: (gameId: string, quoteId: string, compId: string) => void;
  moveComponent: (gameId: string, quoteId: string, compId: string, direction: 'up' | 'down') => void;

  // Logistics (game-level, independent of factory quote)
  addLogisticsItem: (gameId: string) => void;
  updateLogisticsItem: (gameId: string, itemId: string, patch: Partial<LogisticsItem>) => void;
  removeLogisticsItem: (gameId: string, itemId: string) => void;
  moveLogisticsItem: (gameId: string, itemId: string, direction: 'up' | 'down') => void;

  // Communication
  addCommItem: (gameId: string) => void;
  updateCommItem: (gameId: string, itemId: string, patch: Partial<CommunicationItem>) => void;
  removeCommItem: (gameId: string, itemId: string) => void;

  // Sales
  addSalesScenario: (gameId: string) => void;
  updateSalesScenario: (gameId: string, scenarioId: string, patch: Partial<SalesScenario>) => void;
  removeSalesScenario: (gameId: string, scenarioId: string) => void;

  // Game Components
  addGameComponent: (gameId: string) => void;
  updateGameComponent: (gameId: string, compId: string, patch: Partial<GameComponent>) => void;
  removeGameComponent: (gameId: string, compId: string) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      games: [],
      activeGameId: null,

      setActiveGame: (id) => set({ activeGameId: id }),

      addGame: (name) => {
        const id = uid();
        const now = new Date().toISOString();
        const newGame: Game = {
          id, name, vatRate: 20,
          developmentItems: [],
          developmentSafetyMarginPercent: 10,
          factoryQuotes: [],
          logistics: [],
          logisticsSafetyMarginPercent: 20,
          communicationItems: [],
          salesScenarios: [],
          gameComponents: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ games: [...s.games, newGame], activeGameId: id }));
      },

      removeGame: (id) =>
        set((s) => ({
          games: s.games.filter((g) => g.id !== id),
          activeGameId: s.activeGameId === id ? (s.games[0]?.id ?? null) : s.activeGameId,
        })),

      updateGame: (id, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g
          ),
        })),

      addDevItem: (gameId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              developmentItems: [...g.developmentItems, {
                id: uid(), name: '', quantity: 0, nbCards: null,
                htPerUnit: 0, ttcPerUnit: 0, manualTTC: false, notes: ''
              }]
            }
          ),
        })),

      updateDevItem: (gameId, itemId, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              developmentItems: g.developmentItems.map((item) =>
                item.id !== itemId ? item : { ...item, ...patch }
              )
            }
          ),
        })),

      removeDevItem: (gameId, itemId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              developmentItems: g.developmentItems.filter((i) => i.id !== itemId)
            }
          ),
        })),

      moveDevItem: (gameId, itemId, direction) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              developmentItems: move(g.developmentItems, itemId, direction),
            }
          ),
        })),

      addFactoryQuote: (gameId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: [...g.factoryQuotes, {
                id: uid(),
                factoryName: 'Nouvelle Usine',
                quantity: 0,
                components: [],
                uncertaintyMarginPercent: 20,
                dollarToEuroRate: 0.85,
                toolingUSD: 0,
              }]
            }
          ),
        })),

      updateFactoryQuote: (gameId, quoteId, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.map((q) =>
                q.id !== quoteId ? q : { ...q, ...patch }
              )
            }
          ),
        })),

      removeFactoryQuote: (gameId, quoteId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.filter((q) => q.id !== quoteId)
            }
          ),
        })),

      addComponent: (gameId, quoteId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.map((q) =>
                q.id !== quoteId ? q : {
                  ...q,
                  components: [...q.components, { id: uid(), name: '', size: '', description: '', quantity: 1, priceUSD: 0 }]
                }
              )
            }
          ),
        })),

      updateComponent: (gameId, quoteId, compId, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.map((q) =>
                q.id !== quoteId ? q : {
                  ...q,
                  components: q.components.map((c) =>
                    c.id !== compId ? c : { ...c, ...patch }
                  )
                }
              )
            }
          ),
        })),

      removeComponent: (gameId, quoteId, compId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.map((q) =>
                q.id !== quoteId ? q : {
                  ...q,
                  components: q.components.filter((c) => c.id !== compId)
                }
              )
            }
          ),
        })),

      moveComponent: (gameId, quoteId, compId, direction) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.map((q) =>
                q.id !== quoteId ? q : {
                  ...q,
                  components: move(q.components, compId, direction),
                }
              )
            }
          ),
        })),

      // Game-level logistics
      addLogisticsItem: (gameId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              logistics: [...(g.logistics ?? []), { id: uid(), name: '', description: '', priceHT: 0 }]
            }
          ),
        })),

      updateLogisticsItem: (gameId, itemId, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              logistics: (g.logistics ?? []).map((l) =>
                l.id !== itemId ? l : { ...l, ...patch }
              )
            }
          ),
        })),

      removeLogisticsItem: (gameId, itemId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              logistics: (g.logistics ?? []).filter((l) => l.id !== itemId)
            }
          ),
        })),

      moveLogisticsItem: (gameId, itemId, direction) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              logistics: move(g.logistics ?? [], itemId, direction),
            }
          ),
        })),

      addCommItem: (gameId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              communicationItems: [...g.communicationItems, {
                id: uid(), name: 'Communication', monthlyPriceHT: 0, months: 0, safetyMarginPercent: 10
              }]
            }
          ),
        })),

      updateCommItem: (gameId, itemId, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              communicationItems: g.communicationItems.map((c) =>
                c.id !== itemId ? c : { ...c, ...patch }
              )
            }
          ),
        })),

      removeCommItem: (gameId, itemId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              communicationItems: g.communicationItems.filter((c) => c.id !== itemId)
            }
          ),
        })),

      addSalesScenario: (gameId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              salesScenarios: [...g.salesScenarios, {
                id: uid(),
                name: `${g.salesScenarios.length + 1}er Tirage`,
                factoryQuoteId: g.factoryQuotes[0]?.id ?? '',
                pvcHT: 0,
                boutiqueMarginPercent: 40,
                distributeurAdditionalMarginPercent: 30,
                bbgSalePricePercent: 90,
                boutiqueQty: 0,
                distributeurQty: 0,
                bbgQty: 0,
                unsoldPercent: 0,
                authorRoyaltyPercent: 0,
                includeDevelopmentCost: true,
              }]
            }
          ),
        })),

      updateSalesScenario: (gameId, scenarioId, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              salesScenarios: g.salesScenarios.map((sc) =>
                sc.id !== scenarioId ? sc : { ...sc, ...patch }
              )
            }
          ),
        })),

      removeSalesScenario: (gameId, scenarioId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              salesScenarios: g.salesScenarios.filter((sc) => sc.id !== scenarioId)
            }
          ),
        })),

      addGameComponent: (gameId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              gameComponents: [...(g.gameComponents ?? []), {
                id: uid(), name: '', category: '', progressPercent: 0, notes: ''
              }]
            }
          ),
        })),

      updateGameComponent: (gameId, compId, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              gameComponents: (g.gameComponents ?? []).map((c) =>
                c.id !== compId ? c : { ...c, ...patch }
              )
            }
          ),
        })),

      removeGameComponent: (gameId, compId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              gameComponents: (g.gameComponents ?? []).filter((c) => c.id !== compId)
            }
          ),
        })),
    }),
    { name: 'bbg-calc-storage' }
  )
);
