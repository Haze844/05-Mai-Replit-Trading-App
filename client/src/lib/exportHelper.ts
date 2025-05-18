/**
 * Hilfsfunktionen für den Export von Daten aus der Vergleichsansicht
 */

/**
 * Exportiert Vergleichsdaten als CSV-Datei
 */
export function exportComparisonDataToCSV(tradeStats: any) {
  if (!tradeStats) return;
  
  // Header für CSV definieren
  const headers = [
    'Kategorie', 
    'Jasper', 
    'Mo', 
    'Differenz',
    'Einheit'
  ];
  
  // Daten für Export sammeln
  const data = [
    ['Anzahl Trades', tradeStats.jasperCount, tradeStats.moCount, tradeStats.jasperCount - tradeStats.moCount, ''],
    ['Gewonnene Trades', tradeStats.jasperWins, tradeStats.moWins, tradeStats.jasperWins - tradeStats.moWins, ''],
    ['Verlorene Trades', tradeStats.jasperLosses, tradeStats.moLosses, tradeStats.jasperLosses - tradeStats.moLosses, ''],
    ['Win-Rate', tradeStats.jasperWinRate.toFixed(2), tradeStats.moWinRate.toFixed(2), (tradeStats.jasperWinRate - tradeStats.moWinRate).toFixed(2), '%'],
    ['Durchschn. RR', tradeStats.jasperAvgRR.toFixed(2), tradeStats.moAvgRR.toFixed(2), (tradeStats.jasperAvgRR - tradeStats.moAvgRR).toFixed(2), 'R'],
    ['Gesamtgewinn/-verlust', tradeStats.jasperTotalPL.toFixed(2), tradeStats.moTotalPL.toFixed(2), (tradeStats.jasperTotalPL - tradeStats.moTotalPL).toFixed(2), '$']
  ];
  
  // CSV-String generieren
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  // Datum für Dateinamen generieren
  const date = new Date().toISOString().split('T')[0];
  
  // CSV-Datei erstellen und Download auslösen
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `trading-vergleich-${date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Erzeugt verbesserte KPI-Vergleichsanzeigen mit Tooltips
 */
export function getKpiTooltipContent(title: string, jasperValue: any, moValue: any, unit: string = '') {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-medium text-primary text-xs">{title}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span className="text-blue-400/80">Jasper:</span>
        <span className="text-blue-300">{jasperValue}{unit}</span>
        <span className="text-teal-400/80">Mo:</span>
        <span className="text-teal-300">{moValue}{unit}</span>
        <span className="text-gray-400">Differenz:</span>
        <span className={jasperValue > moValue ? "text-blue-300" : (jasperValue < moValue ? "text-teal-300" : "text-gray-300")}>
          {(jasperValue > moValue ? "+" : "") + (jasperValue - moValue).toFixed(typeof jasperValue === 'number' ? 2 : 0)}{unit}
        </span>
      </div>
    </div>
  );
}