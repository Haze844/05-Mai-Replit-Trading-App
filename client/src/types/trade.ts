export interface Trade {
  id: number;
  symbol: string | null;
  setup?: string | null;
  date: string | Date;
  profitLoss: number | null;
  trend?: string | null;
  internalTrend?: string | null;
  microTrend?: string | null;
  mainTrendM15?: string | null;
  internalTrendM5?: string | null;
  entryLevel?: string | null;
  entryType?: string | null;
  structure?: string | null;
  timeframeEntry?: string | null;
  liquidation?: string | null;
  liquidationEntry?: string | null;
  unmitZone?: string | null;
  marketPhase?: string | null;
  rrAchieved?: number | null;
  rrPotential?: number | null;
  location?: string | null;
  slType?: string | null;
  accountType?: string | null;
  riskPoints?: number | null;
  rangePoints?: number | null;
  size?: number | null;
  session?: string | null;
  userId?: number | null;
  chartUrl?: string | null;
  chartImage?: string | null;
  notes?: string | null;
  gptFeedback?: string | null;
  isWin?: boolean | null;
  slPoints?: number | null;
  riskSum?: number | null;
  riskAmount?: number | null;
  
  // Für Vergleichsansicht
  userColor?: string;
  userName?: string;
}