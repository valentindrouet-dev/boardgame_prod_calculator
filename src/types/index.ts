export interface DevelopmentItem {
  id: string;
  name: string;
  quantity: number;
  nbCards: number | null;
  htPerUnit: number;
  ttcPerUnit: number;
  manualTTC: boolean;
  notes: string;
}

export interface ManufacturingComponent {
  id: string;
  name: string;
  quantity: number;
  priceUSD: number;
}

export interface LogisticsItem {
  id: string;
  name: string;
  description: string;
  priceHT: number;
}

export interface FactoryQuote {
  id: string;
  factoryName: string;
  quantity: number;
  components: ManufacturingComponent[];
  uncertaintyMarginPercent: number;
  dollarToEuroRate: number;
  logistics: LogisticsItem[];
  logisticsSafetyMarginPercent: number;
}

export interface CommunicationItem {
  id: string;
  name: string;
  monthlyPriceHT: number;
  months: number;
  safetyMarginPercent: number;
}

export interface SalesScenario {
  id: string;
  name: string;
  factoryQuoteId: string;
  pvcHT: number;
  boutiqueMarginPercent: number;
  distributeurAdditionalMarginPercent: number;
  bbgSalePricePercent: number;
  boutiqueQty: number;
  distributeurQty: number;
  bbgQty: number;
  unsoldPercent: number;
  authorRoyaltyPercent: number;
  includeDevelopmentCost: boolean;
}

export interface GameComponent {
  id: string;
  name: string;
  category: string;
  progressPercent: number;
  notes: string;
}

export interface Game {
  id: string;
  name: string;
  vatRate: number;
  developmentItems: DevelopmentItem[];
  developmentSafetyMarginPercent: number;
  factoryQuotes: FactoryQuote[];
  communicationItems: CommunicationItem[];
  salesScenarios: SalesScenario[];
  gameComponents: GameComponent[];
  createdAt: string;
  updatedAt: string;
}
