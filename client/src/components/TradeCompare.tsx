import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trade } from '@shared/schema';
import TradeTable from './TradeTable';
import FilterBar from './FilterBar';
import TradeDetail from './TradeDetail';
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
  Filter,
  Info,
  RefreshCw,
  BadgeCheck
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

// Farben für Benutzerunterscheidung
const USER_COLORS = {
  admin: 'bg-blue-500/10', // Jasper-Farbmarkierung
  jasper: 'bg-blue-500/10', // Alternative Namenskonvention
  mo: 'bg-green-500/10'
};

// Einfache Donut-Chart Komponente
const DonutChart = ({ percentage, color, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Hintergrund-Kreis */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(30, 30, 30, 0.5)"
          strokeWidth={strokeWidth}
        />
        {/* Fortschritts-Kreis */}
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
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-xs" style={{ color }}>
        {Math.round(percentage)}%
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
  if (!trades || trades.length === 0) return null;
  
  // Zuerst nur Trades mit gültigen profitLoss Werten filtern
  const validTrades = trades.filter(t => 
    t && typeof t.profitLoss === 'number' && !isNaN(t.profitLoss)
  );
  
  if (validTrades.length === 0) return null;
  
  return validTrades.reduce((best, current) => {
    // Bevorzuge höchsten Profit zuerst
    if ((current.profitLoss || 0) > (best.profitLoss || 0)) return current;
    // Bei gleichem Profit, bevorzuge höheres RR
    if ((current.profitLoss || 0) === (best.profitLoss || 0) && 
        (current.rrAchieved || 0) > (best.rrAchieved || 0)) return current;
    return best;
  }, validTrades[0]);
};

// Schlechtesten Trade finden
const findWorstTrade = (trades) => {
  if (!trades || trades.length === 0) return null;
  
  // Zuerst nur Trades mit gültigen profitLoss Werten filtern
  const validTrades = trades.filter(t => 
    t && typeof t.profitLoss === 'number' && !isNaN(t.profitLoss)
  );
  
  if (validTrades.length === 0) return null;
  
  return validTrades.reduce((worst, current) => {
    // Bevorzuge niedrigsten Profit zuerst (größten Verlust)
    if ((current.profitLoss || 0) < (worst.profitLoss || 0)) return current;
    // Bei gleichem Verlust, bevorzuge niedrigeres RR
    if ((current.profitLoss || 0) === (worst.profitLoss || 0) && 
        (current.rrAchieved || 0) < (worst.rrAchieved || 0)) return current;
    return worst;
  }, validTrades[0]);
};

export default function TradeCompare() {
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
  
  // Statistik-Berechnungen für die angezeigten Trades, unterteilt nach Benutzer
  const tradeStats = useMemo(() => {
    // Verwende die gefilterten Trades für die Statistik-Berechnung
    const tradesToUse = filteredTrades.length > 0 ? filteredTrades : combinedTrades;
    
    // Trades nach Benutzer unterteilen
    const jasperTrades = tradesToUse.filter((t: any) => t.userName === 'Jasper');
    const moTrades = tradesToUse.filter((t: any) => t.userName === 'Mo');
    
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
    
    // Jasper-Statistiken
    const jasperCount = jasperTrades.length;
    const jasperWins = jasperTrades.filter(t => t.isWin === true).length;
    const jasperLosses = jasperTrades.filter(t => t.isWin === false).length;
    const jasperWinRate = jasperCount > 0 ? (jasperWins / jasperCount) * 100 : 0;
    
    const jasperTotalPL = jasperTrades.reduce((sum, trade) => {
      return sum + (trade.profitLoss || 0);
    }, 0);
    
    const jasperAvgRR = jasperTrades.reduce((sum, trade) => {
      return sum + (trade.rrAchieved || 0);
    }, 0) / (jasperCount || 1);
    
    // Datenpunkte für historische Visualisierung - Jasper
    const jasperWinHistory = jasperTrades.slice(0, 10).map(t => t.isWin ? 1 : 0).reverse();
    const jasperPLHistory = jasperTrades.slice(0, 10).map(t => t.profitLoss || 0).reverse();
    const jasperRRHistory = jasperTrades.slice(0, 10).map(t => t.rrAchieved || 0).reverse();
    
    // Bester und schlechtester Trade für Jasper
    const jasperBestTrade = findBestTrade(jasperTrades);
    const jasperWorstTrade = findWorstTrade(jasperTrades);
    
    // Mo-Statistiken
    const moCount = moTrades.length;
    const moWins = moTrades.filter(t => t.isWin === true).length;
    const moLosses = moTrades.filter(t => t.isWin === false).length;
    const moWinRate = moCount > 0 ? (moWins / moCount) * 100 : 0;
    
    const moTotalPL = moTrades.reduce((sum, trade) => {
      return sum + (trade.profitLoss || 0);
    }, 0);
    
    const moAvgRR = moTrades.reduce((sum, trade) => {
      return sum + (trade.rrAchieved || 0);
    }, 0) / (moCount || 1);
    
    // Datenpunkte für historische Visualisierung - Mo
    const moWinHistory = moTrades.slice(0, 10).map(t => t.isWin ? 1 : 0).reverse();
    const moPLHistory = moTrades.slice(0, 10).map(t => t.profitLoss || 0).reverse();
    const moRRHistory = moTrades.slice(0, 10).map(t => t.rrAchieved || 0).reverse();
    
    // Bester und schlechtester Trade für Mo
    const moBestTrade = findBestTrade(moTrades);
    const moWorstTrade = findWorstTrade(moTrades);

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
    
    // Hier zusätzlich die Trades filtern, basierend auf den neuen Filtern
    if (!isLoadingAdmin && !isLoadingMo && combinedTrades.length > 0) {
      // Filtern mit den neuen Filtern
      const newFilteredTrades = combinedTrades.filter((trade: any) => {
        // Symbol Filter
        if (newFilters.symbol !== 'all' && newFilters.symbols?.length > 0 && !newFilters.symbols.includes(trade.symbol)) {
          return false;
        }
        
        // Account Type Filter
        if (newFilters.accountType !== 'all' && newFilters.accountTypes?.length > 0 && !newFilters.accountTypes.includes(trade.accountType)) {
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
      // Wenn keine Trades oder noch geladen wird, setze gefilterte Trades gleich den kombinierten Trades
      setFilteredTrades(combinedTrades);
    }
  };

  return (
    <div className="container mx-auto p-4">
      
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
                  <PopoverContent className="w-56 p-3 bg-black/90 border border-primary/30">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-primary mb-2">Schnellauswahl Zeitraum</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`w-full text-xs justify-start mb-1 ${selectedTimeRange === "7days" ? "bg-primary/20 border-primary/40" : ""}`}
                        onClick={() => applyDateFilter("7days")}
                      >
                        Letzte 7 Tage
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`w-full text-xs justify-start mb-1 ${selectedTimeRange === "30days" ? "bg-primary/20 border-primary/40" : ""}`}
                        onClick={() => applyDateFilter("30days")}
                      >
                        Letzte 30 Tage
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`w-full text-xs justify-start mb-1 ${selectedTimeRange === "month" ? "bg-primary/20 border-primary/40" : ""}`}
                        onClick={() => applyDateFilter("month")}
                      >
                        Aktueller Monat
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`w-full text-xs justify-start ${selectedTimeRange === "all" ? "bg-primary/20 border-primary/40" : ""}`}
                        onClick={() => applyDateFilter("all")}
                      >
                        Alle Trades
                      </Button>
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
          
          <div className="grid grid-cols-3 gap-2">
            {/* Win Rate Vergleich */}
            <div className="bg-black/20 rounded-lg border border-gray-800/40 p-2 flex flex-col items-center">
              <h4 className="text-[10px] uppercase tracking-wider opacity-70 text-center mb-1.5">Win Rate</h4>
              <div className="flex items-center justify-between w-full px-2 mb-2">
                <div className="flex items-center">
                  <div className="h-5 w-2 bg-blue-500/40 rounded-full mr-2"></div>
                  <span className="text-xs font-bold text-blue-400">{tradeStats.jasperWinRate.toFixed(0)}%</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-bold text-green-400">{tradeStats.moWinRate.toFixed(0)}%</span>
                  <div className="h-5 w-2 bg-green-500/40 rounded-full ml-2"></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] ${Math.abs(tradeStats.winRateDiff) < 1 ? 'text-gray-400' : tradeStats.winRateDiff > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                  {tradeStats.winRateLeader === 'Gleichstand' ? 'Gleichstand' : 
                   `${tradeStats.winRateLeader} +${Math.abs(tradeStats.winRateDiff).toFixed(1)}%`}
                </span>
                {Math.abs(tradeStats.winRateDiff) >= 10 && (
                  <BadgeCheck className={`h-3 w-3 ${tradeStats.winRateDiff > 0 ? 'text-blue-300' : 'text-green-300'}`} />
                )}
              </div>
            </div>
            
            {/* P/L Vergleich */}
            <div className="bg-black/20 rounded-lg border border-gray-800/40 p-2 flex flex-col items-center">
              <h4 className="text-[10px] uppercase tracking-wider opacity-70 text-center mb-1.5">Profit/Loss</h4>
              <div className="flex items-center justify-between w-full px-2 mb-2">
                <div className="flex items-center">
                  <div className="h-5 w-2 bg-blue-500/40 rounded-full mr-2"></div>
                  <span className="text-xs font-bold text-blue-400">${tradeStats.jasperTotalPL.toFixed(0)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-bold text-green-400">${tradeStats.moTotalPL.toFixed(0)}</span>
                  <div className="h-5 w-2 bg-green-500/40 rounded-full ml-2"></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] ${Math.abs(tradeStats.plDiff) < 10 ? 'text-gray-400' : tradeStats.plDiff > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                  {tradeStats.plLeader === 'Gleichstand' ? 'Gleichstand' : 
                   `${tradeStats.plLeader} +$${Math.abs(tradeStats.plDiff).toFixed(0)}`}
                </span>
                {Math.abs(tradeStats.plDiff) >= 500 && (
                  <BadgeCheck className={`h-3 w-3 ${tradeStats.plDiff > 0 ? 'text-blue-300' : 'text-green-300'}`} />
                )}
              </div>
            </div>
            
            {/* RR Vergleich */}
            <div className="bg-black/20 rounded-lg border border-gray-800/40 p-2 flex flex-col items-center">
              <h4 className="text-[10px] uppercase tracking-wider opacity-70 text-center mb-1.5">Risk/Reward</h4>
              <div className="flex items-center justify-between w-full px-2 mb-2">
                <div className="flex items-center">
                  <div className="h-5 w-2 bg-blue-500/40 rounded-full mr-2"></div>
                  <span className="text-xs font-bold text-blue-400">{tradeStats.jasperAvgRR.toFixed(2)}R</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-bold text-green-400">{tradeStats.moAvgRR.toFixed(2)}R</span>
                  <div className="h-5 w-2 bg-green-500/40 rounded-full ml-2"></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] ${Math.abs(tradeStats.rrDiff) < 0.1 ? 'text-gray-400' : tradeStats.rrDiff > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                  {tradeStats.rrLeader === 'Gleichstand' ? 'Gleichstand' : 
                   `${tradeStats.rrLeader} +${Math.abs(tradeStats.rrDiff).toFixed(2)}R`}
                </span>
                {Math.abs(tradeStats.rrDiff) >= 0.5 && (
                  <BadgeCheck className={`h-3 w-3 ${tradeStats.rrDiff > 0 ? 'text-blue-300' : 'text-green-300'}`} />
                )}
              </div>
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
                  <div className={`flex items-center text-[10px] rounded-md px-1.5 py-0.5 ${
                    tradeStats.jasperWinRate >= 65 ? 'bg-blue-900/40 text-blue-400 border border-blue-700/30' : 
                    tradeStats.jasperWinRate >= 50 ? 'bg-blue-900/40 text-blue-400 border border-blue-700/30' : 
                    'bg-red-900/40 text-red-400 border border-red-700/30'
                  }`}>
                    {tradeStats.jasperWins}W / {tradeStats.jasperLosses}L
                  </div>
                </div>
                
                {/* Sparkline für Win-Rate */}
                <div className="mt-2 p-1 bg-blue-950/20 rounded-md border border-blue-900/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-blue-300/60">Win-Rate Trend</span>
                  </div>
                  <Sparklines data={tradeStats.jasperWinHistory.length > 0 ? 
                            tradeStats.jasperWinHistory.map(v => v * 100) : 
                            [0,0,0,0,0]} 
                           height={20} margin={5}>
                    <SparklinesBars color="rgba(59, 130, 246, 0.8)" />
                  </Sparklines>
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
                <div className="mt-2 p-1 bg-blue-950/20 rounded-md border border-blue-900/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-blue-300/60">P/L Trend</span>
                    {tradeStats.jasperPLHistory.length > 0 && (
                      <span className="text-[10px] text-blue-300/60">
                        {tradeStats.jasperPLHistory[tradeStats.jasperPLHistory.length - 1] >= tradeStats.jasperPLHistory[0] ? 
                          <TrendingUp className="w-3 h-3 text-blue-400" /> : 
                          <TrendingDown className="w-3 h-3 text-blue-400" />}
                      </span>
                    )}
                  </div>
                  <Sparklines data={tradeStats.jasperPLHistory.length > 0 ? tradeStats.jasperPLHistory : [0,0,0,0,0]} height={20} margin={5}>
                    <SparklinesLine color="rgba(59, 130, 246, 0.8)" style={{ fill: "rgba(59, 130, 246, 0.2)" }} />
                    <SparklinesSpots size={1.5} style={{ fill: "rgba(59, 130, 246, 0.8)" }} />
                  </Sparklines>
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
                <div className="mt-2 p-1 bg-blue-950/20 rounded-md border border-blue-900/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-blue-300/60">R/R Trend</span>
                  </div>
                  <Sparklines data={tradeStats.jasperRRHistory.length > 0 ? tradeStats.jasperRRHistory : [0,0,0,0,0]} height={20} margin={5}>
                    <SparklinesLine color="rgba(59, 130, 246, 0.8)" />
                  </Sparklines>
                </div>
                
                {/* Beste/Schlechteste Trades */}
                <div className="mt-3 flex flex-col gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-[10px] p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors duration-200 cursor-pointer">
                          <span className="flex items-center">
                            <BadgeCheck className="w-3 h-3 mr-1.5 text-blue-400" />
                            Bester Trade
                          </span>
                          <span className="font-medium text-blue-300">
                            {tradeStats.jasperBestTrade?.symbol || '-'}
                          </span>
                        </div>
                      </TooltipTrigger>
                      {tradeStats.jasperBestTrade && (
                        <TooltipContent side="right" className="bg-black/95 border-blue-500/30 p-3 max-w-[280px]">
                          <h4 className="text-sm font-medium text-blue-400 mb-1">{tradeStats.jasperBestTrade.symbol}</h4>
                          <div className="text-xs space-y-1 text-gray-300">
                            <div className="flex justify-between">
                              <span>Profit/Loss:</span>
                              <span className="font-medium text-blue-300">${tradeStats.jasperBestTrade.profitLoss?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>R/R:</span>
                              <span className="font-medium text-blue-300">{tradeStats.jasperBestTrade.rrAchieved?.toFixed(2)}R</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Datum:</span>
                              <span className="font-medium">{new Date(tradeStats.jasperBestTrade.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-[10px] p-1.5 rounded-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors duration-200 cursor-pointer">
                          <span className="flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1.5 text-red-400" />
                            Schlechtester Trade
                          </span>
                          <span className="font-medium text-red-300">
                            {tradeStats.jasperWorstTrade?.symbol || '-'}
                          </span>
                        </div>
                      </TooltipTrigger>
                      {tradeStats.jasperWorstTrade && (
                        <TooltipContent side="right" className="bg-black/95 border-red-500/30 p-3 max-w-[280px]">
                          <h4 className="text-sm font-medium text-red-400 mb-1">{tradeStats.jasperWorstTrade.symbol}</h4>
                          <div className="text-xs space-y-1 text-gray-300">
                            <div className="flex justify-between">
                              <span>Profit/Loss:</span>
                              <span className="font-medium text-red-300">${tradeStats.jasperWorstTrade.profitLoss?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>R/R:</span>
                              <span className="font-medium text-red-300">{tradeStats.jasperWorstTrade.rrAchieved?.toFixed(2)}R</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Datum:</span>
                              <span className="font-medium">{new Date(tradeStats.jasperWorstTrade.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
                  <div className="flex items-center">
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
                  <div className={`flex items-center text-[10px] rounded-md px-1.5 py-0.5 ${
                    tradeStats.moWinRate >= 65 ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 
                    tradeStats.moWinRate >= 50 ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 
                    'bg-red-900/40 text-red-400 border border-red-700/30'
                  }`}>
                    {tradeStats.moWins}W / {tradeStats.moLosses}L
                  </div>
                </div>
                
                {/* Sparkline für Win-Rate */}
                <div className="mt-2 p-1 bg-green-950/20 rounded-md border border-green-900/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-green-300/60">Win-Rate Trend</span>
                  </div>
                  <Sparklines data={tradeStats.moWinHistory.length > 0 ? 
                            tradeStats.moWinHistory.map(v => v * 100) : 
                            [0,0,0,0,0]} 
                           height={20} margin={5}>
                    <SparklinesBars color="rgba(16, 185, 129, 0.8)" />
                  </Sparklines>
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
                <span className={`text-xl font-bold ${tradeStats.moTotalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tradeStats.moTotalPL >= 0 ? '+' : ''}{tradeStats.moTotalPL.toFixed(0)}$
                </span>
                <div className={`text-xs mt-1 ${tradeStats.moTotalPL >= 1000 ? 'text-green-300' : 
                                            tradeStats.moTotalPL >= 0 ? 'text-green-400/70' : 
                                            'text-red-400/70'}`}>
                  {tradeStats.moTotalPL >= 1000 ? 'Excellent' : 
                   tradeStats.moTotalPL >= 0 ? 'Profitable' : 
                   'Loss'}
                </div>
                
                {/* Sparkline für P/L-Trend */}
                <div className="mt-2 p-1 bg-green-950/20 rounded-md border border-green-900/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-green-300/60">P/L Trend</span>
                    {tradeStats.moPLHistory.length > 0 && (
                      <span className="text-[10px] text-green-300/60">
                        {tradeStats.moPLHistory[tradeStats.moPLHistory.length - 1] >= tradeStats.moPLHistory[0] ? 
                          <TrendingUp className="w-3 h-3 text-green-400" /> : 
                          <TrendingDown className="w-3 h-3 text-green-400" />}
                      </span>
                    )}
                  </div>
                  <Sparklines data={tradeStats.moPLHistory.length > 0 ? tradeStats.moPLHistory : [0,0,0,0,0]} height={20} margin={5}>
                    <SparklinesLine color="rgba(16, 185, 129, 0.8)" style={{ fill: "rgba(16, 185, 129, 0.2)" }} />
                    <SparklinesSpots size={1.5} style={{ fill: "rgba(16, 185, 129, 0.8)" }} />
                  </Sparklines>
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
                <span className={`text-xl font-bold ${
                  tradeStats.moAvgRR >= 1.5 ? 'text-green-400' : 
                  tradeStats.moAvgRR >= 1 ? 'text-green-300' : 
                  'text-red-400'
                }`}>
                  {tradeStats.moAvgRR.toFixed(2)}R
                </span>
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
                <div className="mt-2 p-1 bg-green-950/20 rounded-md border border-green-900/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-green-300/60">R/R Trend</span>
                  </div>
                  <Sparklines data={tradeStats.moRRHistory.length > 0 ? tradeStats.moRRHistory : [0,0,0,0,0]} height={20} margin={5}>
                    <SparklinesLine color="rgba(16, 185, 129, 0.8)" />
                  </Sparklines>
                </div>
                
                {/* Beste/Schlechteste Trades */}
                <div className="mt-3 flex flex-col gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-[10px] p-1.5 rounded-md bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors duration-200 cursor-pointer">
                          <span className="flex items-center">
                            <BadgeCheck className="w-3 h-3 mr-1.5 text-green-400" />
                            Bester Trade
                          </span>
                          <span className="font-medium text-green-300">
                            {tradeStats.moBestTrade?.symbol || '-'}
                          </span>
                        </div>
                      </TooltipTrigger>
                      {tradeStats.moBestTrade && (
                        <TooltipContent side="right" className="bg-black/95 border-green-500/30 p-3 max-w-[280px]">
                          <h4 className="text-sm font-medium text-green-400 mb-1">{tradeStats.moBestTrade.symbol}</h4>
                          <div className="text-xs space-y-1 text-gray-300">
                            <div className="flex justify-between">
                              <span>Profit/Loss:</span>
                              <span className="font-medium text-green-300">${tradeStats.moBestTrade.profitLoss?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>R/R:</span>
                              <span className="font-medium text-green-300">{tradeStats.moBestTrade.rrAchieved?.toFixed(2)}R</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Datum:</span>
                              <span className="font-medium">{new Date(tradeStats.moBestTrade.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-[10px] p-1.5 rounded-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors duration-200 cursor-pointer">
                          <span className="flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1.5 text-red-400" />
                            Schlechtester Trade
                          </span>
                          <span className="font-medium text-red-300">
                            {tradeStats.moWorstTrade?.symbol || '-'}
                          </span>
                        </div>
                      </TooltipTrigger>
                      {tradeStats.moWorstTrade && (
                        <TooltipContent side="right" className="bg-black/95 border-red-500/30 p-3 max-w-[280px]">
                          <h4 className="text-sm font-medium text-red-400 mb-1">{tradeStats.moWorstTrade.symbol}</h4>
                          <div className="text-xs space-y-1 text-gray-300">
                            <div className="flex justify-between">
                              <span>Profit/Loss:</span>
                              <span className="font-medium text-red-300">${tradeStats.moWorstTrade.profitLoss?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>R/R:</span>
                              <span className="font-medium text-red-300">{tradeStats.moWorstTrade.rrAchieved?.toFixed(2)}R</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Datum:</span>
                              <span className="font-medium">{new Date(tradeStats.moWorstTrade.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
      
      {/* Trade Details - Erscheint als Modal */}
      {selectedTrade && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedTrade(null)}>
          <DialogContent className="max-w-7xl w-[90vw] max-h-[85vh] overflow-y-auto bg-black/95 border border-primary/30 shadow-xl p-0">
            <DialogTitle className="sr-only">Trade Details</DialogTitle>
            <DialogDescription className="sr-only">
              Details des ausgewählten Trades
            </DialogDescription>
            <TradeDetail 
              selectedTrade={selectedTrade} 
              onTradeSelected={setSelectedTrade} 
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