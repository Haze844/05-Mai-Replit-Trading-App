import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trade } from '@shared/schema';
import TradeTable from './TradeTable';
import FilterBar from './FilterBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, BarChart2, Users } from 'lucide-react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';

// Farben für Benutzerunterscheidung
const USER_COLORS = {
  admin: 'bg-blue-500/10',
  mo: 'bg-green-500/10'
};

export default function TradeCompare() {
  // State für kombinierte Trades
  const [combinedTrades, setCombinedTrades] = useState<Trade[]>([]);
  // State für aktive Filter
  const [activeFilters, setActiveFilters] = useState({});

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
      const formattedAdminTrades = adminTrades.map(trade => ({
        ...trade,
        userColor: USER_COLORS.admin,
        userName: 'Admin'
      }));

      // Mo-Trades Farbmarkierung und Benutzerinfo hinzufügen
      const formattedMoTrades = moTrades.map(trade => ({
        ...trade,
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
      <div className="flex items-center gap-2 mb-6">
        <Link to="/">
          <ChevronLeft className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
        <h1 className="text-2xl font-bold">Trade-Vergleich</h1>
      </div>

      <Separator className="my-4" />

      <div className="mb-6">
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
                onActiveFiltersChange={(filters) => setActiveFilters(filters)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
            <span>Admin</span>
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