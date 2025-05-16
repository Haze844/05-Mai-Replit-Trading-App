export interface Trade {
  id: number;
  symbol: string;
  setup?: string;
  date: string | Date;
  profitLoss: number;
  trend?: string;
  internalTrend?: string;
  microTrend?: string;
  mainTrendM15?: string;
  internalTrendM5?: string;
  entryLevel?: string;
  entryType?: string;
  structure?: string;
  timeframeEntry?: string;
  liquidation?: string;
  liquidationEntry?: string;
  unmitZone?: string;
  marketPhase?: string;
  rrAchieved?: number;
  rrPotential?: number;
  location?: string;
  slType?: string;
  accountType?: string;
  riskPoints?: number;
  rangePoints?: number;
  size?: number;
  session?: string;
  userId?: number;
  chartUrl?: string;
  chartImage?: string;
  notes?: string;
  gptFeedback?: string;
  isWin?: boolean;
  
  // Für Vergleichsansicht
  userColor?: string;
  userName?: string;
}