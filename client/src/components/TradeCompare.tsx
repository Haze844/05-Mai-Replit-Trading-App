import React, { useState, useEffect, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trade } from '@shared/schema';
import TradeTable from './TradeTable';
import FilterBar from './FilterBar';
import TradeDetail from './TradeDetail';
import { KpiTooltip, ComparisonBadge, SparklineDataTooltip } from './KpiTooltip';
import { exportComparisonDataToCSV } from '@/lib/exportHelper';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  BarChart2, 
  Users, 
  Target, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Award,
  AlertTriangle,
  Calendar,
  CalendarDays,
  Filter,
  Info,
  RefreshCw,
  BadgeCheck,
  CircleUser,
  BarChart,
  LayoutTemplate,
  User,
  FileDown,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  Sparklines, 
  SparklinesLine, 
  SparklinesBars,
  SparklinesSpots
} from 'react-sparklines';

// Farben für Benutzerunterscheidung - erweitert für konsistentes Farbschema
const USER_COLORS = {
  admin: 'bg-blue-500/10', // Jasper-Farbmarkierung
  jasper: 'bg-blue-500/10', // Alternative Namenskonvention
  mo: 'bg-teal-500/10'      // Türkisgrün für Mo (statt grün)
};

// Farbschemas für visuelles Branding je Nutzer
const USER_THEME = {
  // Jasper - Blau/Neonblau-Farbschema
  jasper: {
    primary: 'rgba(59, 130, 246, 0.8)',     // Hauptfarbe
    light: 'rgba(59, 130, 246, 0.3)',       // Hellvariante
    dark: 'rgba(37, 99, 235, 0.8)',         // Dunkelvariante
    accent: 'rgba(96, 165, 250, 0.9)',      // Akzentfarbe
    gradient: {
      from: 'from-blue-700/50',
      via: 'via-blue-600/30',
      to: 'to-blue-500/50'
    },
    text: {
      primary: 'text-blue-300',
      secondary: 'text-blue-400',
      muted: 'text-blue-300/60'
    },
    border: 'border-blue-500/30',
    bg: {
      card: 'bg-gradient-to-br from-black/40 to-blue-950/20',
      highlight: 'bg-blue-500/10'
    }
  },
  
  // Mo - Türkisgrün-Farbschema
  mo: {
    primary: 'rgba(20, 184, 166, 0.8)',     // Hauptfarbe (Türkisgrün)
    light: 'rgba(20, 184, 166, 0.3)',       // Hellvariante
    dark: 'rgba(15, 118, 110, 0.8)',        // Dunkelvariante
    accent: 'rgba(45, 212, 191, 0.9)',      // Akzentfarbe
    gradient: {
      from: 'from-teal-700/50',
      via: 'via-teal-600/30',
      to: 'to-teal-500/50'
    },
    text: {
      primary: 'text-teal-300',
      secondary: 'text-teal-400',
      muted: 'text-teal-300/60'
    },
    border: 'border-teal-500/30',
    bg: {
      card: 'bg-gradient-to-br from-black/40 to-teal-950/20',
      highlight: 'bg-teal-500/10'
    }
  }
};

// Verbesserte Donut-Chart Komponente mit Animation
const DonutChart = ({ percentage, color, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Hintergrundfarbe basierend auf der Hauptfarbe dynamisch berechnen
  const bgColor = percentage >= 65
    ? `rgba(${color.includes('59, 130, 246') || color.includes('blue') ? '59, 130, 246' : '16, 185, 129'}, 0.1)`
    : percentage >= 50
      ? `rgba(${color.includes('59, 130, 246') || color.includes('blue') ? '59, 130, 246' : '16, 185, 129'}, 0.05)`
      : 'rgba(239, 68, 68, 0.1)';
  
  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      {/* Hintergrund-Pulsieren bei hohen Werten */}
      {percentage >= 70 && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse opacity-30"
          style={{ backgroundColor: color, animationDuration: '3s' }}
        />
      )}
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 relative z-10">
        {/* Hintergrund-Kreis mit weicherem Übergang */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill={bgColor}
          stroke="rgba(30, 30, 30, 0.3)"
          strokeWidth={strokeWidth / 2}
        />
        {/* Fortschritts-Kreis mit Animation */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1500 ease-out"
          style={{
            filter: `drop-shadow(0 0 3px ${color.replace(')', ', 0.6)')})`,
            animation: 'donutFadeIn 1.5s ease-out forwards'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-300 z-20">
        <div className="font-bold text-sm" style={{ color }}>
          {Math.round(percentage)}%
        </div>
        <div className="text-[8px] opacity-80 mt-0.5" style={{ color }}>
          {percentage >= 65 ? 'Excellent' : percentage >= 50 ? 'Good' : 'Improve'}
        </div>
      </div>
    </div>
  );
};

// Hilfsfunktion um historische Trade-Daten für Sparklines zu generieren
const getTradeHistory = (trades, key = 'isWin', count = 10) => {
  const tradesToUse = [...trades].slice(0, count);
  return key === 'isWin' 
    ? tradesToUse.map(t => t.isWin ? 1 : 0) 
    : tradesToUse.map(t => parseFloat(t[key] || 0));
};

// Besten Trade finden
const findBestTrade = (trades) => {
  // Sicherheitscheck - falls keine Trades oder leeres Array
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    console.log("findBestTrade: Keine gültigen Trades gefunden");
    return null;
  }
  
  // Debugging
  console.log(`findBestTrade: Analysiere ${trades.length} Trades`);
  
  // Wenn nur ein Trade vorhanden ist und er positiv ist, gib diesen zurück
  if (trades.length === 1 && trades[0].profitLoss > 0) {
    console.log(`findBestTrade: Nur ein Trade vorhanden und dieser ist positiv:`, trades[0]);
    return trades[0];
  }
  
  // Wenn nur ein Trade vorhanden ist, gib diesen als "besten" zurück
  if (trades.length === 1) {
    console.log(`findBestTrade: Nur ein Trade vorhanden:`, trades[0]);
    return trades[0];
  }
  
  // Trades sortieren, erst für profitLoss, dann für rrAchieved (beide absteigend für besten Trade)
  try {
    // Nur gültige Trades mit numerischen Werten für profitLoss verwenden
    const validTrades = trades.filter(t => 
      t && 
      typeof t.profitLoss === 'number' && 
      !isNaN(t.profitLoss)
    );
    
    console.log(`findBestTrade: ${validTrades.length} gültige Trades nach Filterung`);
    
    if (validTrades.length === 0) return null;
    
    // Nach Profit sortieren (absteigend)
    const sortedTrades = [...validTrades].sort((a, b) => {
      // Primäres Sortierkriterium: profitLoss (absteigend)
      const profitDiff = (b.profitLoss || 0) - (a.profitLoss || 0);
      if (profitDiff !== 0) return profitDiff;
      
      // Sekundäres Sortierkriterium: rrAchieved (absteigend)
      return (b.rrAchieved || 0) - (a.rrAchieved || 0);
    });
    
    console.log(`findBestTrade: Bester Trade gefunden:`, sortedTrades[0]);
    return sortedTrades[0];
  } catch (error) {
    console.error("Fehler beim Finden des besten Trades:", error);
    // Bei Fehlern, gib den ersten Trade zurück, falls vorhanden
    return trades.length > 0 ? trades[0] : null;
  }
};

// Schlechtesten Trade finden
const findWorstTrade = (trades) => {
  // Sicherheitscheck - falls keine Trades oder leeres Array
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    console.log("findWorstTrade: Keine gültigen Trades gefunden");
    return null;
  }
  
  // Debugging
  console.log(`findWorstTrade: Analysiere ${trades.length} Trades`);
  
  // Wenn nur ein Trade vorhanden ist und er negativ ist, gib diesen zurück
  if (trades.length === 1 && trades[0].profitLoss < 0) {
    console.log(`findWorstTrade: Nur ein Trade vorhanden und dieser ist negativ:`, trades[0]);
    return trades[0];
  }
  
  // Wenn nur ein Trade vorhanden ist, gib diesen als "schlechtesten" zurück
  if (trades.length === 1) {
    console.log(`findWorstTrade: Nur ein Trade vorhanden:`, trades[0]);
    return trades[0];
  }
  
  // Trades sortieren, erst für profitLoss, dann für rrAchieved (beide aufsteigend für schlechtesten Trade)
  try {
    // Nur gültige Trades mit numerischen Werten für profitLoss verwenden
    const validTrades = trades.filter(t => 
      t && 
      typeof t.profitLoss === 'number' && 
      !isNaN(t.profitLoss)
    );
    
    console.log(`findWorstTrade: ${validTrades.length} gültige Trades nach Filterung`);
    
    if (validTrades.length === 0) return null;
    
    // Nach Profit sortieren (aufsteigend)
    const sortedTrades = [...validTrades].sort((a, b) => {
      // Primäres Sortierkriterium: profitLoss (aufsteigend)
      const profitDiff = (a.profitLoss || 0) - (b.profitLoss || 0);
      if (profitDiff !== 0) return profitDiff;
      
      // Sekundäres Sortierkriterium: rrAchieved (aufsteigend)
      return (a.rrAchieved || 0) - (b.rrAchieved || 0);
    });
    
    console.log(`findWorstTrade: Schlechtester Trade gefunden:`, sortedTrades[0]);
    return sortedTrades[0];
  } catch (error) {
    console.error("Fehler beim Finden des schlechtesten Trades:", error);
    // Bei Fehlern, gib den ersten Trade zurück, falls vorhanden
    return trades.length > 0 ? trades[0] : null;
  }
};

// Funktion zur Generierung von Wochentags-Heatmap-Daten
const generateWeekdayHeatmapData = (trades, userName = null) => {
  // Definiere Wochentage und Sitzungen
  const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const sessions = ['Morgen', 'Mittag', 'Abend', 'Nacht'];
  
  // Initialisiere die Heatmap-Datenstruktur
  const heatmapData = weekdays.map(day => ({
    day,
    sessions: sessions.map(session => ({
      session,
      count: 0,
      winCount: 0,
      winRate: 0,
      totalPL: 0,
      avgPL: 0,
      trades: []
    }))
  }));
  
  // Keine Berechnung, wenn keine Trades verfügbar sind
  if (!trades || trades.length === 0) {
    return heatmapData;
  }
  
  // Füllen der Heatmap mit Daten
  trades.forEach(trade => {
    // Wenn userName angegeben, filtere nach diesem
    if (userName && trade.userName !== userName) return;
    
    const tradeDate = new Date(trade.date);
    
    // Wochentag ermitteln (0 = Sonntag, 1 = Montag, ..., 6 = Samstag)
    // Umrechnen in unser Format (0 = Montag, ..., 6 = Sonntag)
    let weekdayIndex = tradeDate.getDay() - 1;
    if (weekdayIndex < 0) weekdayIndex = 6; // Sonntag ans Ende setzen
    
    // Tageszeit für Session bestimmen
    const hour = tradeDate.getHours();
    let sessionIndex;
    
    if (hour >= 5 && hour < 12) {
      sessionIndex = 0; // Morgen (5-11 Uhr)
    } else if (hour >= 12 && hour < 17) {
      sessionIndex = 1; // Mittag (12-16 Uhr)
    } else if (hour >= 17 && hour < 22) {
      sessionIndex = 2; // Abend (17-21 Uhr)
    } else {
      sessionIndex = 3; // Nacht (22-4 Uhr)
    }
    
    // Aktualisiere die Daten in der Zelle
    const cell = heatmapData[weekdayIndex].sessions[sessionIndex];
    cell.count++;
    if (trade.isWin) cell.winCount++;
    cell.totalPL += (trade.profitLoss || 0);
    cell.trades.push(trade);
  });
  
  // Berechne abgeleitete Werte wie Win-Rate und Durchschnitts-PL
  heatmapData.forEach(day => {
    day.sessions.forEach(session => {
      if (session.count > 0) {
        session.winRate = (session.winCount / session.count) * 100;
        session.avgPL = session.totalPL / session.count;
      }
    });
  });
  
  return heatmapData;
};

// Wochentags-Heatmap-Komponente
const WeekdayHeatmap = ({ data, userTheme, userName }) => {
  // Finde die maximale Anzahl von Trades in einer Zelle für die Farbskalierung
  const maxCount = Math.max(
    ...data.flatMap(day => day.sessions.map(session => session.count)), 
    1 // Mindestens 1, um Division durch Null zu vermeiden
  );
  
  // Farbintensität basierend auf relativer Häufigkeit berechnen
  const getColorIntensity = (count) => {
    if (count === 0) return 'bg-gray-950/50';
    
    // Intensität berechnen (20-90% Opazität)
    const intensity = Math.min(Math.max(count / maxCount * 100, 20), 90);
    const opacityValue = Math.round(intensity);
    
    // Je nach Benutzer unterschiedliche Farbthemen
    if (userTheme === 'jasper') {
      return `bg-blue-900/[0.${opacityValue}]`;
    } else {
      return `bg-teal-900/[0.${opacityValue}]`;
    }
  };
  
  // Textfarbe basierend auf Benutzer und Wert
  const getTextColor = (isPositive = true) => {
    if (userTheme === 'jasper') {
      return isPositive ? 'text-blue-300' : 'text-red-400';
    } else {
      return isPositive ? 'text-teal-300' : 'text-red-400';
    }
  };
  
  return (
    <div className="rounded-lg border border-gray-800/50 overflow-hidden">
      <div className="grid grid-cols-[minmax(80px,auto)_repeat(4,1fr)]">
        {/* Kopfzeile */}
        <div className="bg-black/40 p-2 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-400">{userName}</span>
        </div>
        
        {['Morgen', 'Mittag', 'Abend', 'Nacht'].map((session) => (
          <div key={session} className="bg-black/40 p-2 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">{session}</span>
          </div>
        ))}
        
        {/* Datenzeilen */}
        {data.map((day) => (
          <React.Fragment key={day.day}>
            <div className="bg-black/30 p-2 flex items-center">
              <span className="text-xs text-gray-400">{day.day}</span>
            </div>
            
            {day.sessions.map((session, idx) => (
              <div 
                key={`${day.day}-${idx}`} 
                className={`${getColorIntensity(session.count)} p-2 hover:bg-gray-800/30 transition-colors relative group`}
              >
                {session.count > 0 ? (
                  <>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-300 font-medium">
                        {session.count}
                      </span>
                      <span className={`text-[9px] ${getTextColor(session.winRate >= 50)}`}>
                        {session.winRate.toFixed(0)}%
                      </span>
                    </div>
                    
                    {/* Detail-Tooltip bei Hover */}
                    <div className="absolute z-50 hidden group-hover:block top-full left-1/2 transform -translate-x-1/2 mt-1 w-36 bg-black/95 border border-gray-700/50 rounded-md p-2 shadow-lg pointer-events-none">
                      <div className="text-[10px] font-medium text-gray-300 mb-1">
                        {day.day}, {session.session}
                      </div>
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px]">
                        <span className="text-gray-400">Trades:</span>
                        <span className="text-gray-300">{session.count}</span>
                        
                        <span className="text-gray-400">Win-Rate:</span>
                        <span className={getTextColor(session.winRate >= 50)}>
                          {session.winRate.toFixed(1)}%
                        </span>
                        
                        <span className="text-gray-400">Durchschnitt:</span>
                        <span className={getTextColor(session.avgPL >= 0)}>
                          ${session.avgPL.toFixed(0)}
                        </span>
                        
                        <span className="text-gray-400">Gesamt:</span>
                        <span className={getTextColor(session.totalPL >= 0)}>
                          ${session.totalPL.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="text-[9px] text-gray-700 flex justify-center">-</span>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Hauptkomponente
export default function TradeCompare() {
  // TanStack Query Client für Cache-Invalidierung und Synchronisation
  const queryClient = useQueryClient();
  
  // State für kombinierte Trades
  const [combinedTrades, setCombinedTrades] = useState<Trade[]>([]);
  // State für gefilterte Trades (Ergebnis der Filter-Anwendung)
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  // State für aktive Filter
  const [activeFilters, setActiveFilters] = useState({});
  // State für ausgewählten Trade (für Details)
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  // State für ausgewählten Zeitraum (für schnelle Filter)
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  // State für Sparkline-Daten
  const [sparklineData, setSparklineData] = useState({
    jasperPL: Array(10).fill(0),
    moPL: Array(10).fill(0),
    jasperWinRate: Array(10).fill(50),
    moWinRate: Array(10).fill(50)
  });
  
  // Diese Variable existiert nur im Scope der Komponente und wird für die Berechnung der Tooltip-Daten verwendet
  const combinedTradesFormatted = useMemo(() => {
    return (filteredTrades.length > 0 ? filteredTrades : combinedTrades);
  }, [filteredTrades, combinedTrades]);

  // Hilfsfunktion für Tooltip-Komponente für alle Grafiken
  const TradeTooltip = ({ trade, color = "green" }: { trade: any, color?: string }) => {
    if (!trade) return null;
    
    const colorClass = color === "blue" ? "blue" : "green";
    
    return (
      <div className={`opacity-0 hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 z-20 bg-black/90 border border-${colorClass}-500/30 rounded-md py-1.5 px-3 text-xs whitespace-nowrap pointer-events-none transition-opacity duration-150`}>
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
  };

// Statistik-Berechnungen für die angezeigten Trades, unterteilt nach Benutzer
  const tradeStats = useMemo(() => {
    // IMMER die gefilterten Trades für die Statistik-Berechnung verwenden
    const tradesToUse = filteredTrades;
    console.log(`Statistikberechnung basiert auf ${tradesToUse.length} gefilterten Trades`);
    
    // Gesamt-Statistiken
    const count = tradesToUse.length;
    const wins = tradesToUse.filter(t => t.isWin === true).length;
    const losses = tradesToUse.filter(t => t.isWin === false).length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    
    // Gesamt P/L
    const totalPL = tradesToUse.reduce((sum, trade) => {
      return sum + (trade.profitLoss || 0);
    }, 0);
    
    // Durchschnittliches Risk-Reward-Verhältnis
    const avgRR = tradesToUse.reduce((sum, trade) => {
      return sum + (trade.rrAchieved || 0);
    }, 0) / (count || 1);
    
    // Jasper-Statistiken (Filter Jasper-Trades)
    const jasperTradesFiltered = tradesToUse.filter((t: any) => t.userName === 'Jasper');
    const jasperCount = jasperTradesFiltered.length;
    const jasperWins = jasperTradesFiltered.filter((t: any) => t.isWin === true).length;
    const jasperLosses = jasperTradesFiltered.filter((t: any) => t.isWin === false).length;
    const jasperWinRate = jasperCount > 0 ? (jasperWins / jasperCount) * 100 : 0;
    
    const jasperTotalPL = jasperTradesFiltered.reduce((sum: number, trade: any) => {
      return sum + (trade.profitLoss || 0);
    }, 0);
    
    const jasperAvgRR = jasperTradesFiltered.reduce((sum: number, trade: any) => {
      return sum + (trade.rrAchieved || 0);
    }, 0) / (jasperCount || 1);
    
    // Datenpunkte für historische Visualisierung - Jasper
    const jasperWinHistory = jasperTradesFiltered.slice(0, 10).map((t: any) => t.isWin ? 1 : 0).reverse();
    const jasperPLHistory = jasperTradesFiltered.slice(0, 10).map((t: any) => t.profitLoss || 0).reverse();
    const jasperRRHistory = jasperTradesFiltered.slice(0, 10).map((t: any) => t.rrAchieved || 0).reverse();
    
    // Bester und schlechtester Trade für Jasper
    const jasperBestTrade = findBestTrade(jasperTradesFiltered);
    const jasperWorstTrade = findWorstTrade(jasperTradesFiltered);
    
    // Mo-Statistiken (Filter Mo-Trades)
    const moTradesFiltered = tradesToUse.filter((t: any) => t.userName === 'Mo');
    const moCount = moTradesFiltered.length;
    const moWins = moTradesFiltered.filter((t: any) => t.isWin === true).length;
    const moLosses = moTradesFiltered.filter((t: any) => t.isWin === false).length;
    const moWinRate = moCount > 0 ? (moWins / moCount) * 100 : 0;
    
    const moTotalPL = moTradesFiltered.reduce((sum: number, trade: any) => {
      return sum + (trade.profitLoss || 0);
    }, 0);
    
    const moAvgRR = moTradesFiltered.reduce((sum: number, trade: any) => {
      return sum + (trade.rrAchieved || 0);
    }, 0) / (moCount || 1);
    
    // Datenpunkte für historische Visualisierung - Mo
    const moWinHistory = moTradesFiltered.slice(0, 10).map((t: any) => t.isWin ? 1 : 0).reverse();
    const moPLHistory = moTradesFiltered.slice(0, 10).map((t: any) => t.profitLoss || 0).reverse();
    const moRRHistory = moTradesFiltered.slice(0, 10).map((t: any) => t.rrAchieved || 0).reverse();
    
    // Bester und schlechtester Trade für Mo
    const moBestTrade = findBestTrade(moTradesFiltered);
    const moWorstTrade = findWorstTrade(moTradesFiltered);

    // Direkte Vergleichsmetriken (Jasper vs Mo)
    const winRateDiff = jasperCount > 0 && moCount > 0 ? jasperWinRate - moWinRate : 0;
    const plDiff = jasperTotalPL - moTotalPL;
    const rrDiff = jasperCount > 0 && moCount > 0 ? jasperAvgRR - moAvgRR : 0;
    
    // Wer hat bessere Performance?
    const winRateLeader = winRateDiff > 0 ? 'Jasper' : winRateDiff < 0 ? 'Mo' : 'Gleichstand';
    const plLeader = plDiff > 0 ? 'Jasper' : plDiff < 0 ? 'Mo' : 'Gleichstand';
    const rrLeader = rrDiff > 0 ? 'Jasper' : rrDiff < 0 ? 'Mo' : 'Gleichstand';
    
    return {
      count,
      wins,
      losses,
      winRate,
      totalPL,
      avgRR,
      // Benutzer-spezifische Statistiken
      jasperCount,
      jasperWins,
      jasperLosses,
      jasperWinRate,
      jasperTotalPL,
      jasperAvgRR,
      jasperWinHistory,
      jasperPLHistory,
      jasperRRHistory,
      jasperBestTrade,
      jasperWorstTrade,
      moCount,
      moWins,
      moLosses,
      moWinRate,
      moTotalPL,
      moAvgRR,
      moWinHistory,
      moPLHistory,
      moRRHistory,
      moBestTrade,
      moWorstTrade,
      // Vergleichsmetriken
      winRateDiff,
      plDiff,
      rrDiff,
      winRateLeader,
      plLeader,
      rrLeader
    };
  }, [combinedTrades, filteredTrades, activeFilters]);

  // Jasper-Trades abrufen (den gleichen queryKey wie in SimpleHome verwenden, aber immer neu laden)
  const { data: adminTrades = [], isLoading: isLoadingAdmin, refetch: refetchAdmin } = useQuery<any[], Error>({
    queryKey: ['/api/trades', 1, {}],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("userId", "1"); // Jasper-ID
      
      console.log("TradeCompare - Abfrage Jasper-Trades (userId=1)");
      const response = await fetch(`/api/trades?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Jasper trades");
      }
      const data = await response.json();
      console.log(`TradeCompare - Jasper-Trades geladen: ${data.length} Trades`);
      
      // Stellen Sie sicher, dass nur Trades mit userId=1 zurückgegeben werden
      return data.filter((trade: any) => trade.userId === 1);
    },
    refetchOnMount: true,
    staleTime: 0
  });

  // Mo-Trades abrufen (den gleichen queryKey wie in SimpleHome verwenden, aber immer neu laden)
  const { data: moTrades = [], isLoading: isLoadingMo, refetch: refetchMo } = useQuery<any[], Error>({
    queryKey: ['/api/trades', 2, {}],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("userId", "2"); // Mo-ID
      
      console.log("TradeCompare - Abfrage Mo-Trades (userId=2)");
      const response = await fetch(`/api/trades?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch mo trades");
      }
      const data = await response.json();
      console.log(`TradeCompare - Mo-Trades geladen: ${data.length} Trades`);
      
      // Stellen Sie sicher, dass nur Trades mit userId=2 zurückgegeben werden
      return data.filter((trade: any) => trade.userId === 2);
    },
    refetchOnMount: true,
    staleTime: 0
  });
  
  // Beim Mounten der Komponente Daten neu laden
  useEffect(() => {
    // Trades zu Beginn einmal neu laden
    refetchAdmin();
    refetchMo();
  }, []);

  // Daten aufbereiten, wenn sie geladen sind
  useEffect(() => {
    if (!isLoadingAdmin && !isLoadingMo) {
      console.log("TradeCompare - Verfügbare Trades:", { 
        jasper: adminTrades.length, 
        mo: moTrades.length
      });

      // Jasper-Trades Farbmarkierung und Benutzerinfo hinzufügen
      // Ein eindeutiger Key für jeden Trade wird durch Präfix "jasper-" erzeugt
      // Vergewissern, dass die Trades dem richtigen Benutzer gehören (userId === 1)
      const formattedAdminTrades = adminTrades
        .filter(trade => trade.userId === 1) // Nur Trades von Jasper (userId 1)
        .map(trade => ({
          ...trade,
          id: `jasper-${trade.id}`, // Eindeutige ID für die Tabelle
          originalId: trade.id,    // Original-ID für API-Anfragen beibehalten
          userColor: USER_COLORS.jasper,
          userName: 'Jasper'
        }));

      // Mo-Trades Farbmarkierung und Benutzerinfo hinzufügen
      // Ein eindeutiger Key für jeden Trade wird durch Präfix "mo-" erzeugt
      // Vergewissern, dass die Trades dem richtigen Benutzer gehören (userId === 2)
      const formattedMoTrades = moTrades
        .filter(trade => trade.userId === 2) // Nur Trades von Mo (userId 2)
        .map(trade => ({
          ...trade,
          id: `mo-${trade.id}`,    // Eindeutige ID für die Tabelle
          originalId: trade.id,    // Original-ID für API-Anfragen beibehalten
          userColor: USER_COLORS.mo,
          userName: 'Mo'
        }));

      console.log("TradeCompare - Formatierte Trades nach Filterung:", { 
        jasper: formattedAdminTrades.length, 
        mo: formattedMoTrades.length 
      });

      // Trades kombinieren und nach Datum sortieren
      const allTrades = [...formattedAdminTrades, ...formattedMoTrades].sort((a, b) => {
        // Datum in umgekehrter Reihenfolge sortieren (neueste zuerst)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setCombinedTrades(allTrades);
      // Auch die gefilterten Trades initialisieren (alle Trades, da noch keine Filter aktiv)
      setFilteredTrades(allTrades);
    }
  }, [adminTrades, moTrades, isLoadingAdmin, isLoadingMo]);

  // Hilfsfunktion zum Setzen von Datums-Filtern
  const applyDateFilter = (rangeType: string) => {
    const today = new Date();
    let fromDate = new Date();
    
    switch(rangeType) {
      case "7days":
        // Letzte 7 Tage
        fromDate.setDate(today.getDate() - 7);
        break;
      case "30days":
        // Letzte 30 Tage
        fromDate.setDate(today.getDate() - 30);
        break;
      case "month":
        // Aktueller Monat
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "all":
      default:
        // Alle Trades (Standardfilter von 2020)
        fromDate = new Date("2020-01-01");
        break;
    }
    
    // Aktualisiere den ausgewählten Zeitraum für die UI
    setSelectedTimeRange(rangeType);
    
    // Aktualisiere die Filter
    const newFilters = { 
      ...activeFilters, 
      startDate: fromDate.toISOString(),
      endDate: new Date("2030-12-31").toISOString() // Weit in der Zukunft
    };
    
    console.log(`TradeCompare - Zeitraumfilter angewendet: ${rangeType}, von ${fromDate.toLocaleDateString()}`);
    handleFilterChange(newFilters);
  };

  // Filter-Handler
  const handleFilterChange = (newFilters: any) => {
    console.log("TradeCompare - Neue Filter empfangen:", newFilters);
    setActiveFilters(newFilters);
    
    // Erzwinge ein Neuladen der Daten durch Invalidierung des Caches
    // Dies ist wichtig, damit die Filter korrekt auf die API-Anfragen angewendet werden
    queryClient.invalidateQueries();
    
    // Hier zusätzlich die Trades filtern, basierend auf den neuen Filtern
    if (combinedTrades.length > 0) {
      // Filtern mit den neuen Filtern
      const newFilteredTrades = combinedTrades.filter((trade: any) => {
        // Symbol Filter
        if (newFilters.symbols?.length > 0 && !newFilters.symbols.includes(trade.symbol)) {
          return false;
        }
        
        // Account Type Filter
        if (newFilters.accountTypes?.length > 0 && !newFilters.accountTypes.includes(trade.accountType)) {
          return false;
        }
        
        // Session Filter
        if (newFilters.session !== 'all' && newFilters.sessions?.length > 0 && !newFilters.sessions.includes(trade.session)) {
          return false;
        }
        
        // Setup Filter
        if (newFilters.setup !== 'all' && newFilters.setups?.length > 0 && !newFilters.setups.includes(trade.setup)) {
          return false;
        }
        
        // Entry Type Filter
        if (newFilters.entryType !== 'all' && newFilters.entryTypes?.length > 0 && !newFilters.entryTypes.includes(trade.entryType)) {
          return false;
        }
        
        // Date Filter
        if (newFilters.startDate || newFilters.endDate) {
          const tradeDate = new Date(trade.date);
          
          if (newFilters.startDate) {
            const fromDate = new Date(newFilters.startDate);
            if (tradeDate < fromDate) {
              return false;
            }
          }
          
          if (newFilters.endDate) {
            const toDate = new Date(newFilters.endDate);
            toDate.setHours(23, 59, 59, 999); // Ende des Tages
            if (tradeDate > toDate) {
              return false;
            }
          }
        }
        
        // User Filter - benutzt 'userName' als optionale Property
        if (newFilters.user && newFilters.user !== 'all') {
          // Typensicherer Ansatz, da 'userName' nicht im Trade-Interface ist
          const tradeWithUserName = trade as any; // Expliziter Cast zu any
          
          if (newFilters.user === 'jasper' && tradeWithUserName.userName !== 'Jasper') {
            return false;
          }
          if (newFilters.user === 'mo' && tradeWithUserName.userName !== 'Mo') {
            return false;
          }
        }
        
        return true;
      });
      
      console.log(`TradeCompare - Trades nach Filterung: ${newFilteredTrades.length} von ${combinedTrades.length}`);
      setFilteredTrades(newFilteredTrades);
    } else {
      // Wenn keine Trades vorhanden sind, setze gefilterte Trades leer
      setFilteredTrades([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      
      {/* Mini-Fazit Sektion */}
      <div className="mb-5 bg-gradient-to-r from-black/40 to-black/20 rounded-xl p-4 border border-primary/20 backdrop-blur-sm shadow-lg">
        <h2 className="text-sm font-semibold mb-3 flex items-center text-primary/90">
          <Info className="h-4 w-4 mr-2 opacity-80" /> 
          Trading Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jasper's Trading Profil */}
          <div className="bg-gradient-to-br from-blue-950/40 to-blue-900/20 rounded-xl p-4 border border-blue-800/30 relative overflow-hidden">
            {/* Glasmorphism-Akzent für Jasper */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full blur-xl -ml-10 -mb-10 opacity-40"></div>
            
            <h3 className="text-sm font-semibold text-blue-300 mb-2 flex items-center relative z-10">
              <User className="w-4 h-4 mr-1.5 text-blue-400" />
              Jasper: Trading-Profil
            </h3>
            
            <div className="space-y-3 relative z-10">
              <div>
                <h4 className="text-xs font-medium text-blue-200/90 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-blue-400/90" />
                  Stärken:
                </h4>
                <ul className="mt-1 text-xs text-blue-300/80 space-y-1 pl-4 list-disc">
                  {tradeStats && tradeStats.jasperCount > 0 ? (
                    <>
                      {tradeStats.jasperWinRate >= 65 && (
                        <li>
                          <KpiTooltip 
                            title="Win-Rate Vergleich" 
                            jasperValue={tradeStats.jasperWinRate.toFixed(0) + "%"} 
                            moValue={tradeStats.moWinRate.toFixed(0) + "%"}
                            unit="%"
                          >
                            <span className="hover:underline cursor-help">Hohe Erfolgsquote von {tradeStats.jasperWinRate.toFixed(0)}%</span>
                          </KpiTooltip>
                        </li>
                      )}
                      {tradeStats.jasperAvgRR >= 1.5 && (
                        <li>
                          <KpiTooltip 
                            title="Risk/Reward Verhältnis" 
                            jasperValue={tradeStats.jasperAvgRR.toFixed(2)} 
                            moValue={tradeStats.moAvgRR.toFixed(2)}
                            unit="R"
                          >
                            <span className="hover:underline cursor-help">Ausgezeichnetes Risk/Reward mit {tradeStats.jasperAvgRR.toFixed(2)}R</span>
                          </KpiTooltip>
                        </li>
                      )}
                      {tradeStats.jasperTotalPL > 0 && (
                        <li>
                          <KpiTooltip 
                            title="Gesamtgewinn/-verlust" 
                            jasperValue={tradeStats.jasperTotalPL.toFixed(0)} 
                            moValue={tradeStats.moTotalPL.toFixed(0)}
                            unit="$"
                          >
                            <span className="hover:underline cursor-help">Positive Gesamtperformance: ${tradeStats.jasperTotalPL.toFixed(0)}</span>
                          </KpiTooltip>
                        </li>
                      )}
                      {/* Fallback, wenn keine spezifischen Stärken erkannt wurden */}
                      {!(tradeStats.jasperWinRate >= 65 || tradeStats.jasperAvgRR >= 1.5 || tradeStats.jasperTotalPL > 0) && (
                        <li>Aktives Trading mit {tradeStats.jasperCount} Trades</li>
                      )}
                    </>
                  ) : (
                    <li>Keine Daten verfügbar</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-blue-200/90 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1 text-blue-400/90" />
                  Verbesserungspotenzial:
                </h4>
                <ul className="mt-1 text-xs text-blue-300/80 space-y-1 pl-4 list-disc">
                  {tradeStats && tradeStats.jasperCount > 0 ? (
                    <>
                      {tradeStats.jasperWinRate < 50 && (
                        <li>Niedrige Erfolgsquote von {tradeStats.jasperWinRate.toFixed(0)}%</li>
                      )}
                      {tradeStats.jasperAvgRR < 1 && (
                        <li>Risk/Reward-Management verbessern ({tradeStats.jasperAvgRR.toFixed(2)}R)</li>
                      )}
                      {tradeStats.jasperTotalPL < 0 && (
                        <li>Negative Gesamtperformance: ${tradeStats.jasperTotalPL.toFixed(0)}</li>
                      )}
                      {/* Fallback, wenn keine spezifischen Schwächen erkannt wurden */}
                      {!(tradeStats.jasperWinRate < 50 || tradeStats.jasperAvgRR < 1 || tradeStats.jasperTotalPL < 0) && (
                        <li>Mehr Konsistenz in Trade-Ausführung anstreben</li>
                      )}
                    </>
                  ) : (
                    <li>Importiere Trades, um eine Analyse zu erhalten</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Mo's Trading Profil */}
          <div className="bg-gradient-to-br from-teal-950/40 to-teal-900/20 rounded-xl p-4 border border-teal-800/30 relative overflow-hidden">
            {/* Glasmorphism-Akzent für Mo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-16 -mt-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/10 rounded-full blur-xl -ml-10 -mb-10 opacity-40"></div>
            
            <h3 className="text-sm font-semibold text-teal-300 mb-2 flex items-center relative z-10">
              <User className="w-4 h-4 mr-1.5 text-teal-400" />
              Mo: Trading-Profil
            </h3>
            
            <div className="space-y-3 relative z-10">
              <div>
                <h4 className="text-xs font-medium text-teal-200/90 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-teal-400/90" />
                  Stärken:
                </h4>
                <ul className="mt-1 text-xs text-teal-300/80 space-y-1 pl-4 list-disc">
                  {tradeStats && tradeStats.moCount > 0 ? (
                    <>
                      {tradeStats.moWinRate >= 65 && (
                        <li>
                          <KpiTooltip 
                            title="Win-Rate Vergleich" 
                            jasperValue={tradeStats.jasperWinRate.toFixed(0) + "%"} 
                            moValue={tradeStats.moWinRate.toFixed(0) + "%"}
                            unit="%"
                          >
                            <span className="hover:underline cursor-help">Hohe Erfolgsquote von {tradeStats.moWinRate.toFixed(0)}%</span>
                          </KpiTooltip>
                        </li>
                      )}
                      {tradeStats.moAvgRR >= 1.5 && (
                        <li>
                          <KpiTooltip 
                            title="Risk/Reward Verhältnis" 
                            jasperValue={tradeStats.jasperAvgRR.toFixed(2)} 
                            moValue={tradeStats.moAvgRR.toFixed(2)}
                            unit="R"
                          >
                            <span className="hover:underline cursor-help">Ausgezeichnetes Risk/Reward mit {tradeStats.moAvgRR.toFixed(2)}R</span>
                          </KpiTooltip>
                        </li>
                      )}
                      {tradeStats.moTotalPL > 0 && (
                        <li>
                          <KpiTooltip 
                            title="Gesamtgewinn/-verlust" 
                            jasperValue={tradeStats.jasperTotalPL.toFixed(0)} 
                            moValue={tradeStats.moTotalPL.toFixed(0)}
                            unit="$"
                          >
                            <span className="hover:underline cursor-help">Positive Gesamtperformance: ${tradeStats.moTotalPL.toFixed(0)}</span>
                          </KpiTooltip>
                        </li>
                      )}
                      {/* Fallback, wenn keine spezifischen Stärken erkannt wurden */}
                      {!(tradeStats.moWinRate >= 65 || tradeStats.moAvgRR >= 1.5 || tradeStats.moTotalPL > 0) && (
                        <li>Aktives Trading mit {tradeStats.moCount} Trades</li>
                      )}
                    </>
                  ) : (
                    <li>Keine Daten verfügbar</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-teal-200/90 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1 text-teal-400/90" />
                  Verbesserungspotenzial:
                </h4>
                <ul className="mt-1 text-xs text-teal-300/80 space-y-1 pl-4 list-disc">
                  {tradeStats && tradeStats.moCount > 0 ? (
                    <>
                      {tradeStats.moWinRate < 50 && (
                        <li>Niedrige Erfolgsquote von {tradeStats.moWinRate.toFixed(0)}%</li>
                      )}
                      {tradeStats.moAvgRR < 1 && (
                        <li>Risk/Reward-Management verbessern ({tradeStats.moAvgRR.toFixed(2)}R)</li>
                      )}
                      {tradeStats.moTotalPL < 0 && (
                        <li>Negative Gesamtperformance: ${tradeStats.moTotalPL.toFixed(0)}</li>
                      )}
                      {/* Fallback, wenn keine spezifischen Schwächen erkannt wurden */}
                      {!(tradeStats.moWinRate < 50 || tradeStats.moAvgRR < 1 || tradeStats.moTotalPL < 0) && (
                        <li>Mehr Konsistenz in Trade-Ausführung anstreben</li>
                      )}
                    </>
                  ) : (
                    <li>Importiere Trades, um eine Analyse zu erhalten</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      

      
      {/* Optimierte Statistik-Bar mit erweiterten Visualisierungen */}
      <div className="mb-5 bg-gradient-to-r from-black/30 to-black/20 rounded-xl p-4 border border-primary/20 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300">
        {/* Zeitraumauswahl und Filter-Controls */}
        <div className="flex justify-end mb-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5 bg-black/40 hover:bg-black/30 border-primary/30 text-primary/80 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Zeitraum</span>
                      <Filter className="h-3 w-3 ml-1 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3 bg-black/90 border border-primary/30">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-primary mb-2 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-2 opacity-70" />
                        Zeitraum wählen
                      </h4>
                      
                      {/* Detaillierte Datumsauswahl */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label htmlFor="from" className="text-xs text-gray-400 mb-1 block">Von</Label>
                          <input
                            id="from"
                            type="date"
                            value={
                              activeFilters?.startDate 
                                ? new Date(activeFilters.startDate).toISOString().split('T')[0] 
                                : '2020-01-01'
                            }
                            onChange={(e) => {
                              const newDate = new Date(e.target.value);
                              handleFilterChange({
                                ...activeFilters,
                                startDate: newDate.toISOString()
                              });
                              setSelectedTimeRange('custom');
                            }}
                            className="w-full h-8 rounded-md border border-gray-700 bg-black/40 px-3 py-1 text-xs text-gray-200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="to" className="text-xs text-gray-400 mb-1 block">Bis</Label>
                          <input
                            id="to"
                            type="date"
                            value={
                              activeFilters?.endDate 
                                ? new Date(activeFilters.endDate).toISOString().split('T')[0] 
                                : new Date().toISOString().split('T')[0]
                            }
                            onChange={(e) => {
                              const newDate = new Date(e.target.value);
                              newDate.setHours(23, 59, 59, 999); // Ende des Tages
                              handleFilterChange({
                                ...activeFilters,
                                endDate: newDate.toISOString()
                              });
                              setSelectedTimeRange('custom');
                            }}
                            className="w-full h-8 rounded-md border border-gray-700 bg-black/40 px-3 py-1 text-xs text-gray-200"
                          />
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-800 pt-3">
                        <p className="text-xs text-gray-400 mb-2">Schnellauswahl:</p>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => applyDateFilter("7days")}
                            className={`text-[10px] px-2 py-1 rounded ${
                              selectedTimeRange === "7days"
                                ? 'bg-primary/30 text-primary-foreground border border-primary/70'
                                : 'bg-black/50 hover:bg-gray-800/30 text-gray-300 border border-gray-800/70'
                            }`}
                          >
                            7 Tage
                          </button>
                          <button
                            onClick={() => applyDateFilter("30days")}
                            className={`text-[10px] px-2 py-1 rounded ${
                              selectedTimeRange === "30days"
                                ? 'bg-primary/30 text-primary-foreground border border-primary/70'
                                : 'bg-black/50 hover:bg-gray-800/30 text-gray-300 border border-gray-800/70'
                            }`}
                          >
                            30 Tage
                          </button>
                          <button
                            onClick={() => applyDateFilter("quarter")}
                            className={`text-[10px] px-2 py-1 rounded ${
                              selectedTimeRange === "quarter"
                                ? 'bg-primary/30 text-primary-foreground border border-primary/70'
                                : 'bg-black/50 hover:bg-gray-800/30 text-gray-300 border border-gray-800/70'
                            }`}
                          >
                            Quartal
                          </button>
                          <button
                            onClick={() => applyDateFilter("year")}
                            className={`text-[10px] px-2 py-1 rounded ${
                              selectedTimeRange === "year"
                                ? 'bg-primary/30 text-primary-foreground border border-primary/70'
                                : 'bg-black/50 hover:bg-gray-800/30 text-gray-300 border border-gray-800/70'
                            }`}
                          >
                            Jahr
                          </button>
                          <button
                            onClick={() => applyDateFilter("all")}
                            className={`text-[10px] px-2 py-1 rounded ${
                              selectedTimeRange === "all"
                                ? 'bg-primary/30 text-primary-foreground border border-primary/70'
                                : 'bg-black/50 hover:bg-gray-800/30 text-gray-300 border border-gray-800/70'
                            }`}
                          >
                            Alle
                          </button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black/90 border-primary/30 text-xs">
                Zeitraum für Statistikvergleich wählen
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 ml-2 bg-black/40 hover:bg-black/30 border-primary/30 text-primary/80 text-xs"
                  onClick={() => {
                    console.log("Export der gefilterten Vergleichsdaten", {
                      filteredCount: filteredTrades.length,
                      dateRange: activeFilters?.startDate ? 
                        `${new Date(activeFilters.startDate).toLocaleDateString()} - ${new Date(activeFilters.endDate || '2030-12-31').toLocaleDateString()}` : 
                        'Alle Daten'
                    });
                    exportComparisonDataToCSV({
                      // Übergebe die aktuellen Statistiken basierend auf den gefilterten Trades
                      jasperCount: tradeStats.jasperCount,
                      moCount: tradeStats.moCount,
                      jasperWins: tradeStats.jasperWins,
                      moWins: tradeStats.moWins,
                      jasperLosses: tradeStats.jasperLosses,
                      moLosses: tradeStats.moLosses,
                      jasperWinRate: tradeStats.jasperWinRate,
                      moWinRate: tradeStats.moWinRate,
                      jasperAvgRR: tradeStats.jasperAvgRR,
                      moAvgRR: tradeStats.moAvgRR,
                      jasperTotalPL: tradeStats.jasperTotalPL,
                      moTotalPL: tradeStats.moTotalPL
                    });
                  }}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Export</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black/90 border-primary/30 text-xs">
                CSV-Export der Vergleichsdaten
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1 ml-2 bg-black/40 hover:bg-black/30 border-primary/30 text-primary/80 text-xs" onClick={() => {
                  refetchAdmin();
                  refetchMo();
                }}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black/90 border-primary/30 text-xs">
                Daten aktualisieren
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Head-to-Head Vergleich oben */}
        <div className="mb-5 rounded-lg bg-gradient-to-r from-blue-950/10 via-gray-950/10 to-green-950/10 border border-gray-800/40 p-3">
          <h3 className="text-sm font-semibold text-center mb-2.5 text-gray-300">Head-to-Head Vergleich</h3>
          
          {/* Warnmeldung bei fehlenden Daten */}
          {(tradeStats.jasperCount === 0 || tradeStats.moCount === 0) && (
            <div className="text-amber-400 text-xs text-center p-2 mb-2 bg-amber-900/20 border border-amber-500/20 rounded-md">
              {tradeStats.jasperCount === 0 && tradeStats.moCount === 0 
                ? "Keine Daten für beide Benutzer verfügbar. Bitte importiere Trades für beide Benutzer."
                : tradeStats.jasperCount === 0 
                  ? "Keine Daten für Jasper verfügbar. Die Vergleiche zeigen nur Mos Werte an."
                  : "Keine Daten für Mo verfügbar. Die Vergleiche zeigen nur Jaspers Werte an."}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            {/* Win Rate Vergleich */}
            <div className="bg-black/20 rounded-lg border border-gray-800/40 p-2 flex flex-col items-center">
              <h4 className="text-[10px] uppercase tracking-wider opacity-70 text-center mb-1.5">Win Rate</h4>
              <div className="flex items-center justify-between w-full px-2 mb-2">
                <KpiTooltip
                  title="Win-Rate Vergleich"
                  jasperValue={tradeStats.jasperCount > 0 ? tradeStats.jasperWinRate.toFixed(0) + "%" : "Keine Daten"}
                  moValue={tradeStats.moCount > 0 ? tradeStats.moWinRate.toFixed(0) + "%" : "Keine Daten"}
                  unit="%"
                >
                  <div className="flex items-center cursor-help">
                    <div className="h-5 w-2 bg-blue-500/40 rounded-full mr-2"></div>
                    <span className="text-xs font-bold text-blue-400">
                      {tradeStats.jasperCount > 0 ? tradeStats.jasperWinRate.toFixed(0) + "%" : "-"}
                    </span>
                  </div>
                </KpiTooltip>
                <KpiTooltip
                  title="Win-Rate Vergleich"
                  jasperValue={tradeStats.jasperCount > 0 ? tradeStats.jasperWinRate.toFixed(0) + "%" : "Keine Daten"}
                  moValue={tradeStats.moCount > 0 ? tradeStats.moWinRate.toFixed(0) + "%" : "Keine Daten"}
                  unit="%"
                >
                  <div className="flex items-center cursor-help">
                    <span className="text-xs font-bold text-green-400">
                      {tradeStats.moCount > 0 ? tradeStats.moWinRate.toFixed(0) + "%" : "-"}
                    </span>
                    <div className="h-5 w-2 bg-green-500/40 rounded-full ml-2"></div>
                  </div>
                </KpiTooltip>
              </div>
              {tradeStats.jasperCount > 0 && tradeStats.moCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <KpiTooltip
                    title="Win-Rate Vergleich" 
                    jasperValue={tradeStats.jasperWinRate.toFixed(1) + "%"} 
                    moValue={tradeStats.moWinRate.toFixed(1) + "%"}
                    unit="%"
                  >
                    <span className={`text-[9px] cursor-help hover:underline ${Math.abs(tradeStats.winRateDiff) < 1 ? 'text-gray-400' : tradeStats.winRateDiff > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                      {tradeStats.winRateLeader === 'Gleichstand' ? 'Gleichstand' : 
                      `${tradeStats.winRateLeader} +${Math.abs(tradeStats.winRateDiff).toFixed(1)}%`}
                    </span>
                  </KpiTooltip>
                  {Math.abs(tradeStats.winRateDiff) >= 10 && (
                    <BadgeCheck className={`h-3 w-3 ${tradeStats.winRateDiff > 0 ? 'text-blue-300' : 'text-green-300'}`} />
                  )}
                </div>
              ) : (
                <div className="text-[9px] text-gray-500 italic">Vergleich nicht möglich</div>
              )}
            </div>
            
            {/* P/L Vergleich */}
            <div className="bg-black/20 rounded-lg border border-gray-800/40 p-2 flex flex-col items-center">
              <h4 className="text-[10px] uppercase tracking-wider opacity-70 text-center mb-1.5">Profit/Loss</h4>
              <div className="flex items-center justify-between w-full px-2 mb-2">
                <KpiTooltip
                  title="Gesamtgewinn/-verlust" 
                  jasperValue={tradeStats.jasperCount > 0 ? "$" + tradeStats.jasperTotalPL.toFixed(0) : "Keine Daten"} 
                  moValue={tradeStats.moCount > 0 ? "$" + tradeStats.moTotalPL.toFixed(0) : "Keine Daten"}
                  unit="$"
                >
                  <div className="flex items-center cursor-help">
                    <div className="h-5 w-2 bg-blue-500/40 rounded-full mr-2"></div>
                    <span className="text-xs font-bold text-blue-400">
                      {tradeStats.jasperCount > 0 ? "$" + tradeStats.jasperTotalPL.toFixed(0) : "-"}
                    </span>
                  </div>
                </KpiTooltip>
                <KpiTooltip
                  title="Gesamtgewinn/-verlust" 
                  jasperValue={tradeStats.jasperCount > 0 ? "$" + tradeStats.jasperTotalPL.toFixed(0) : "Keine Daten"} 
                  moValue={tradeStats.moCount > 0 ? "$" + tradeStats.moTotalPL.toFixed(0) : "Keine Daten"}
                  unit="$"
                >
                  <div className="flex items-center cursor-help">
                    <span className="text-xs font-bold text-green-400">
                      {tradeStats.moCount > 0 ? "$" + tradeStats.moTotalPL.toFixed(0) : "-"}
                    </span>
                    <div className="h-5 w-2 bg-green-500/40 rounded-full ml-2"></div>
                  </div>
                </KpiTooltip>
              </div>
              {tradeStats.jasperCount > 0 && tradeStats.moCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <KpiTooltip
                    title="Gesamtgewinn/-verlust" 
                    jasperValue={tradeStats.jasperTotalPL.toFixed(0)} 
                    moValue={tradeStats.moTotalPL.toFixed(0)}
                    unit="$"
                  >
                    <span className={`text-[9px] cursor-help hover:underline ${Math.abs(tradeStats.plDiff) < 10 ? 'text-gray-400' : tradeStats.plDiff > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                      {tradeStats.plLeader === 'Gleichstand' ? 'Gleichstand' : 
                      `${tradeStats.plLeader} +$${Math.abs(tradeStats.plDiff).toFixed(0)}`}
                    </span>
                  </KpiTooltip>
                  {Math.abs(tradeStats.plDiff) >= 500 && (
                    <BadgeCheck className={`h-3 w-3 ${tradeStats.plDiff > 0 ? 'text-blue-300' : 'text-green-300'}`} />
                  )}
                </div>
              ) : (
                <div className="text-[9px] text-gray-500 italic">Vergleich nicht möglich</div>
              )}
            </div>
            
            {/* RR Vergleich */}
            <div className="bg-black/20 rounded-lg border border-gray-800/40 p-2 flex flex-col items-center">
              <h4 className="text-[10px] uppercase tracking-wider opacity-70 text-center mb-1.5">Risk/Reward</h4>
              <div className="flex items-center justify-between w-full px-2 mb-2">
                <KpiTooltip
                  title="Risk/Reward Verhältnis" 
                  jasperValue={tradeStats.jasperCount > 0 ? tradeStats.jasperAvgRR.toFixed(2) + "R" : "Keine Daten"} 
                  moValue={tradeStats.moCount > 0 ? tradeStats.moAvgRR.toFixed(2) + "R" : "Keine Daten"}
                  unit="R"
                >
                  <div className="flex items-center cursor-help">
                    <div className="h-5 w-2 bg-blue-500/40 rounded-full mr-2"></div>
                    <span className="text-xs font-bold text-blue-400">
                      {tradeStats.jasperCount > 0 ? tradeStats.jasperAvgRR.toFixed(2) + "R" : "-"}
                    </span>
                  </div>
                </KpiTooltip>
                <KpiTooltip
                  title="Risk/Reward Verhältnis" 
                  jasperValue={tradeStats.jasperCount > 0 ? tradeStats.jasperAvgRR.toFixed(2) + "R" : "Keine Daten"} 
                  moValue={tradeStats.moCount > 0 ? tradeStats.moAvgRR.toFixed(2) + "R" : "Keine Daten"}
                  unit="R"
                >
                  <div className="flex items-center cursor-help">
                    <span className="text-xs font-bold text-green-400">
                      {tradeStats.moCount > 0 ? tradeStats.moAvgRR.toFixed(2) + "R" : "-"}
                    </span>
                    <div className="h-5 w-2 bg-green-500/40 rounded-full ml-2"></div>
                  </div>
                </KpiTooltip>
              </div>
              {tradeStats.jasperCount > 0 && tradeStats.moCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <KpiTooltip
                    title="Risk/Reward Verhältnis" 
                    jasperValue={tradeStats.jasperAvgRR.toFixed(2)} 
                    moValue={tradeStats.moAvgRR.toFixed(2)}
                    unit="R"
                  >
                    <span className={`text-[9px] cursor-help hover:underline ${Math.abs(tradeStats.rrDiff) < 0.1 ? 'text-gray-400' : tradeStats.rrDiff > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                      {tradeStats.rrLeader === 'Gleichstand' ? 'Gleichstand' : 
                      `${tradeStats.rrLeader} +${Math.abs(tradeStats.rrDiff).toFixed(2)}R`}
                    </span>
                  </KpiTooltip>
                  {Math.abs(tradeStats.rrDiff) >= 0.5 && (
                    <BadgeCheck className={`h-3 w-3 ${tradeStats.rrDiff > 0 ? 'text-blue-300' : 'text-green-300'}`} />
                  )}
                </div>
              ) : (
                <div className="text-[9px] text-gray-500 italic">Vergleich nicht möglich</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Statistik-Gruppen mit klaren Benutzer-Überschriften */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Jasper Statistiken */}
          <div className="space-y-4">
            {/* Jasper Kopfzeile */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-950/30 rounded-lg border border-blue-500/20">
              <div className="w-3 h-3 rounded-full bg-blue-500/80 shadow-sm shadow-blue-400/30"></div>
              <h3 className="text-base font-semibold text-blue-300">Jasper ({tradeStats.jasperCount} Trades)</h3>
            </div>
            
            {/* Jasper Win Rate */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-4 rounded-xl border border-primary/10 shadow-md">
              <h3 className="text-sm font-medium text-blue-300/80 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-1.5 text-blue-300/80" />
                Win Rate
              </h3>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <KpiTooltip
                      title="Win-Rate Vergleich"
                      jasperValue={tradeStats.jasperWinRate.toFixed(1) + "%"}
                      moValue={tradeStats.moWinRate.toFixed(1) + "%"}
                      unit="%"
                    >
                      <div className="flex items-center cursor-help">
                        <DonutChart 
                          percentage={tradeStats.jasperWinRate} 
                          color={tradeStats.jasperWinRate >= 65 ? 'rgba(59, 130, 246, 0.9)' : 
                                tradeStats.jasperWinRate >= 50 ? 'rgba(96, 165, 250, 0.9)' : 
                                'rgba(239, 68, 68, 0.9)'}
                          size={50}
                          strokeWidth={4}
                        />
                        <span className={`text-lg font-bold ml-3 ${tradeStats.jasperWinRate >= 50 ? 'text-blue-400' : 'text-red-400'}`}>
                          {tradeStats.jasperWinRate.toFixed(1)}%
                        </span>
                      </div>
                    </KpiTooltip>
                  </div>
                  <div className={`flex items-center text-[10px] rounded-md px-1.5 py-0.5 ${
                    tradeStats.jasperWinRate >= 65 ? 'bg-blue-900/40 text-blue-400 border border-blue-700/30' : 
                    tradeStats.jasperWinRate >= 50 ? 'bg-blue-900/40 text-blue-400 border border-blue-700/30' : 
                    'bg-red-900/40 text-red-400 border border-red-700/30'
                  }`}>
                    {tradeStats.jasperWins}W / {tradeStats.jasperLosses}L
                  </div>
                </div>
                
                {/* Sparkline für Win-Rate */}
                <div className="mt-2 p-2 bg-gradient-to-r from-blue-950/30 to-blue-900/10 rounded-md border border-blue-800/40 shadow-inner">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-blue-300/80 font-medium flex items-center">
                      <Activity className="w-3 h-3 mr-1 text-blue-400/70" />
                      Win-Rate Trend
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-900/30 text-blue-300/90">
                      {tradeStats.jasperWinHistory.length} trades
                    </span>
                  </div>
                  <div className="bg-blue-950/40 rounded p-1 backdrop-blur-sm relative overflow-hidden">
                    {/* Highlight-Bereiche für gute Win-Rate */}
                    <div className="absolute inset-0 flex flex-col">
                      <div className="h-1/3 w-full border-b border-dashed border-blue-500/10"></div>
                      <div className="h-1/3 w-full bg-blue-500/5 border-b border-dashed border-blue-500/20"></div>
                      <div className="h-1/3 w-full bg-blue-500/10"></div>
                    </div>
                    <div className="relative group">
                      <Sparklines 
                        data={tradeStats.jasperWinHistory.length > 0 ? 
                            tradeStats.jasperWinHistory.map(v => v * 100) : 
                            [0,0,0,0,0]} 
                        height={30} 
                        margin={5}
                        min={0}
                        max={100}
                      >
                        <SparklinesBars 
                          color="rgba(59, 130, 246, 0.8)" 
                          style={{ 
                            fill: "url(#blueGradient)",
                            filter: "drop-shadow(0 1px 2px rgba(37, 99, 235, 0.3))" 
                          }} 
                        />
                        <SparklinesSpots 
                          size={3} 
                          style={{ 
                            fill: 'white',
                            stroke: "rgba(59, 130, 246, 0.8)", 
                            strokeWidth: 2,
                          }} 
                        />
                        {/* SVG Definitionen für Gradienten */}
                        <defs>
                          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.9)" />
                            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
                          </linearGradient>
                        </defs>
                      </Sparklines>
                      
                      {/* Tooltip, der bei Hover erscheint */}
                      <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100">
                        {tradeStats.jasperWinHistory.length > 0 && tradeStats.jasperWinHistory.map((win, index) => {
                          const position = (index / (tradeStats.jasperWinHistory.length - 1 || 1)) * 100;
                          const jasperTrade = jasperTrades[jasperTrades.length - 1 - index];
                          if (!jasperTrade) return null;
                          
                          return (
                            <div 
                              key={`win-history-${index}`}
                              className="absolute top-0 h-full cursor-pointer" 
                              style={{ 
                                left: `${position}%`, 
                                width: `${100 / tradeStats.jasperWinHistory.length}%`
                              }}
                              title={`${jasperTrade.symbol || 'Trade'} - ${win ? 'Gewinn' : 'Verlust'} - ${new Date(jasperTrade.date).toLocaleDateString()}`}
                            >
                              <div className="opacity-0 hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 z-10 bg-black/90 border border-blue-500/30 rounded-md py-1.5 px-3 text-xs whitespace-nowrap pointer-events-none transition-opacity duration-150">
                                <div className="font-semibold mb-1 text-blue-300">{jasperTrade.symbol} - {jasperTrade.setup || 'Kein Setup'}</div>
                                <div className="flex justify-between gap-3">
                                  <span className="text-gray-300">Datum:</span>
                                  <span className="text-white">{new Date(jasperTrade.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                  <span className="text-gray-300">Ergebnis:</span>
                                  <span className={win ? 'text-green-400' : 'text-red-400'}>
                                    {win ? 'Gewinn' : 'Verlust'}
                                  </span>
                                </div>
                                {jasperTrade.profitLoss && (
                                  <div className="flex justify-between gap-3">
                                    <span className="text-gray-300">P/L:</span>
                                    <span className={jasperTrade.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                                      ${jasperTrade.profitLoss.toFixed(0)}
                                    </span>
                                  </div>
                                )}
                                {jasperTrade.rrAchieved && (
                                  <div className="flex justify-between gap-3">
                                    <span className="text-gray-300">R/R:</span>
                                    <span className={jasperTrade.rrAchieved >= 0 ? 'text-green-400' : 'text-red-400'}>
                                      {jasperTrade.rrAchieved.toFixed(1)}R
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Jasper P/L */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-4 rounded-xl border border-primary/10 shadow-md">
              <h3 className="text-sm font-medium text-blue-300/80 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1.5 text-blue-300/80" />
                Profit/Loss
              </h3>
              <div className="flex flex-col">
                <span className={`text-xl font-bold ${tradeStats.jasperTotalPL >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {tradeStats.jasperTotalPL >= 0 ? '+' : ''}{tradeStats.jasperTotalPL.toFixed(0)}$
                </span>
                <div className={`text-xs mt-1 ${tradeStats.jasperTotalPL >= 1000 ? 'text-blue-300' : 
                                              tradeStats.jasperTotalPL >= 0 ? 'text-blue-400/70' : 
                                              'text-red-400/70'}`}>
                  {tradeStats.jasperTotalPL >= 1000 ? 'Excellent' : 
                   tradeStats.jasperTotalPL >= 0 ? 'Profitable' : 
                   'Loss'}
                </div>
                
                {/* Sparkline für P/L-Trend */}
                <div className="mt-2 p-2 bg-gradient-to-r from-blue-950/30 to-blue-900/10 rounded-md border border-blue-800/40 shadow-inner">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-blue-300/80 font-medium flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-blue-400/70" />
                      P/L Trend
                    </span>
                    <div className="flex items-center gap-1.5">
                      {tradeStats.jasperPLHistory.length > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 
                          ${tradeStats.jasperPLHistory[tradeStats.jasperPLHistory.length - 1] >= tradeStats.jasperPLHistory[0] ? 
                          'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
                          {tradeStats.jasperPLHistory[tradeStats.jasperPLHistory.length - 1] >= tradeStats.jasperPLHistory[0] ? 
                            <ArrowUpRight className="w-2.5 h-2.5" /> : 
                            <ArrowDownRight className="w-2.5 h-2.5" />}
                          {Math.abs(tradeStats.jasperPLHistory[tradeStats.jasperPLHistory.length - 1] - tradeStats.jasperPLHistory[0]).toFixed(0)}$
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-950/40 rounded p-1 backdrop-blur-sm relative overflow-hidden">
                    {/* Null-Linie für P/L */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed border-blue-500/30 h-0"></div>
                    </div>
                    <div className="relative group">
                      <Sparklines 
                        data={tradeStats.jasperPLHistory.length > 0 ? tradeStats.jasperPLHistory : [0,0,0,0,0]} 
                        height={30} 
                        margin={5}
                      >
                        <SparklinesLine 
                          color="rgba(59, 130, 246, 0.8)" 
                          style={{
                            strokeWidth: 2,
                            fill: "rgba(59, 130, 246, 0.1)",
                            filter: "drop-shadow(0 1px 3px rgba(37, 99, 235, 0.4))"
                          }}
                        />
                        <SparklinesSpots 
                          size={3} 
                          style={{ 
                            fill: 'white',
                            stroke: "rgba(59, 130, 246, 0.8)", 
                            strokeWidth: 2,
                          }} 
                        />
                      </Sparklines>

                      {/* Tooltip, der bei Hover erscheint */}
                      <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100">
                        {tradeStats.jasperPLHistory.length > 0 && tradeStats.jasperPLHistory.map((pl, index) => {
                          const position = (index / (tradeStats.jasperPLHistory.length - 1 || 1)) * 100;
                          const jasperTrade = jasperTrades[jasperTrades.length - 1 - index];
                          if (!jasperTrade) return null;
                          
                          return (
                            <div 
                              key={`pl-history-${index}`}
                              className="absolute top-0 h-full cursor-pointer" 
                              style={{ 
                                left: `${position}%`, 
                                width: `${100 / tradeStats.jasperPLHistory.length}%`
                              }}
                            >
                              <div className="opacity-0 hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 z-10 bg-black/90 border border-blue-500/30 rounded-md py-1.5 px-3 text-xs whitespace-nowrap pointer-events-none transition-opacity duration-150">
                                <div className="font-semibold mb-1 text-blue-300">{jasperTrade.symbol} - {jasperTrade.setup || 'Kein Setup'}</div>
                                <div className="flex justify-between gap-3">
                                  <span className="text-gray-300">Datum:</span>
                                  <span className="text-white">{new Date(jasperTrade.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                  <span className="text-gray-300">Ergebnis:</span>
                                  <span className={jasperTrade.isWin ? 'text-green-400' : 'text-red-400'}>
                                    {jasperTrade.isWin ? 'Gewinn' : 'Verlust'}
                                  </span>
                                </div>
                                {jasperTrade.profitLoss && (
                                  <div className="flex justify-between gap-3">
                                    <span className="text-gray-300">P/L:</span>
                                    <span className={jasperTrade.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                                      ${jasperTrade.profitLoss.toFixed(0)}
                                    </span>
                                  </div>
                                )}
                                {jasperTrade.rrAchieved && (
                                  <div className="flex justify-between gap-3">
                                    <span className="text-gray-300">R/R:</span>
                                    <span className={jasperTrade.rrAchieved >= 0 ? 'text-green-400' : 'text-red-400'}>
                                      {jasperTrade.rrAchieved.toFixed(1)}R
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Jasper RR */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-4 rounded-xl border border-primary/10 shadow-md">
              <h3 className="text-sm font-medium text-blue-300/80 mb-2 flex items-center">
                <Activity className="w-4 h-4 mr-1.5 text-blue-300/80" />
                Risk/Reward Ratio
              </h3>
              <div className="flex flex-col">
                <span className={`text-xl font-bold ${
                  tradeStats.jasperAvgRR >= 1.5 ? 'text-blue-400' : 
                  tradeStats.jasperAvgRR >= 1 ? 'text-blue-300' : 
                  'text-red-400'
                }`}>
                  {tradeStats.jasperAvgRR.toFixed(2)}R
                </span>
                <div className={`text-xs mt-1 ${
                  tradeStats.jasperAvgRR >= 2 ? 'text-blue-300' : 
                  tradeStats.jasperAvgRR >= 1.5 ? 'text-blue-400/70' : 
                  tradeStats.jasperAvgRR >= 1 ? 'text-blue-400/50' : 
                  'text-red-400/70'
                }`}>
                  {tradeStats.jasperAvgRR >= 2 ? 'Excellent' : 
                   tradeStats.jasperAvgRR >= 1.5 ? 'Good' : 
                   tradeStats.jasperAvgRR >= 1 ? 'Average' : 'Poor'}
                </div>
                
                {/* Sparkline für RR-Trend */}
                <div className="mt-2 p-2 bg-gradient-to-r from-blue-950/30 to-blue-900/10 rounded-md border border-blue-800/40 shadow-inner">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-blue-300/80 font-medium flex items-center">
                      <Activity className="w-3 h-3 mr-1 text-blue-400/70" />
                      R/R Trend
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-900/30 text-blue-300/90">
                      Ø {tradeStats.jasperAvgRR.toFixed(2)}R
                    </span>
                  </div>
                  <div className="bg-blue-950/40 rounded p-1 backdrop-blur-sm relative overflow-hidden">
                    {/* Referenzlinien für RR */}
                    <div className="absolute inset-0 flex flex-col">
                      <div className="h-1/3 w-full border-b border-dashed border-blue-500/20"></div>
                      <div className="h-1/3 w-full border-b border-dashed border-blue-500/30"></div>
                    </div>
                    
                    {/* 1R Linie */}
                    <div className="absolute inset-0 flex items-center mt-6">
                      <div className="w-full border-t border-dashed border-green-500/30 h-0"></div>
                    </div>
                    
                    <Sparklines 
                      data={tradeStats.jasperRRHistory.length > 0 ? tradeStats.jasperRRHistory : [0,0,0,0,0]} 
                      height={30} 
                      margin={5}
                      min={0}
                    >
                      <SparklinesLine 
                        color="rgba(59, 130, 246, 0.8)" 
                        style={{
                          strokeWidth: 2,
                          filter: "drop-shadow(0 1px 3px rgba(37, 99, 235, 0.4))"
                        }}
                      />
                      <SparklinesSpots 
                        size={3} 
                        style={{ 
                          fill: 'white',
                          stroke: "rgba(59, 130, 246, 0.8)", 
                          strokeWidth: 2,
                        }} 
                      />
                    </Sparklines>
                  </div>
                </div>
                
                {/* Beste/Schlechteste Trades */}
                <div className="mt-3 flex flex-col gap-3">
                  <div className="group relative">
                    <div className={`p-0.5 rounded-lg bg-gradient-to-r from-blue-500/50 via-blue-400/30 to-blue-600/50 shadow-lg transition-all duration-300 ${tradeStats.jasperBestTrade ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="bg-gradient-to-br from-black/90 to-blue-950/80 backdrop-blur-sm p-3 rounded-md relative overflow-hidden">
                        {/* Top Indicator */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/0 via-blue-400/80 to-blue-400/0"></div>
                        
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center mb-1">
                              <BadgeCheck className="w-4 h-4 mr-1.5 text-blue-400" />
                              <h4 className="text-[11px] font-medium uppercase tracking-wide text-blue-200">Bester Trade</h4>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm font-bold text-blue-300">{tradeStats.jasperBestTrade?.symbol || '-'}</span>
                              {tradeStats.jasperBestTrade?.entryType && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full 
                                  ${tradeStats.jasperBestTrade.entryType === 'Long' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                  {tradeStats.jasperBestTrade.entryType}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {tradeStats.jasperBestTrade?.profitLoss && (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-blue-400">
                                +${tradeStats.jasperBestTrade.profitLoss.toFixed(0)}
                              </span>
                              <span className="text-[10px] text-blue-300/80">
                                {tradeStats.jasperBestTrade.rrAchieved?.toFixed(1)}R
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Details Row */}
                        {tradeStats.jasperBestTrade && (
                          <div className="mt-2 pt-2 border-t border-blue-500/10 grid grid-cols-3 gap-2 text-[9px]">
                            <div className="flex flex-col">
                              <span className="text-blue-300/60">Datum</span>
                              <span className="font-medium text-blue-200">
                                {new Date(tradeStats.jasperBestTrade.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-blue-300/60">Setup</span>
                              <span className="font-medium text-blue-200">
                                {tradeStats.jasperBestTrade.setup || '-'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-blue-300/60">Trend</span>
                              <span className="font-medium text-blue-200">
                                {tradeStats.jasperBestTrade.mainTrendM15 || '-'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Ausblenden wenn kein Trade vorhanden */}
                        {!tradeStats.jasperBestTrade && (
                          <div className="mt-2 text-[10px] italic text-blue-300/60 text-center">
                            Kein Trade verfügbar
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className={`p-0.5 rounded-lg bg-gradient-to-r from-red-500/50 via-red-400/30 to-red-600/50 shadow-lg transition-all duration-300 ${tradeStats.jasperWorstTrade ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="bg-gradient-to-br from-black/90 to-red-950/80 backdrop-blur-sm p-3 rounded-md relative overflow-hidden">
                        {/* Top Indicator */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400/0 via-red-400/80 to-red-400/0"></div>
                        
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center mb-1">
                              <AlertTriangle className="w-4 h-4 mr-1.5 text-red-400" />
                              <h4 className="text-[11px] font-medium uppercase tracking-wide text-red-200">Schlechtester Trade</h4>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm font-bold text-red-300">{tradeStats.jasperWorstTrade?.symbol || '-'}</span>
                              {tradeStats.jasperWorstTrade?.entryType && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full 
                                  ${tradeStats.jasperWorstTrade.entryType === 'Long' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                  {tradeStats.jasperWorstTrade.entryType}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {tradeStats.jasperWorstTrade?.profitLoss && (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-red-400">
                                ${tradeStats.jasperWorstTrade.profitLoss.toFixed(0)}
                              </span>
                              <span className="text-[10px] text-red-300/80">
                                {tradeStats.jasperWorstTrade.rrAchieved?.toFixed(1)}R
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Details Row */}
                        {tradeStats.jasperWorstTrade && (
                          <div className="mt-2 pt-2 border-t border-red-500/10 grid grid-cols-3 gap-2 text-[9px]">
                            <div className="flex flex-col">
                              <span className="text-red-300/60">Datum</span>
                              <span className="font-medium text-red-200">
                                {new Date(tradeStats.jasperWorstTrade.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-red-300/60">Setup</span>
                              <span className="font-medium text-red-200">
                                {tradeStats.jasperWorstTrade.setup || '-'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-red-300/60">Trend</span>
                              <span className="font-medium text-red-200">
                                {tradeStats.jasperWorstTrade.mainTrendM15 || '-'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Ausblenden wenn kein Trade vorhanden */}
                        {!tradeStats.jasperWorstTrade && (
                          <div className="mt-2 text-[10px] italic text-red-300/60 text-center">
                            Kein Trade verfügbar
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mo Statistiken */}
          <div className="space-y-4">
            {/* Mo Kopfzeile */}
            <div className="flex items-center gap-2 px-4 py-2 bg-green-950/30 rounded-lg border border-green-500/20">
              <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm shadow-green-400/30"></div>
              <h3 className="text-base font-semibold text-green-300">Mo ({tradeStats.moCount} Trades)</h3>
            </div>
            
            {/* Mo Win Rate */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-4 rounded-xl border border-primary/10 shadow-md">
              <h3 className="text-sm font-medium text-green-300/80 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-1.5 text-green-300/80" />
                Win Rate
              </h3>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <KpiTooltip
                    title="Win-Rate Vergleich"
                    jasperValue={tradeStats.jasperWinRate.toFixed(1) + "%"}
                    moValue={tradeStats.moWinRate.toFixed(1) + "%"}
                    unit="%"
                  >
                    <div className="flex items-center cursor-help">
                      <DonutChart 
                        percentage={tradeStats.moWinRate} 
                        color={tradeStats.moWinRate >= 65 ? 'rgba(16, 185, 129, 0.9)' : 
                               tradeStats.moWinRate >= 50 ? 'rgba(52, 211, 153, 0.9)' : 
                               'rgba(239, 68, 68, 0.9)'}
                        size={50}
                        strokeWidth={4}
                      />
                      <span className={`text-lg font-bold ml-3 ${tradeStats.moWinRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {tradeStats.moWinRate.toFixed(1)}%
                      </span>
                    </div>
                  </KpiTooltip>
                  <div className={`flex items-center text-[10px] rounded-md px-1.5 py-0.5 ${
                    tradeStats.moWinRate >= 65 ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 
                    tradeStats.moWinRate >= 50 ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 
                    'bg-red-900/40 text-red-400 border border-red-700/30'
                  }`}>
                    {tradeStats.moWins}W / {tradeStats.moLosses}L
                  </div>
                </div>
                
                {/* Sparkline für Win-Rate */}
                <div className="mt-2 p-2 bg-gradient-to-r from-green-950/30 to-green-900/10 rounded-md border border-green-800/40 shadow-inner">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-green-300/80 font-medium flex items-center">
                      <Activity className="w-3 h-3 mr-1 text-green-400/70" />
                      Win-Rate Trend
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-900/30 text-green-300/90">
                      {tradeStats.moWinHistory.length} trades
                    </span>
                  </div>
                  <div className="bg-green-950/40 rounded p-1 backdrop-blur-sm relative overflow-hidden">
                    {/* Highlight-Bereiche für gute Win-Rate */}
                    <div className="absolute inset-0 flex flex-col">
                      <div className="h-1/3 w-full border-b border-dashed border-green-500/10"></div>
                      <div className="h-1/3 w-full bg-green-500/5 border-b border-dashed border-green-500/20"></div>
                      <div className="h-1/3 w-full bg-green-500/10"></div>
                    </div>
                    <div className="relative group">
                      <Sparklines 
                        data={tradeStats.moWinHistory.length > 0 ? 
                            tradeStats.moWinHistory.map(v => v * 100) : 
                            [0,0,0,0,0]} 
                        height={30} 
                        margin={5}
                        min={0}
                        max={100}
                      >
                        <SparklinesBars 
                          color="rgba(16, 185, 129, 0.8)" 
                          style={{ 
                            fill: "url(#greenGradient)",
                            filter: "drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))" 
                          }} 
                        />
                        <SparklinesSpots 
                          size={3} 
                          style={{ 
                            fill: 'white',
                            stroke: "rgba(16, 185, 129, 0.8)", 
                            strokeWidth: 2,
                          }} 
                        />
                        {/* SVG Definitionen für Gradienten */}
                        <defs>
                          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.9)" />
                            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.3)" />
                          </linearGradient>
                        </defs>
                      </Sparklines>
                      
                      {/* Tooltip-Layer für Mo-Win-Rate */}
                      {tradeStats.moWinHistory.length > 0 && (
                        <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100">
                          {tradeStats.moWinHistory.map((win, index) => {
                            const position = (index / (tradeStats.moWinHistory.length - 1 || 1)) * 100;
                            // Finde den entsprechenden Trade aus der kombinierten Liste
                            const trade = combinedTradesFormatted.find(t => 
                              t.userName === 'Mo' && 
                              index === tradeStats.moWinHistory.length - 1 - combinedTradesFormatted.filter(ct => ct.userName === 'Mo').indexOf(t)
                            );
                            
                            if (!trade) return null;
                            
                            return (
                              <div 
                                key={`mo-win-tooltip-${index}`}
                                className="absolute top-0 h-full cursor-pointer" 
                                style={{ 
                                  left: `${position}%`, 
                                  width: `${100 / tradeStats.moWinHistory.length}%`
                                }}
                              >
                                <div className="opacity-0 hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 z-10 bg-black/90 border border-green-500/30 rounded-md py-1.5 px-3 text-xs whitespace-nowrap pointer-events-none transition-opacity duration-150">
                                  <div className="font-semibold mb-1 text-green-300">{trade.symbol} - {trade.setup || 'Kein Setup'}</div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-gray-300">Datum:</span>
                                    <span className="text-white">{new Date(trade.date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-gray-300">Ergebnis:</span>
                                    <span className={win ? 'text-green-400' : 'text-red-400'}>
                                      {win ? 'Gewinn' : 'Verlust'}
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mo P/L */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-4 rounded-xl border border-primary/10 shadow-md">
              <h3 className="text-sm font-medium text-green-300/80 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1.5 text-green-300/80" />
                Profit/Loss
              </h3>
              <div className="flex flex-col">
                <KpiTooltip
                  title="Gesamtgewinn/-verlust" 
                  jasperValue={tradeStats.jasperTotalPL.toFixed(0)} 
                  moValue={tradeStats.moTotalPL.toFixed(0)}
                  unit="$"
                >
                  <span className={`text-xl font-bold cursor-help ${tradeStats.moTotalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tradeStats.moTotalPL >= 0 ? '+' : ''}{tradeStats.moTotalPL.toFixed(0)}$
                  </span>
                </KpiTooltip>
                <div className={`text-xs mt-1 ${tradeStats.moTotalPL >= 1000 ? 'text-green-300' : 
                                            tradeStats.moTotalPL >= 0 ? 'text-green-400/70' : 
                                            'text-red-400/70'}`}>
                  {tradeStats.moTotalPL >= 1000 ? 'Excellent' : 
                   tradeStats.moTotalPL >= 0 ? 'Profitable' : 
                   'Loss'}
                </div>
                
                {/* Sparkline für P/L-Trend */}
                <div className="mt-2 p-2 bg-gradient-to-r from-green-950/30 to-green-900/10 rounded-md border border-green-800/40 shadow-inner">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-green-300/80 font-medium flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-green-400/70" />
                      P/L Trend
                    </span>
                    <div className="flex items-center gap-1.5">
                      {tradeStats.moPLHistory.length > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 
                          ${tradeStats.moPLHistory[tradeStats.moPLHistory.length - 1] >= tradeStats.moPLHistory[0] ? 
                          'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {tradeStats.moPLHistory[tradeStats.moPLHistory.length - 1] >= tradeStats.moPLHistory[0] ? 
                            <ArrowUpRight className="w-2.5 h-2.5" /> : 
                            <ArrowDownRight className="w-2.5 h-2.5" />}
                          {Math.abs(tradeStats.moPLHistory[tradeStats.moPLHistory.length - 1] - tradeStats.moPLHistory[0]).toFixed(0)}$
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-green-950/40 rounded p-1 backdrop-blur-sm relative overflow-hidden">
                    {/* Null-Linie für P/L */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed border-green-500/30 h-0"></div>
                    </div>
                    <div className="relative group">
                      <Sparklines 
                        data={tradeStats.moPLHistory.length > 0 ? tradeStats.moPLHistory : [0,0,0,0,0]} 
                        height={30} 
                        margin={5}
                      >
                        <SparklinesLine 
                          color="rgba(16, 185, 129, 0.8)" 
                          style={{
                            strokeWidth: 2,
                            fill: "rgba(16, 185, 129, 0.1)",
                            filter: "drop-shadow(0 1px 3px rgba(16, 185, 129, 0.4))"
                          }}
                        />
                        <SparklinesSpots 
                          size={3} 
                          style={{ 
                            fill: 'white',
                            stroke: "rgba(16, 185, 129, 0.8)", 
                            strokeWidth: 2,
                          }} 
                        />
                      </Sparklines>
                      
                      {/* Tooltip-Layer für PL-Verlauf */}
                      {tradeStats.moPLHistory.length > 0 && (
                        <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100">
                          {tradeStats.moPLHistory.map((pl, index) => {
                            const position = (index / (tradeStats.moPLHistory.length - 1 || 1)) * 100;
                            
                            // Finde den entsprechenden Trade aus moTradesFiltered
                            const trades = combinedTradesFormatted.filter((t: any) => t.userName === 'Mo');
                            const trade = trades[trades.length - 1 - index];
                            
                            if (!trade) return null;
                            
                            return (
                              <div 
                                key={`mo-pl-tooltip-${index}`}
                                className="absolute top-0 h-full cursor-pointer" 
                                style={{ 
                                  left: `${position}%`, 
                                  width: `${100 / tradeStats.moPLHistory.length}%`
                                }}
                              >
                                <TradeTooltip trade={trade} color="green" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mo RR */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-4 rounded-xl border border-primary/10 shadow-md">
              <h3 className="text-sm font-medium text-green-300/80 mb-2 flex items-center">
                <Activity className="w-4 h-4 mr-1.5 text-green-300/80" />
                Risk/Reward Ratio
              </h3>
              <div className="flex flex-col">
                <KpiTooltip 
                  title="Risk/Reward Verhältnis" 
                  jasperValue={tradeStats.jasperAvgRR.toFixed(2)} 
                  moValue={tradeStats.moAvgRR.toFixed(2)}
                  unit="R"
                >
                  <span className={`text-xl font-bold cursor-help ${
                    tradeStats.moAvgRR >= 1.5 ? 'text-green-400' : 
                    tradeStats.moAvgRR >= 1 ? 'text-green-300' : 
                    'text-red-400'
                  }`}>
                    {tradeStats.moAvgRR.toFixed(2)}R
                  </span>
                </KpiTooltip>
                <div className={`text-xs mt-1 ${
                  tradeStats.moAvgRR >= 2 ? 'text-green-300' : 
                  tradeStats.moAvgRR >= 1.5 ? 'text-green-400/70' : 
                  tradeStats.moAvgRR >= 1 ? 'text-green-400/50' : 
                  'text-red-400/70'
                }`}>
                  {tradeStats.moAvgRR >= 2 ? 'Excellent' : 
                   tradeStats.moAvgRR >= 1.5 ? 'Good' : 
                   tradeStats.moAvgRR >= 1 ? 'Average' : 'Poor'}
                </div>
                
                {/* Sparkline für RR-Trend */}
                <div className="mt-2 p-2 bg-gradient-to-r from-green-950/30 to-green-900/10 rounded-md border border-green-800/40 shadow-inner">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-green-300/80 font-medium flex items-center">
                      <Activity className="w-3 h-3 mr-1 text-green-400/70" />
                      R/R Trend
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-900/30 text-green-300/90">
                      Ø {tradeStats.moAvgRR.toFixed(2)}R
                    </span>
                  </div>
                  <div className="bg-green-950/40 rounded p-1 backdrop-blur-sm relative overflow-hidden">
                    {/* Referenzlinien für RR */}
                    <div className="absolute inset-0 flex flex-col">
                      <div className="h-1/3 w-full border-b border-dashed border-green-500/20"></div>
                      <div className="h-1/3 w-full border-b border-dashed border-green-500/30"></div>
                    </div>
                    
                    {/* 1R Linie */}
                    <div className="absolute inset-0 flex items-center mt-6">
                      <div className="w-full border-t border-dashed border-green-500/30 h-0"></div>
                    </div>
                    
                    <Sparklines 
                      data={tradeStats.moRRHistory.length > 0 ? tradeStats.moRRHistory : [0,0,0,0,0]} 
                      height={30} 
                      margin={5}
                      min={0}
                    >
                      <SparklinesLine 
                        color="rgba(16, 185, 129, 0.8)" 
                        style={{
                          strokeWidth: 2,
                          filter: "drop-shadow(0 1px 3px rgba(16, 185, 129, 0.4))"
                        }}
                      />
                      <SparklinesSpots 
                        size={3} 
                        style={{ 
                          fill: 'white',
                          stroke: "rgba(16, 185, 129, 0.8)", 
                          strokeWidth: 2,
                        }} 
                      />
                    </Sparklines>
                  </div>
                </div>
                
                {/* Beste/Schlechteste Trades */}
                <div className="mt-3 flex flex-col gap-3">
                  <div className="group relative">
                    <div className={`p-0.5 rounded-lg bg-gradient-to-r from-green-500/50 via-green-400/30 to-green-600/50 shadow-lg transition-all duration-300 ${tradeStats.moBestTrade ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="bg-gradient-to-br from-black/90 to-green-950/80 backdrop-blur-sm p-3 rounded-md relative overflow-hidden">
                        {/* Top Indicator */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400/0 via-green-400/80 to-green-400/0"></div>
                        
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center mb-1">
                              <BadgeCheck className="w-4 h-4 mr-1.5 text-green-400" />
                              <h4 className="text-[11px] font-medium uppercase tracking-wide text-green-200">Bester Trade</h4>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm font-bold text-green-300">{tradeStats.moBestTrade?.symbol || '-'}</span>
                              {tradeStats.moBestTrade?.entryType && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full 
                                  ${tradeStats.moBestTrade.entryType === 'Long' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                  {tradeStats.moBestTrade.entryType}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {tradeStats.moBestTrade?.profitLoss && (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-green-400">
                                +${tradeStats.moBestTrade.profitLoss.toFixed(0)}
                              </span>
                              <span className="text-[10px] text-green-300/80">
                                {tradeStats.moBestTrade.rrAchieved?.toFixed(1)}R
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Details Row */}
                        {tradeStats.moBestTrade && (
                          <div className="mt-2 pt-2 border-t border-green-500/10 grid grid-cols-3 gap-2 text-[9px]">
                            <div className="flex flex-col">
                              <span className="text-green-300/60">Datum</span>
                              <span className="font-medium text-green-200">
                                {new Date(tradeStats.moBestTrade.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-green-300/60">Setup</span>
                              <span className="font-medium text-green-200">
                                {tradeStats.moBestTrade.setup || '-'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-green-300/60">Trend</span>
                              <span className="font-medium text-green-200">
                                {tradeStats.moBestTrade.mainTrendM15 || '-'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Ausblenden wenn kein Trade vorhanden */}
                        {!tradeStats.moBestTrade && (
                          <div className="mt-2 text-[10px] italic text-green-300/60 text-center">
                            Kein Trade verfügbar
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className={`p-0.5 rounded-lg bg-gradient-to-r from-red-500/50 via-red-400/30 to-red-600/50 shadow-lg transition-all duration-300 ${tradeStats.moWorstTrade ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="bg-gradient-to-br from-black/90 to-red-950/80 backdrop-blur-sm p-3 rounded-md relative overflow-hidden">
                        {/* Top Indicator */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400/0 via-red-400/80 to-red-400/0"></div>
                        
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center mb-1">
                              <AlertTriangle className="w-4 h-4 mr-1.5 text-red-400" />
                              <h4 className="text-[11px] font-medium uppercase tracking-wide text-red-200">Schlechtester Trade</h4>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm font-bold text-red-300">{tradeStats.moWorstTrade?.symbol || '-'}</span>
                              {tradeStats.moWorstTrade?.entryType && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full 
                                  ${tradeStats.moWorstTrade.entryType === 'Long' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                  {tradeStats.moWorstTrade.entryType}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {tradeStats.moWorstTrade?.profitLoss && (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-red-400">
                                ${tradeStats.moWorstTrade.profitLoss.toFixed(0)}
                              </span>
                              <span className="text-[10px] text-red-300/80">
                                {tradeStats.moWorstTrade.rrAchieved?.toFixed(1)}R
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Details Row */}
                        {tradeStats.moWorstTrade && (
                          <div className="mt-2 pt-2 border-t border-red-500/10 grid grid-cols-3 gap-2 text-[9px]">
                            <div className="flex flex-col">
                              <span className="text-red-300/60">Datum</span>
                              <span className="font-medium text-red-200">
                                {new Date(tradeStats.moWorstTrade.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-red-300/60">Setup</span>
                              <span className="font-medium text-red-200">
                                {tradeStats.moWorstTrade.setup || '-'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-red-300/60">Trend</span>
                              <span className="font-medium text-red-200">
                                {tradeStats.moWorstTrade.mainTrendM15 || '-'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Ausblenden wenn kein Trade vorhanden */}
                        {!tradeStats.moWorstTrade && (
                          <div className="mt-2 text-[10px] italic text-red-300/60 text-center">
                            Kein Trade verfügbar
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

      </div>

      {/* Filter-Bar wurde entfernt */}

      <Card className="bg-black/50 border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="table" className="w-full">

            <TabsContent value="table" className="p-0 m-0">
              <TradeTable 
                trades={(filteredTrades.length > 0 ? filteredTrades : combinedTrades) as any} 
                isLoading={isLoadingAdmin || isLoadingMo}
                showColoredRows={true}
                showUserColumn={true}
                showHeader={false}
                showAccountProgress={false}
                onTradeSelect={setSelectedTrade}
                onActiveFiltersChange={(filters) => {
                  console.log("TradeTable sendet Filter zurück an TradeCompare:", filters);
                  // Nur aktualisieren, wenn Filter sich tatsächlich geändert haben
                  if (JSON.stringify(filters) !== JSON.stringify(activeFilters)) {
                    setActiveFilters(filters);
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Trade Details - Erscheint als Modal im gleichen Layout wie in Trades-Ansicht */}
      {selectedTrade && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedTrade(null)}>
          <DialogContent className="max-w-7xl w-[90vw] max-h-[85vh] overflow-y-auto bg-black/95 border border-primary/30 shadow-xl p-0">
            <DialogTitle className="sr-only">Trade Details</DialogTitle>
            <DialogDescription className="sr-only">
              Details des ausgewählten Trades
            </DialogDescription>
            <TradeDetail 
              selectedTrade={selectedTrade} 
              onTradeSelected={(updatedTrade) => {
                // Setze den neuen Trade in der lokalen State
                setSelectedTrade(updatedTrade);
                
                // Invalidiere den Cache, um alle Daten nach Änderungen neu zu laden
                queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
                
                console.log("Trade in der Vergleichsansicht aktualisiert:", updatedTrade);
                
                // Erzwinge eine Aktualisierung der kombinierten Daten
                setTimeout(() => {
                  queryClient.refetchQueries({ queryKey: ['/api/trades'] });
                }, 500);
              }}
              isCompareView={true}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
            <span>Jasper</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            <span>Mo</span>
          </div>
        </div>
      </div>
    </div>
  );
}