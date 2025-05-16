import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trade } from "@/types/trade";
import { fetchTradesForUser } from "@/lib/api";
import TradeTable from "./TradeTable";
import FilterBar from "./FilterBar";

// Farben für die Benutzer-Unterscheidung
const USER_COLORS = {
  admin: "bg-purple-900/20 hover:bg-purple-900/30",
  mo: "bg-blue-900/20 hover:bg-blue-900/30"
};

export default function TradeCompare() {
  const [adminTrades, setAdminTrades] = useState<Trade[]>([]);
  const [moTrades, setMoTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Kombinierte Trades mit Benutzer-Kennzeichnung
  const combinedTrades = [...adminTrades.map(trade => ({
    ...trade,
    userColor: USER_COLORS.admin,
    userName: "admin"
  })), ...moTrades.map(trade => ({
    ...trade,
    userColor: USER_COLORS.mo,
    userName: "mo"
  }))];

  // Lade die Trades beider Benutzer
  useEffect(() => {
    const loadAllTrades = async () => {
      setIsLoading(true);
      try {
        // Admin Trades laden
        const adminTradesData = await fetchTradesForUser(1);
        setAdminTrades(adminTradesData);
        
        // Mo Trades laden
        const moTradesData = await fetchTradesForUser(2);
        setMoTrades(moTradesData);
        
        // Alle Trades kombinieren für die initiale Ansicht
        setFilteredTrades([
          ...adminTradesData.map(trade => ({
            ...trade,
            userColor: USER_COLORS.admin,
            userName: "admin"
          })),
          ...moTradesData.map(trade => ({
            ...trade,
            userColor: USER_COLORS.mo,
            userName: "mo"
          }))
        ]);
      } catch (error) {
        console.error("Fehler beim Laden der Trades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllTrades();
  }, []);

  // Filter-Funktion für kombinierte Trades
  const applyFilters = (newFilters: any) => {
    setFilters(newFilters);
    
    let filtered = [...combinedTrades];
    
    // Filtere nach Datum, falls angegeben
    if (newFilters.dateFrom) {
      const fromDate = new Date(newFilters.dateFrom);
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= fromDate;
      });
    }
    
    if (newFilters.dateTo) {
      const toDate = new Date(newFilters.dateTo);
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate <= toDate;
      });
    }
    
    // Filtere nach Symbol
    if (newFilters.symbol && newFilters.symbol !== "all") {
      filtered = filtered.filter(trade => trade.symbol === newFilters.symbol);
    }
    
    // Filtere nach Konto-Typ
    if (newFilters.accountType && newFilters.accountType !== "all") {
      filtered = filtered.filter(trade => trade.accountType === newFilters.accountType);
    }
    
    // Filtere nach Session
    if (newFilters.session && newFilters.session !== "all") {
      filtered = filtered.filter(trade => trade.session === newFilters.session);
    }
    
    // Filtere nach Setup
    if (newFilters.setup && newFilters.setup !== "all") {
      filtered = filtered.filter(trade => trade.setup === newFilters.setup);
    }
    
    // Filtere nach Trend
    if (newFilters.trend && newFilters.trend !== "all") {
      filtered = filtered.filter(trade => trade.trend === newFilters.trend);
    }
    
    // Filtere nach spezifischem Benutzer, falls ausgewählt
    if (newFilters.user && newFilters.user !== "all") {
      filtered = filtered.filter(trade => trade.userName === newFilters.user);
    }
    
    setFilteredTrades(filtered);
  };

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader>
          <CardTitle>Trade Vergleich</CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Filter-Leiste mit zusätzlichem Benutzer-Filter */}
          <FilterBar 
            onFilterChange={applyFilters} 
            initialFilters={filters}
            showUserFilter={true} 
          />
          
          <Tabs defaultValue="all" className="mt-4">
            <TabsList>
              <TabsTrigger value="all">Alle Trades</TabsTrigger>
              <TabsTrigger value="admin">Admin Trades</TabsTrigger>
              <TabsTrigger value="mo">Mo Trades</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <TradeTable 
                trades={filteredTrades} 
                isLoading={isLoading}
                showColoredRows={true}
                showUserColumn={true}
              />
            </TabsContent>
            
            <TabsContent value="admin">
              <TradeTable 
                trades={filteredTrades.filter(trade => trade.userName === "admin")} 
                isLoading={isLoading}
                showColoredRows={true}
                showUserColumn={true}
              />
            </TabsContent>
            
            <TabsContent value="mo">
              <TradeTable 
                trades={filteredTrades.filter(trade => trade.userName === "mo")} 
                isLoading={isLoading}
                showColoredRows={true}
                showUserColumn={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}