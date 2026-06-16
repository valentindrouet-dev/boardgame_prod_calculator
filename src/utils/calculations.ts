import type { Game, FactoryQuote, PaymentMilestone, PaymentInstallment } from '../types';

export function fmt(n: number): string {
  const decimals = Math.abs(n) < 100 ? 2 : 0;
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' €';
}

export function fmtUSD(n: number): string {
  return '$' + n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calcDevTotalHT(game: Game): number {
  const subtotal = game.developmentItems.reduce((sum, item) => {
    return sum + item.htPerUnit * item.quantity;
  }, 0);
  return subtotal * (1 + game.developmentSafetyMarginPercent / 100);
}

export function calcDevTotalTTC(game: Game): number {
  return calcDevTotalHT(game) * (1 + game.vatRate / 100);
}

export function calcDevPerUnit(game: Game, quote: FactoryQuote): number {
  if (quote.quantity === 0) return 0;
  return calcDevTotalHT(game) / quote.quantity;
}

export function calcFabComponentsPerUnitEUR(quote: FactoryQuote): number {
  const subtotal = quote.components.filter(c => !c.disabled).reduce((sum, c) => {
    return sum + c.priceUSD * c.quantity * quote.dollarToEuroRate;
  }, 0);
  return subtotal * (1 + quote.uncertaintyMarginPercent / 100);
}

export function calcFabToolingEUR(quote: FactoryQuote): number {
  return (quote.toolingUSD ?? 0) * quote.dollarToEuroRate;
}

export function calcFabPerUnitEUR(quote: FactoryQuote): number {
  const toolingPerUnit = quote.quantity > 0 ? calcFabToolingEUR(quote) / quote.quantity : 0;
  return calcFabComponentsPerUnitEUR(quote) + toolingPerUnit;
}

export function calcFabTotalHT(quote: FactoryQuote): number {
  return calcFabComponentsPerUnitEUR(quote) * quote.quantity + calcFabToolingEUR(quote);
}

export function calcLogisticsSubtotalHT(game: Game): number {
  return (game.logistics ?? []).reduce((sum, l) => sum + l.priceHT, 0);
}

export function calcLogisticsTotalHT(game: Game): number {
  return calcLogisticsSubtotalHT(game) * (1 + (game.logisticsSafetyMarginPercent ?? 20) / 100);
}

export function calcLogisticsPerUnit(game: Game, quote: FactoryQuote): number {
  if (quote.quantity === 0) return 0;
  return calcLogisticsTotalHT(game) / quote.quantity;
}

export function calcCommTotalHT(game: Game): number {
  return game.communicationItems.reduce((sum, item) => {
    return sum + item.monthlyPriceHT * item.months * (1 + item.safetyMarginPercent / 100);
  }, 0);
}

export function calcCommPerUnit(game: Game, quote: FactoryQuote): number {
  if (quote.quantity === 0) return 0;
  return calcCommTotalHT(game) / quote.quantity;
}

export function calcCostPerUnitHT(
  game: Game,
  quote: FactoryQuote,
  includeDev: boolean,
  includeComm = true
): number {
  const dev = includeDev ? calcDevPerUnit(game, quote) : 0;
  const comm = includeComm ? calcCommPerUnit(game, quote) : 0;
  return dev + calcFabPerUnitEUR(quote) + calcLogisticsPerUnit(game, quote) + comm;
}

export interface SalesCalc {
  pvcTTC: number;
  boutiquePriceHT: number;
  boutiquePriceTTC: number;
  distributeurPriceHT: number;
  distributeurPriceTTC: number;
  bbgSalePriceHT: number;
  bbgSalePriceTTC: number;
  costPerUnitHT: number;
  costPerUnitTTC: number;
  marginBoutiquePerUnit: number;
  marginDistributeurPerUnit: number;
  marginBBGPerUnit: number;
  totalQty: number;
  unsoldQty: number;
  totalSoldQty: number;
  totalAchatBoutiqueHT: number;
  totalMarginBoutiqueHT: number;
  totalAchatDistributeurHT: number;
  totalMarginDistributeurHT: number;
  totalVentesBBGHT: number;
  totalMarginBBGHT: number;
  totalVentesHT: number;
  totalVentesTTC: number;
  totalMarginHT: number;
  authorRoyaltyTotal: number;
  totalMarginMinusAuthor: number;
  totalCost: number;
}

export function calcSales(game: Game, scenarioIndex: number): SalesCalc | null {
  const scenario = game.salesScenarios[scenarioIndex];
  if (!scenario) return null;
  const quote = game.factoryQuotes.find(q => q.id === scenario.factoryQuoteId);
  if (!quote) return null;

  const vatMult = 1 + game.vatRate / 100;
  const costPerUnitHT = calcCostPerUnitHT(game, quote, scenario.includeDevelopmentCost, scenario.includeCommunicationCost ?? true);
  const costPerUnitTTC = costPerUnitHT * vatMult;

  const pvcTTC = scenario.pvcHT * vatMult;
  const boutiquePriceHT = scenario.pvcHT * (1 - scenario.boutiqueMarginPercent / 100);
  const boutiquePriceTTC = boutiquePriceHT * vatMult;
  const distributeurPriceHT = boutiquePriceHT * (1 - scenario.distributeurAdditionalMarginPercent / 100);
  const distributeurPriceTTC = distributeurPriceHT * vatMult;
  const bbgSalePriceHT = scenario.pvcHT * scenario.bbgSalePricePercent / 100;
  const bbgSalePriceTTC = bbgSalePriceHT * vatMult;

  const marginBoutiquePerUnit = boutiquePriceHT - costPerUnitHT;
  const marginDistributeurPerUnit = distributeurPriceHT - costPerUnitHT;
  const marginBBGPerUnit = bbgSalePriceHT - costPerUnitHT;

  const totalSoldQty = scenario.boutiqueQty + scenario.distributeurQty + scenario.bbgQty;
  const totalQty = quote.quantity > 0 ? quote.quantity : totalSoldQty;
  const unsoldQty = Math.max(0, totalQty - totalSoldQty);

  const totalAchatBoutiqueHT = scenario.boutiqueQty * boutiquePriceHT;
  const totalMarginBoutiqueHT = scenario.boutiqueQty * marginBoutiquePerUnit;
  const totalAchatDistributeurHT = scenario.distributeurQty * distributeurPriceHT;
  const totalMarginDistributeurHT = scenario.distributeurQty * marginDistributeurPerUnit;
  const totalVentesBBGHT = scenario.bbgQty * bbgSalePriceHT;
  const totalMarginBBGHT = scenario.bbgQty * marginBBGPerUnit;

  const totalVentesHT = totalAchatBoutiqueHT + totalAchatDistributeurHT + totalVentesBBGHT;
  const totalVentesTTC = totalVentesHT * vatMult;
  const totalCost = totalQty * costPerUnitHT;
  const totalMarginHT = totalVentesHT - totalCost;

  const authorRoyaltyTotal = totalSoldQty * scenario.pvcHT * scenario.authorRoyaltyPercent / 100;
  const totalMarginMinusAuthor = totalMarginHT - authorRoyaltyTotal;

  return {
    pvcTTC, boutiquePriceHT, boutiquePriceTTC,
    distributeurPriceHT, distributeurPriceTTC,
    bbgSalePriceHT, bbgSalePriceTTC,
    costPerUnitHT, costPerUnitTTC,
    marginBoutiquePerUnit, marginDistributeurPerUnit, marginBBGPerUnit,
    totalQty, unsoldQty, totalSoldQty,
    totalAchatBoutiqueHT, totalMarginBoutiqueHT,
    totalAchatDistributeurHT, totalMarginDistributeurHT,
    totalVentesBBGHT, totalMarginBBGHT,
    totalVentesHT, totalVentesTTC,
    totalMarginHT, authorRoyaltyTotal, totalMarginMinusAuthor, totalCost
  };
}

export interface PaymentSource {
  sourceType: PaymentMilestone['sourceType'];
  sourceId: string;
  label: string;
  amount: number;
}

export function getPaymentSources(game: Game): PaymentSource[] {
  const sources: PaymentSource[] = [];

  game.developmentItems.forEach(item => {
    const amount = item.htPerUnit * item.quantity * (1 + game.developmentSafetyMarginPercent / 100);
    if (amount !== 0) {
      sources.push({ sourceType: 'dev', sourceId: item.id, label: `Développement - ${item.name}`, amount });
    }
  });

  const selectedQuote = game.factoryQuotes.find(q => q.id === game.selectedFactoryQuoteId) ?? game.factoryQuotes[0];
  if (selectedQuote) {
    sources.push({
      sourceType: 'fabrication',
      sourceId: selectedQuote.id,
      label: `Fabrication - ${selectedQuote.factoryName}`,
      amount: calcFabTotalHT(selectedQuote),
    });
  }

  (game.logistics ?? []).forEach(item => {
    const amount = item.priceHT * (1 + (game.logisticsSafetyMarginPercent ?? 20) / 100);
    if (amount !== 0) {
      sources.push({ sourceType: 'logistics', sourceId: item.id, label: `Transport - ${item.name}`, amount });
    }
  });

  game.communicationItems.forEach(item => {
    const amount = item.monthlyPriceHT * item.months * (1 + item.safetyMarginPercent / 100);
    if (amount !== 0) {
      sources.push({ sourceType: 'communication', sourceId: item.id, label: `Communication - ${item.name}`, amount });
    }
  });

  return sources;
}

export function buildPaymentMilestones(game: Game): PaymentMilestone[] {
  const sources = getPaymentSources(game);
  const existing = game.paymentSchedule ?? [];

  return sources.map(source => {
    const found = existing.find(m => m.sourceId === source.sourceId && m.sourceType === source.sourceType);
    if (found) {
      return { ...found, label: source.label, totalAmount: source.amount };
    }
    const installment: PaymentInstallment = {
      id: `${source.sourceId}-default`,
      label: 'Paiement complet',
      amount: source.amount,
      date: null,
      paid: false,
    };
    return {
      id: source.sourceId,
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      label: source.label,
      totalAmount: source.amount,
      installments: [installment],
    };
  });
}
