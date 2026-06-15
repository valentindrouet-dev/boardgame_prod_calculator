import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Game, DevelopmentItem, FactoryQuote, ManufacturingComponent, LogisticsItem, CommunicationItem, SalesScenario } from '../types';

function uid(): string {
  return crypto.randomUUID();
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

  // Factory Quotes
  addFactoryQuote: (gameId: string) => void;
  updateFactoryQuote: (gameId: string, quoteId: string, patch: Partial<FactoryQuote>) => void;
  removeFactoryQuote: (gameId: string, quoteId: string) => void;

  // Manufacturing Components
  addComponent: (gameId: string, quoteId: string) => void;
  updateComponent: (gameId: string, quoteId: string, compId: string, patch: Partial<ManufacturingComponent>) => void;
  removeComponent: (gameId: string, quoteId: string, compId: string) => void;

  // Logistics
  addLogisticsItem: (gameId: string, quoteId: string) => void;
  updateLogisticsItem: (gameId: string, quoteId: string, itemId: string, patch: Partial<LogisticsItem>) => void;
  removeLogisticsItem: (gameId: string, quoteId: string, itemId: string) => void;

  // Communication
  addCommItem: (gameId: string) => void;
  updateCommItem: (gameId: string, itemId: string, patch: Partial<CommunicationItem>) => void;
  removeCommItem: (gameId: string, itemId: string) => void;

  // Sales
  addSalesScenario: (gameId: string) => void;
  updateSalesScenario: (gameId: string, scenarioId: string, patch: Partial<SalesScenario>) => void;
  removeSalesScenario: (gameId: string, scenarioId: string) => void;
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
          id,
          name,
          vatRate: 20,
          developmentItems: [],
          developmentSafetyMarginPercent: 10,
          factoryQuotes: [],
          communicationItems: [],
          salesScenarios: [],
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
                logistics: [],
                logisticsSafetyMarginPercent: 20,
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
                  components: [...q.components, { id: uid(), name: '', quantity: 1, priceUSD: 0 }]
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

      addLogisticsItem: (gameId, quoteId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.map((q) =>
                q.id !== quoteId ? q : {
                  ...q,
                  logistics: [...q.logistics, { id: uid(), name: '', description: '', priceHT: 0 }]
                }
              )
            }
          ),
        })),

      updateLogisticsItem: (gameId, quoteId, itemId, patch) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.map((q) =>
                q.id !== quoteId ? q : {
                  ...q,
                  logistics: q.logistics.map((l) =>
                    l.id !== itemId ? l : { ...l, ...patch }
                  )
                }
              )
            }
          ),
        })),

      removeLogisticsItem: (gameId, quoteId, itemId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId ? g : {
              ...g,
              factoryQuotes: g.factoryQuotes.map((q) =>
                q.id !== quoteId ? q : {
                  ...q,
                  logistics: q.logistics.filter((l) => l.id !== itemId)
                }
              )
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
    }),
    { name: 'bbg-calc-storage' }
  )
);
