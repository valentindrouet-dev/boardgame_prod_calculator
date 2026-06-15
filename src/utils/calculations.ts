import type { Game, FactoryQuote } from '../types';

export function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
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

export function calcFabPerUnitEUR(quote: FactoryQuote): number {
  const subtotal = quote.components.reduce((sum, c) => {
    return sum + c.priceUSD * c.quantity * quote.dollarToEuroRate;
  }, 0);
  return subtotal * (1 + quote.uncertaintyMarginPercent / 100);
}

export function calcFabTotalHT(quote: FactoryQuote): number {
  return calcFabPerUnitEUR(quote) * quote.quantity;
}

export function calcLogisticsSubtotalHT(quote: FactoryQuote): number {
  return quote.logistics.reduce((sum, l) => sum + l.priceHT, 0);
}

export function calcLogisticsTotalHT(quote: FactoryQuote): number {
  return calcLogisticsSubtotalHT(quote) * (1 + quote.logisticsSafetyMarginPercent / 100);
}

export function calcLogisticsPerUnit(quote: FactoryQuote): number {
  if (quote.quantity === 0) return 0;
  return calcLogisticsTotalHT(quote) / quote.quantity;
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
  includeDev: boolean
): number {
  const dev = includeDev ? calcDevPerUnit(game, quote) : 0;
  return dev + calcFabPerUnitEUR(quote) + calcLogisticsPerUnit(quote) + calcCommPerUnit(game, quote);
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
  const costPerUnitHT = calcCostPerUnitHT(game, quote, scenario.includeDevelopmentCost);
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

  const totalQty = scenario.boutiqueQty + scenario.distributeurQty + scenario.bbgQty;
  const unsoldQty = Math.round(totalQty * scenario.unsoldPercent / 100);
  const totalSoldQty = totalQty - unsoldQty;

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
