import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trade } from '@shared/schema';
import TradeTable from './TradeTable';
import FilterBar from './FilterBar';
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
  admin: 'bg-blue-500/10', // Admin-Farbmarkierung (Jasper)
  mo: 'bg-green-500/10'
};

export default function TradeCompare() {
  // State für kombinierte Trades
  const [combinedTrades, setCombinedTrades] = useState<Trade[]>([]);
  // State für aktive Filter
  const [activeFilters, setActiveFilters] = useState({});
  
  // Statistik-Berechnungen für die angezeigten Trades
  const tradeStats = useMemo(() => {
    const filteredTrades = combinedTrades.filter(trade => {
      // Wenn aktive Filter vorhanden sind, diese anwenden
      if (Object.keys(activeFilters).length > 0) {
        // Hier könnten weitere Filter-Logiken angewendet werden
        return true; // Vereinfacht für das Beispiel
      }
      return true;
    });
    
    const count = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.isWin === true).length;
    const losses = filteredTrades.filter(t => t.isWin === false).length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    
    // Berechne Gesamt-P/L und Average RR
    const totalPL = filteredTrades.reduce((sum, trade) => {
      return sum + (trade.profitLoss || 0);
    }, 0);
    
    // Berechne das durchschnittliche Risk-Reward-Verhältnis
    // Aus rrAchieved oder dem Verhältnis zwischen rrPotential und rrAchieved
    const avgRR = filteredTrades.reduce((sum, trade) => {
      return sum + (trade.rrAchieved || 0);
    }, 0) / (count || 1);
    
    return {
      count,
      wins,
      losses,
      winRate,
      totalPL,
      avgRR
    };
  }, [combinedTrades, activeFilters]);

  // Admin-Trades abrufen (den gleichen queryKey wie in SimpleHome verwenden, aber immer neu laden)
  const { data: adminTrades = [], isLoading: isLoadingAdmin, refetch: refetchAdmin } = useQuery<any[], Error>({
    queryKey: ['/api/trades', 1, {}],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("userId", "1"); // Admin-ID
      
      const response = await fetch(`/api/trades?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch admin trades");
      }
      return response.json();
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
      
      const response = await fetch(`/api/trades?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch mo trades");
      }
      return response.json();
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
      // Admin-Trades Farbmarkierung und Benutzerinfo hinzufügen
      // Ein eindeutiger Key für jeden Trade wird durch Präfix "admin-" erzeugt
      const formattedAdminTrades = adminTrades.map(trade => ({
        ...trade,
        id: `admin-${trade.id}`, // Eindeutige ID für die Tabelle
        originalId: trade.id,    // Original-ID für API-Anfragen beibehalten
        userColor: USER_COLORS.admin,
        userName: 'Jasper'
      }));

      // Mo-Trades Farbmarkierung und Benutzerinfo hinzufügen
      // Ein eindeutiger Key für jeden Trade wird durch Präfix "mo-" erzeugt
      const formattedMoTrades = moTrades.map(trade => ({
        ...trade,
        id: `mo-${trade.id}`,    // Eindeutige ID für die Tabelle
        originalId: trade.id,    // Original-ID für API-Anfragen beibehalten
        userColor: USER_COLORS.mo,
        userName: 'Mo'
      }));

      // Trades kombinieren und nach Datum sortieren
      const allTrades = [...formattedAdminTrades, ...formattedMoTrades].sort((a, b) => {
        // Datum in umgekehrter Reihenfolge sortieren (neueste zuerst)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setCombinedTrades(allTrades);
    }
  }, [adminTrades, moTrades, isLoadingAdmin, isLoadingMo]);

  // Filter-Handler
  const handleFilterChange = (newFilters: any) => {
    setActiveFilters(newFilters);
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-black/20 p-2 rounded-md border border-primary/5 hover:border-primary/20 transition-all duration-200 flex flex-col">
            <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
              <BarChart2 className="w-3 h-3 mr-1 text-primary/70" />
              Trades
            </h3>
            <div className="flex gap-2 items-center">
              <span className="text-lg font-bold">{tradeStats.count}</span>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-500/5 text-emerald-400">
                  <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
                  <span>{tradeStats.wins}W</span>
                </div>
                <div className="flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-red-500/5 text-red-400">
                  <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />
                  <span>{tradeStats.losses}L</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/20 p-2 rounded-md border border-primary/5 hover:border-primary/20 transition-all duration-200 flex flex-col">
            <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
              <Target className="w-3 h-3 mr-1 text-primary/70" />
              Win Rate
            </h3>
            <div className="flex flex-col">
              <div className="flex gap-2 items-center">
                <span className={`text-lg font-bold ${tradeStats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{tradeStats.winRate.toFixed(1)}%</span>
                <div className={`flex items-center text-[10px] rounded-sm px-1.5 py-0.5 ${
                  tradeStats.winRate >= 65 ? 'bg-emerald-500/5 text-emerald-400' : 
                  tradeStats.winRate >= 50 ? 'bg-emerald-500/5 text-emerald-400' : 
                  tradeStats.winRate >= 40 ? 'bg-amber-500/5 text-amber-400' :
                  'bg-red-500/5 text-red-400'
                }`}>
                  {
                    tradeStats.winRate >= 65 ? 'Exz.' :
                    tradeStats.winRate >= 50 ? 'Profit' :
                    tradeStats.winRate >= 40 ? 'Grenz' :
                    'Verlust'
                  }
                </div>
              </div>
              <div className="w-full mt-1 bg-gray-800/30 rounded-full h-1">
                <div className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(tradeStats.winRate, 5))}%`,
                    background: `${
                      tradeStats.winRate >= 65 ? 'linear-gradient(90deg, #10b981, #34d399)' : 
                      tradeStats.winRate >= 50 ? 'linear-gradient(90deg, #34d399, #6ee7b7)' : 
                      tradeStats.winRate >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                      'linear-gradient(90deg, #ef4444, #f87171)'
                    }`
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/20 p-2 rounded-md border border-primary/5 hover:border-primary/20 transition-all duration-200 flex flex-col">
            <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
              <DollarSign className="w-3 h-3 mr-1 text-primary/70" />
              Gesamt P/L
            </h3>
            <div className="flex gap-2 items-center">
              <span className={`text-lg font-bold ${tradeStats.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {tradeStats.totalPL >= 0 ? '+' : ''}{tradeStats.totalPL.toFixed(0)}$
              </span>
              <div className={`flex items-center text-[10px] rounded-sm px-1.5 py-0.5 ${tradeStats.totalPL >= 0 ? 'bg-emerald-500/5 text-emerald-400' : 'bg-red-500/5 text-red-400'}`}>
                {tradeStats.totalPL > 1000 ? 'Sehr gut' :
                 tradeStats.totalPL > 0 ? 'Positiv' : 
                 'Negativ'}
              </div>
            </div>
          </div>
          
          <div className="bg-black/20 p-2 rounded-md border border-primary/5 hover:border-primary/20 transition-all duration-200 flex flex-col">
            <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
              <Activity className="w-3 h-3 mr-1 text-primary/70" />
              Durchschn. RR
            </h3>
            <div className="flex gap-2 items-center">
              <span className={`text-lg font-bold ${tradeStats.avgRR >= 1.5 ? 'text-emerald-400' : 
                                               tradeStats.avgRR >= 1 ? 'text-blue-400' : 
                                               tradeStats.avgRR >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {tradeStats.avgRR.toFixed(2)}R
              </span>
              <div className={`flex items-center text-[10px] rounded-sm px-1.5 py-0.5 ${
                tradeStats.avgRR >= 2 ? 'bg-emerald-500/5 text-emerald-400' : 
                tradeStats.avgRR >= 1.5 ? 'bg-blue-500/5 text-blue-400' : 
                tradeStats.avgRR >= 1 ? 'bg-amber-500/5 text-amber-400' : 
                'bg-red-500/5 text-red-400'
              }`}>
                {
                  tradeStats.avgRR >= 2 ? 'Exz.' :
                  tradeStats.avgRR >= 1.5 ? 'Gut' :
                  tradeStats.avgRR >= 1 ? 'OK' :
                  'Niedrig'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter-Bar Komponente */}
      <div className="mb-4">
        <FilterBar 
          onFilterChange={handleFilterChange} 
          initialFilters={{}} 
          showUserFilter={true} 
        />
      </div>

      <Card className="bg-black/50 border-primary/20 overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-xl">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Trades im Vergleich
              </div>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="table" className="w-full">
            <div className="px-6 pt-2 border-b border-border">
              <TabsList className="bg-transparent">
                <TabsTrigger value="table" className="data-[state=active]:bg-black/20">
                  Tabelle
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="table" className="p-0 m-0">
              <TradeTable 
                trades={combinedTrades as any} 
                isLoading={isLoadingAdmin || isLoadingMo}
                showColoredRows={true}
                showUserColumn={true}
                onActiveFiltersChange={(filters) => {
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