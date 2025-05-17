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
  Activity, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';

// Farben für Benutzerunterscheidung
const USER_COLORS = {
  admin: 'bg-blue-500/10', // Jasper-Farbmarkierung
  jasper: 'bg-blue-500/10', // Alternative Namenskonvention
  mo: 'bg-green-500/10'
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
      moCount,
      moWins,
      moLosses,
      moWinRate,
      moTotalPL,
      moAvgRR
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

  // Filter-Handler
  const handleFilterChange = (newFilters: any) => {
    console.log("TradeCompare - Neue Filter empfangen:", newFilters);
    setActiveFilters(newFilters);
    
    // Hier zusätzlich die Trades filtern, basierend auf den neuen Filtern
    if (!isLoadingAdmin && !isLoadingMo && combinedTrades.length > 0) {
      // Filtern mit den neuen Filtern
      const newFilteredTrades = combinedTrades.filter((trade: any) => {
        // Symbol Filter
        if (newFilters.symbol !== 'all' && trade.symbol !== newFilters.symbol) {
          return false;
        }
        
        // Account Type Filter
        if (newFilters.accountType !== 'all' && trade.accountType !== newFilters.accountType) {
          return false;
        }
        
        // Session Filter
        if (newFilters.session !== 'all' && trade.session !== newFilters.session) {
          return false;
        }
        
        // Setup Filter
        if (newFilters.setup !== 'all' && trade.setup !== newFilters.setup) {
          return false;
        }
        
        // Entry Type Filter
        if (newFilters.entryType !== 'all' && trade.entryType !== newFilters.entryType) {
          return false;
        }
        
        // Date Filter
        if (newFilters.dateFrom || newFilters.dateTo) {
          const tradeDate = new Date(trade.date);
          
          if (newFilters.dateFrom) {
            const fromDate = new Date(newFilters.dateFrom);
            if (tradeDate < fromDate) {
              return false;
            }
          }
          
          if (newFilters.dateTo) {
            const toDate = new Date(newFilters.dateTo);
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
      <div className="flex items-center gap-2 mb-4">
        <Link to="/">
          <ChevronLeft className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
        <h1 className="text-2xl font-bold">Trade-Vergleich</h1>
      </div>

      <Separator className="my-4" />
      
      {/* Dynamische Statistik-Bar für den Vergleich-Tab */}
      <div className="mb-5 bg-gradient-to-r from-black/20 to-black/10 rounded-lg p-2 border border-primary/10 backdrop-blur-sm shadow-md">
        {/* Titel mit Benutzer-Identifikation */}
        <div className="flex justify-between items-center mb-3 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
            <h3 className="text-sm font-medium">Jasper ({tradeStats.jasperCount} Trades)</h3>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Mo ({tradeStats.moCount} Trades)</h3>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
        </div>
        
        {/* Statistik-Vergleich Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Win Rate Vergleich */}
          <div className="bg-black/20 p-3 rounded-md border border-primary/5">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
              <Target className="w-3 h-3 mr-1 text-primary/70" />
              Win Rate
            </h3>
            <div className="flex justify-between items-center gap-2">
              {/* Jasper Win Rate */}
              <div className="flex flex-col items-start">
                <div className="flex gap-1 items-center">
                  <span className={`text-sm font-bold ${tradeStats.jasperWinRate >= 50 ? 'text-blue-400' : 'text-red-400'}`}>
                    {tradeStats.jasperWinRate.toFixed(1)}%
                  </span>
                  <div className={`flex items-center text-[10px] rounded-sm px-1 ${
                    tradeStats.jasperWinRate >= 65 ? 'bg-blue-500/5 text-blue-400' : 
                    tradeStats.jasperWinRate >= 50 ? 'bg-blue-500/5 text-blue-400' : 
                    'bg-red-500/5 text-red-400'
                  }`}>
                    ({tradeStats.jasperWins}W/{tradeStats.jasperLosses}L)
                  </div>
                </div>
                <div className="w-full mt-1 bg-gray-800/30 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(tradeStats.jasperWinRate, 5))}%`,
                      background: `${
                        tradeStats.jasperWinRate >= 65 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : 
                        tradeStats.jasperWinRate >= 50 ? 'linear-gradient(90deg, #60a5fa, #93c5fd)' : 
                        'linear-gradient(90deg, #ef4444, #f87171)'
                      }`
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Mo Win Rate */}
              <div className="flex flex-col items-end">
                <div className="flex gap-1 items-center">
                  <div className={`flex items-center text-[10px] rounded-sm px-1 ${
                    tradeStats.moWinRate >= 65 ? 'bg-green-500/5 text-green-400' : 
                    tradeStats.moWinRate >= 50 ? 'bg-green-500/5 text-green-400' : 
                    'bg-red-500/5 text-red-400'
                  }`}>
                    ({tradeStats.moWins}W/{tradeStats.moLosses}L)
                  </div>
                  <span className={`text-sm font-bold ${tradeStats.moWinRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {tradeStats.moWinRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full mt-1 bg-gray-800/30 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(tradeStats.moWinRate, 5))}%`,
                      background: `${
                        tradeStats.moWinRate >= 65 ? 'linear-gradient(90deg, #10b981, #34d399)' : 
                        tradeStats.moWinRate >= 50 ? 'linear-gradient(90deg, #34d399, #6ee7b7)' : 
                        'linear-gradient(90deg, #ef4444, #f87171)'
                      }`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* P/L Vergleich */}
          <div className="bg-black/20 p-3 rounded-md border border-primary/5">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
              <DollarSign className="w-3 h-3 mr-1 text-primary/70" />
              Profit/Loss
            </h3>
            <div className="flex justify-between items-center gap-2">
              {/* Jasper P/L */}
              <div className="flex items-center">
                <span className={`text-sm font-bold ${tradeStats.jasperTotalPL >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {tradeStats.jasperTotalPL >= 0 ? '+' : ''}{tradeStats.jasperTotalPL.toFixed(0)}$
                </span>
              </div>
              
              {/* Mo P/L */}
              <div className="flex items-center">
                <span className={`text-sm font-bold ${tradeStats.moTotalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tradeStats.moTotalPL >= 0 ? '+' : ''}{tradeStats.moTotalPL.toFixed(0)}$
                </span>
              </div>
            </div>
          </div>
          
          {/* RR Vergleich */}
          <div className="bg-black/20 p-3 rounded-md border border-primary/5">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
              <Activity className="w-3 h-3 mr-1 text-primary/70" />
              Risk/Reward
            </h3>
            <div className="flex justify-between items-center gap-2">
              {/* Jasper RR */}
              <div className="flex items-center">
                <span className={`text-sm font-bold ${
                  tradeStats.jasperAvgRR >= 1.5 ? 'text-blue-400' : 
                  tradeStats.jasperAvgRR >= 1 ? 'text-blue-300' : 
                  'text-red-400'
                }`}>
                  {tradeStats.jasperAvgRR.toFixed(2)}R
                </span>
              </div>
              
              {/* Mo RR */}
              <div className="flex items-center">
                <span className={`text-sm font-bold ${
                  tradeStats.moAvgRR >= 1.5 ? 'text-green-400' : 
                  tradeStats.moAvgRR >= 1 ? 'text-green-300' : 
                  'text-red-400'
                }`}>
                  {tradeStats.moAvgRR.toFixed(2)}R
                </span>
              </div>
            </div>
          </div>
          
          {/* Gesamtstatistik */}
          <div className="bg-black/20 p-3 rounded-md border border-primary/5">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
              <BarChart2 className="w-3 h-3 mr-1 text-primary/70" />
              Gesamt
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Win Rate</div>
                <div className={`text-sm font-bold ${tradeStats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tradeStats.winRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">P/L</div>
                <div className={`text-sm font-bold ${tradeStats.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tradeStats.totalPL.toFixed(0)}$
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
              Detailansicht eines ausgewählten Trades mit allen Parametern und Eigenschaften.
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