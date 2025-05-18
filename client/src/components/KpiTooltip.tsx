import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Spezieller Tooltip für Datenpunkte in Sparkline-Visualisierungen
 */
export function SparklineDataTooltip({ trade, color = "blue" }: { trade: any, color?: "blue" | "green" }) {
  if (!trade) return null;
  const colorClass = color === "blue" ? "blue" : "green";
  
  return (
    <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 z-20 bg-black/90 border border-${colorClass}-500/30 rounded-md py-1.5 px-3 text-xs whitespace-nowrap pointer-events-none`}>
      <div className={`font-semibold mb-1 text-${colorClass}-300`}>
        {trade.symbol} - {trade.setup || 'Kein Setup'}
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-gray-300">Datum:</span>
        <span className="text-white">{new Date(trade.date).toLocaleDateString()}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-gray-300">Ergebnis:</span>
        <span className={trade.isWin ? 'text-green-400' : 'text-red-400'}>
          {trade.isWin ? 'Gewinn' : 'Verlust'}
        </span>
      </div>
      {trade.profitLoss !== undefined && (
        <div className="flex justify-between gap-3">
          <span className="text-gray-300">P/L:</span>
          <span className={Number(trade.profitLoss) >= 0 ? 'text-green-400' : 'text-red-400'}>
            ${Number(trade.profitLoss).toFixed(0)}
          </span>
        </div>
      )}
      {trade.rrAchieved !== undefined && (
        <div className="flex justify-between gap-3">
          <span className="text-gray-300">R/R:</span>
          <span className={Number(trade.rrAchieved) >= 0 ? 'text-green-400' : 'text-red-400'}>
            {Number(trade.rrAchieved).toFixed(1)}R
          </span>
        </div>
      )}
    </div>
  );
}

interface KpiTooltipProps {
  title: string;
  jasperValue: number | string;
  moValue: number | string;
  children: React.ReactNode;
  unit?: string;
}

/**
 * Verbesserte KPI-Anzeige mit Tooltip für den Vergleich zwischen Jasper und Mo
 */
export function KpiTooltip({ title, jasperValue, moValue, children, unit = '' }: KpiTooltipProps) {
  // Berechne Differenz für numerische Werte
  const diffValue = typeof jasperValue === 'number' && typeof moValue === 'number'
    ? jasperValue - moValue
    : 0;
  
  // Bestimme, wer besser abschneidet
  const leader = diffValue > 0 ? 'jasper' : (diffValue < 0 ? 'mo' : 'none');
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-black/90 border-primary/30 p-3 max-w-[220px]">
          <div className="flex flex-col gap-1.5">
            <div className="font-medium text-primary text-xs">{title}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span className="text-blue-400/80">Jasper:</span>
              <span className="text-blue-300">{jasperValue}{unit}</span>
              <span className="text-teal-400/80">Mo:</span>
              <span className="text-teal-300">{moValue}{unit}</span>
              {typeof jasperValue === 'number' && typeof moValue === 'number' && (
                <>
                  <span className="text-gray-400">Differenz:</span>
                  <span className={
                    leader === 'jasper' 
                      ? "text-blue-300" 
                      : (leader === 'mo' ? "text-teal-300" : "text-gray-300")
                  }>
                    {(diffValue > 0 ? "+" : "") + diffValue.toFixed(2)}{unit}
                  </span>
                </>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Optimierte Vergleichs-Badge für KPIs mit Farbgebung je nach Vorteil
 */
export function ComparisonBadge({ 
  value1, 
  value2, 
  showDiff = true, 
  unit = '',
  precision = 0,
  reverseColors = false
}: { 
  value1: number; 
  value2: number; 
  showDiff?: boolean;
  unit?: string;
  precision?: number;
  reverseColors?: boolean;
}) {
  const diff = value1 - value2;
  const compare = reverseColors ? -diff : diff;
  
  let bgColor = "bg-gray-800/40";
  let textColor = "text-gray-400";
  
  if (compare > 0) {
    bgColor = "bg-blue-900/30";
    textColor = "text-blue-300";
  } else if (compare < 0) {
    bgColor = "bg-teal-900/30";
    textColor = "text-teal-300";
  }
  
  return (
    <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}>
      {value1.toFixed(precision)}{unit}
      {showDiff && diff !== 0 && (
        <span className="ml-1 opacity-80 text-[0.65rem]">
          ({diff > 0 ? "+" : ""}{diff.toFixed(precision)}{unit})
        </span>
      )}
    </div>
  );
}