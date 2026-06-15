import type { Game } from '../types';
import {
  calcDevTotalHT, calcDevTotalTTC, calcDevPerUnit,
  calcFabPerUnitEUR, calcFabTotalHT,
  calcLogisticsTotalHT, calcLogisticsPerUnit,
  calcCommTotalHT, calcCommPerUnit,
  calcCostPerUnitHT, calcSales, fmt
} from './calculations';

export function exportJSON(game: Game) {
  const data = JSON.stringify(game, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${game.name.replace(/\s+/g, '_')}_data.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(game: Game) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  const addHeader = (title: string) => {
    doc.setFillColor(55, 65, 81);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${game.name} — ${title}`, 14, 12);
    doc.setTextColor(0, 0, 0);
  };

  // Page 1: Development
  addHeader('Coûts de Développement');

  const devSubtotal = game.developmentItems.reduce((s, i) => s + i.htPerUnit * i.quantity, 0);
  const devTotal = calcDevTotalHT(game);

  autoTable(doc, {
    startY: 22,
    head: [['Composant', 'Qté', 'Nb Cartes', 'HT/unité', 'TTC/unité', 'HT Total', 'TTC Total', 'Notes']],
    body: [
      ...game.developmentItems.map(item => [
        item.name,
        item.quantity,
        item.nbCards ?? '',
        fmt(item.htPerUnit),
        fmt(item.manualTTC ? item.ttcPerUnit : item.htPerUnit * (1 + game.vatRate / 100)),
        fmt(item.htPerUnit * item.quantity),
        fmt(item.htPerUnit * item.quantity * (1 + game.vatRate / 100)),
        item.notes,
      ]),
      ['Marge Sécurité ' + game.developmentSafetyMarginPercent + '%', '', '', '', '', fmt(devTotal - devSubtotal), '', ''],
      ['TOTAL Développement', '', '', '', '', fmt(devTotal), fmt(calcDevTotalTTC(game)), ''],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [55, 65, 81] },
  });

  // Pages for factory quotes
  for (const quote of game.factoryQuotes) {
    doc.addPage();
    addHeader(`Fabrication — ${quote.factoryName} (qté ${quote.quantity})`);

    const fabPerUnit = calcFabPerUnitEUR(quote);
    const fabTotal = calcFabTotalHT(quote);
    const compSubtotal = quote.components.reduce((s, c) => s + c.priceUSD * c.quantity * quote.dollarToEuroRate, 0);

    autoTable(doc, {
      startY: 22,
      head: [['Composant', 'Qté', 'Prix $', 'Prix €']],
      body: [
        ...quote.components.map(c => [
          c.name,
          c.quantity,
          `$${(c.priceUSD * c.quantity).toFixed(2)}`,
          fmt(c.priceUSD * c.quantity * quote.dollarToEuroRate),
        ]),
        [`Marge d'Incertitude ${quote.uncertaintyMarginPercent}%`, '', '', fmt(fabPerUnit - compSubtotal)],
        [`TOTAL Fabrication (par unité) — taux $→€ ${quote.dollarToEuroRate}`, '', '', fmt(fabPerUnit)],
        [`TOTAL Fabrication (${quote.quantity} unités)`, '', '', fmt(fabTotal)],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [55, 65, 81] },
    });

    const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: lastY,
      head: [['Transport & Logistique', 'Description', 'Prix HT']],
      body: [
        ...quote.logistics.map(l => [l.name, l.description, fmt(l.priceHT)]),
        [`Marge Sécurité ${quote.logisticsSafetyMarginPercent}%`, '', fmt(calcLogisticsTotalHT(quote) - quote.logistics.reduce((s, l) => s + l.priceHT, 0))],
        ['TOTAL Transport (par unité)', '', fmt(calcLogisticsPerUnit(quote))],
        ['TOTAL Transport', '', fmt(calcLogisticsTotalHT(quote))],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [120, 53, 15] },
    });
  }

  // Communication page
  if (game.communicationItems.length > 0) {
    doc.addPage();
    addHeader('Communication');
    autoTable(doc, {
      startY: 22,
      head: [['Nom', 'HT/mois', 'Mois', 'Marge %', 'Total HT', 'Total TTC']],
      body: [
        ...game.communicationItems.map(c => {
          const total = c.monthlyPriceHT * c.months * (1 + c.safetyMarginPercent / 100);
          return [c.name, fmt(c.monthlyPriceHT), c.months, c.safetyMarginPercent + '%', fmt(total), fmt(total * (1 + game.vatRate / 100))];
        }),
        ['TOTAL Communication', '', '', '', fmt(calcCommTotalHT(game)), fmt(calcCommTotalHT(game) * (1 + game.vatRate / 100))],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [55, 65, 81] },
    });
  }

  // Sales scenarios page
  if (game.salesScenarios.length > 0) {
    doc.addPage();
    addHeader('Scénarios de Vente');
    let y = 22;

    for (const scenario of game.salesScenarios) {
      const calc = calcSales(game, game.salesScenarios.indexOf(scenario));
      if (!calc) continue;
      const quote = game.factoryQuotes.find(q => q.id === scenario.factoryQuoteId);

      autoTable(doc, {
        startY: y,
        head: [[{ content: `${scenario.name} — ${quote?.factoryName ?? ''} (${quote?.quantity ?? 0} unités)`, colSpan: 3 }]],
        body: [
          ['Coût par unité HT', fmt(calc.costPerUnitHT), ''],
          ['PVC HT / TTC', fmt(scenario.pvcHT), fmt(calc.pvcTTC)],
          ['Prix Boutique HT', fmt(calc.boutiquePriceHT), `${scenario.boutiqueQty} unités (marge ${scenario.boutiqueMarginPercent}%)`],
          ['Prix Distributeur HT', fmt(calc.distributeurPriceHT), `${scenario.distributeurQty} unités (marge +${scenario.distributeurAdditionalMarginPercent}%)`],
          ['Prix Vente BBG HT', fmt(calc.bbgSalePriceHT), `${scenario.bbgQty} unités (${scenario.bbgSalePricePercent}% PVC)`],
          ['Invendus', `${calc.unsoldQty} (${scenario.unsoldPercent}%)`, ''],
          ['Total Ventes HT', fmt(calc.totalVentesHT), fmt(calc.totalVentesTTC) + ' TTC'],
          ['Total Marge HT', fmt(calc.totalMarginHT), ''],
          ...(scenario.authorRoyaltyPercent > 0 ? [
            ['Droits Auteur', `-${fmt(calc.authorRoyaltyTotal)}`, `${scenario.authorRoyaltyPercent}% PVC HT`],
            ['Marge nette', fmt(calc.totalMarginMinusAuthor), ''],
          ] : []),
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [76, 29, 149] },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      if (y > 180) { doc.addPage(); addHeader('Scénarios de Vente (suite)'); y = 22; }
    }
  }

  // Summary page
  if (game.factoryQuotes.length > 0) {
    doc.addPage();
    addHeader('Résumé — Comparatif des Usines');

    const headers = ['', ...game.factoryQuotes.map(q => `${q.factoryName}\n(${q.quantity} unités)`)];
    const rows = [
      ['Développement / unité', ...game.factoryQuotes.map(q => fmt(calcDevPerUnit(game, q)))],
      ['Fabrication / unité', ...game.factoryQuotes.map(q => fmt(calcFabPerUnitEUR(q)))],
      ['Transport / unité', ...game.factoryQuotes.map(q => fmt(calcLogisticsPerUnit(q)))],
      ['Communication / unité', ...game.factoryQuotes.map(q => fmt(calcCommPerUnit(game, q)))],
      ['COÛT TOTAL / unité HT', ...game.factoryQuotes.map(q => fmt(calcCostPerUnitHT(game, q, true)))],
      ['COÛT TOTAL / unité TTC', ...game.factoryQuotes.map(q => fmt(calcCostPerUnitHT(game, q, true) * (1 + game.vatRate / 100)))],
      ['COÛT TOTAL', ...game.factoryQuotes.map(q => fmt(calcCostPerUnitHT(game, q, true) * q.quantity))],
    ];

    autoTable(doc, {
      startY: 22,
      head: [headers],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [55, 65, 81] },
      bodyStyles: { halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    });
  }

  doc.save(`${game.name.replace(/\s+/g, '_')}_production.pdf`);
}
