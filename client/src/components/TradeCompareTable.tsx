import { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AccountBalanceProgressNew from "@/components/AccountBalanceProgressNew";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Trade, 
  accountTypes, 
  sessionTypes, 
  simpleTrendTypes,
  structureTypes,
  timeframeTypes,
  liquidationTypes,
  unmitZoneTypes,
  marketPhaseTypes,
  slTypes,
  rrValues,
  setupTypes
} from "@shared/schema";
import { formatDate, formatTime, getTodayDates, getWeekDates, getLastMonthDates } from "@/lib/utils";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { BadgeTrend } from "@/components/ui/badge-trend";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Filter, 
  CalendarDays, 
  Wallet, 
  BarChart4, 
  LineChart, 
  TrendingUp, 
  ArrowUpDown, 
  Award,
  Target,
  DollarSign,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ScatterChart,
  BarChart3,
  Trash,
  Edit,
  Plus,
  Info,
  Search,
  X,
  Layers,
  BaggageClaim,
  AlertTriangle, 
  Clock,
  FileDown,
  FileText,
  EyeIcon,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { useState as useHookState } from '@hookstate/core';
import { globalTradeFilterState } from "@/lib/globalState";
import TradeDetail from "./TradeDetail";
import { apiRequest } from "@/lib/queryClient";
import { exportTradeDataToCSV } from "@/lib/exportHelper";
import { useSettings } from "@/hooks/useSettings";

// TradingView-Chart-Modal
interface TradeCompareTableProps {
  combinedTradesFormatted: Trade[];
  onTradeSelected: (trade: Trade | null) => void;
  onFilterUpdate: (filters: any) => void;
}

export default function TradeCompareTable({ 
  combinedTradesFormatted,
  onTradeSelected,
  onFilterUpdate
}: TradeCompareTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isWideColumn, setIsWideColumn] = useState(false);
  
  // Filterstatus
  const [filters, setFilters] = useState<{
    symbols: Set<string>,
    setups: Set<string>,
    mainTrends: Set<string>,
    internalTrends: Set<string>,
    entryTypes: Set<string>,
    accountTypes: Set<string>,
    sessions: Set<string>,
    rrRanges: Set<string>,
    plRanges: Set<string>,
    isWin: null | boolean,
    trends: Set<string>,
    internalTrendsNew: Set<string>,
    microTrends: Set<string>,
    structures: Set<string>,
    timeframeEntries: Set<string>,
    liquidations: Set<string>,
    liquidationEntries: Set<string>,
    locations: Set<string>,
    unmitZones: Set<string>,
    marketPhases: Set<string>,
    slTypes: Set<string>,
    slPointsRanges: Set<string>,
    riskSumRanges: Set<string>,
    startDate: Date,
    endDate: Date
  }>({
    symbols: new Set(),
    setups: new Set(),
    mainTrends: new Set(),
    internalTrends: new Set(),
    entryTypes: new Set(),
    accountTypes: new Set(),
    sessions: new Set(),
    rrRanges: new Set(),
    plRanges: new Set(),
    isWin: null,
    trends: new Set(),
    internalTrendsNew: new Set(),
    microTrends: new Set(),
    structures: new Set(),
    timeframeEntries: new Set(),
    liquidations: new Set(),
    liquidationEntries: new Set(),
    locations: new Set(),
    unmitZones: new Set(),
    marketPhases: new Set(),
    slTypes: new Set(),
    slPointsRanges: new Set(),
    riskSumRanges: new Set(),
    startDate: new Date("2020-01-01"),
    endDate: new Date("2030-12-31")
  });
  
  // Zeit/Datum Filterstatus
  const [dateRange, setDateRange] = useState<{
    from: Date | null,
    to: Date | null
  }>({
    from: null,
    to: null
  });
  
  // Sortierung
  const [sortConfig, setSortConfig] = useState<{
    key: string | null,
    direction: 'ascending' | 'descending'
  }>({
    key: 'date',
    direction: 'descending'
  });
  
  // Callback für date Filteränderungen
  const handleDateFilterChange = (period: string) => {
    let dates;
    
    switch(period) {
      case "today":
        dates = getTodayDates();
        setFilters({...filters, startDate: dates.startDate, endDate: dates.endDate});
        setDateRange({from: dates.startDate, to: dates.endDate});
        break;
      case "week":
        dates = getWeekDates();
        setFilters({...filters, startDate: dates.startDate, endDate: dates.endDate});
        setDateRange({from: dates.startDate, to: dates.endDate});
        break;
      case "month":
        dates = getLastMonthDates();
        setFilters({...filters, startDate: dates.startDate, endDate: dates.endDate});
        setDateRange({from: dates.startDate, to: dates.endDate});
        break;
      case "all":
        setFilters({...filters, startDate: new Date("2020-01-01"), endDate: new Date("2030-12-31")});
        setDateRange({from: null, to: null});
        break;
      default:
        break;
    }
    
    setCurrentPage(1);
  };
  
  // Callback für Kalender-Änderungen
  const handleCalendarSelect = (range: { from: Date, to: Date }) => {
    if (range.from && range.to) {
      // Setzt die Endzeit auf 23:59:59
      const endDate = new Date(range.to);
      endDate.setHours(23, 59, 59, 999);
      
      setFilters({...filters, startDate: range.from, endDate: endDate});
      setDateRange(range);
      setCurrentPage(1);
    }
  };
  
  // Filter togglen
  const toggleFilter = (filterType: string, value: string) => {
    setFilters(prev => {
      const newFilters = {...prev};
      const filterSet = new Set(newFilters[filterType]);
      
      if (filterSet.has(value)) {
        filterSet.delete(value);
      } else {
        filterSet.add(value);
      }
      
      newFilters[filterType] = filterSet;
      return newFilters;
    });
    
    setCurrentPage(1);
  };
  
  // Win/Loss Filter setzen
  const setWinLossFilter = (isWin: boolean | null) => {
    setFilters({...filters, isWin});
    setCurrentPage(1);
  };
  
  // Filtern nach allen aktiven Filtern
  const filteredTrades = useMemo(() => {
    if (!combinedTradesFormatted || combinedTradesFormatted.length === 0) {
      return [];
    }
    
    // Sende die Filter über die Callback-Funktion zurück
    onFilterUpdate(filters);
    
    return combinedTradesFormatted;
  }, [combinedTradesFormatted, filters, onFilterUpdate]);
  
  // Sortieren der gefilterten Trades
  const sortedTrades = useMemo(() => {
    if (!sortConfig.key) return filteredTrades;
    
    return [...filteredTrades].sort((a, b) => {
      // Null-Handling für alle Felder
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
      
      // Spezielle Behandlung für Datumsfelder
      if (sortConfig.key === 'date') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig.direction === 'ascending' 
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      
      // Numerische Sortierung für Zahlenfelder
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      // Standardsortierung für Strings
      if (String(aValue) < String(bValue)) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (String(aValue) > String(bValue)) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredTrades, sortConfig]);
  
  // Paginierung
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedTrades.slice(startIndex, startIndex + pageSize);
  }, [sortedTrades, currentPage, pageSize]);
  
  // Gesamt-Seiten berechnen
  const totalPages = Math.ceil(sortedTrades.length / pageSize);
  
  // Sortierfunktion
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Page Navigation
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // Formatiere die Amountspalte
  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "—";
    return `$${amount.toFixed(2)}`;
  };
  
  // RR-Formatierung 
  const formatRR = (rr: number | null | undefined) => {
    if (rr === null || rr === undefined) return "—";
    return `${rr.toFixed(1)}R`;
  };
  
  // Event-Handler für Trade-Auswahl
  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    onTradeSelected(trade);
  };
  
  // Exportiere die gefilterten Trades als CSV
  const handleExportToCSV = () => {
    if (sortedTrades.length === 0) {
      toast({
        title: "Keine Daten zum Exportieren",
        description: "Es sind keine Trades vorhanden, die exportiert werden können.",
        variant: "destructive"
      });
      return;
    }
    
    exportTradeDataToCSV(sortedTrades, 'trade_comparison_export.csv');
    
    toast({
      title: "Export erfolgreich",
      description: `${sortedTrades.length} Trades wurden erfolgreich exportiert.`
    });
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Aktuelle Seite Anzeige */}
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="hidden sm:inline">Zeige</span> 
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="hidden sm:inline">von {filteredTrades.length}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Export Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1 text-xs"
            onClick={handleExportToCSV}
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CSV Export</span>
          </Button>
          
          {/* Datums-Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Zeitraum</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Zeitraum auswählen</h4>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDateFilterChange('today')}
                    >
                      Heute
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDateFilterChange('week')}
                    >
                      Diese Woche
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDateFilterChange('month')}
                    >
                      Letzten Monat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDateFilterChange('all')}
                    >
                      Alle
                    </Button>
                  </div>
                </div>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from || undefined}
                selected={{
                  from: dateRange.from || undefined,
                  to: dateRange.to || undefined,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    handleCalendarSelect(range as { from: Date, to: Date });
                  }
                }}
                numberOfMonths={1}
              />
              <div className="flex items-center justify-between p-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => {
                    setDateRange({ from: null, to: null });
                    setFilters({...filters, startDate: new Date("2020-01-01"), endDate: new Date("2030-12-31")});
                  }}
                >
                  Filter zurücksetzen
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Pagination */}
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <span className="text-xs px-2 py-1 bg-muted rounded-md">
              {currentPage}/{totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="rounded-md border relative">
        <div className="w-full overflow-auto">
          <table className="w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        Trader
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Trader filtern</h4>
                        <div className="space-y-2 px-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="trader-jasper" 
                              checked={false}
                              onCheckedChange={() => {}}
                            />
                            <Label htmlFor="trader-jasper" className="text-sm cursor-pointer flex items-center gap-1.5">
                              <div className="h-2.5 w-2.5 rounded-full bg-blue-500/50"></div>
                              Jasper
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="trader-mo" 
                              checked={false}
                              onCheckedChange={() => {}}
                            />
                            <Label htmlFor="trader-mo" className="text-sm cursor-pointer flex items-center gap-1.5">
                              <div className="h-2.5 w-2.5 rounded-full bg-green-500/50"></div>
                              Mo
                            </Label>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => requestSort('date')}
                      >
                        Datum
                        {sortConfig.key === 'date' && (
                          <div className="ml-1">
                            {sortConfig.direction === 'ascending' ? 
                              <ChevronUp className="h-3.5 w-3.5" /> : 
                              <ChevronDown className="h-3.5 w-3.5" />
                            }
                          </div>
                        )}
                        {sortConfig.key !== 'date' && (
                          <ArrowUpDown className="h-3 w-3 ml-1" />
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Nach Datum sortieren</h4>
                        <div className="space-y-2">
                          <Button 
                            variant={sortConfig.key === 'date' && sortConfig.direction === 'descending' ? 'default' : 'outline'} 
                            size="sm" 
                            className="w-full text-xs justify-start"
                            onClick={() => setSortConfig({ key: 'date', direction: 'descending' })}
                          >
                            Neueste zuerst
                          </Button>
                          <Button 
                            variant={sortConfig.key === 'date' && sortConfig.direction === 'ascending' ? 'default' : 'outline'} 
                            size="sm" 
                            className="w-full text-xs justify-start"
                            onClick={() => setSortConfig({ key: 'date', direction: 'ascending' })}
                          >
                            Älteste zuerst
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        Symbol
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Symbol filtern</h4>
                        <div className="space-y-2 px-1 max-h-[200px] overflow-y-auto">
                          {Array.from(new Set(combinedTradesFormatted.map(trade => trade.symbol).filter(Boolean))).map(symbol => (
                            <div key={symbol} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`symbol-${symbol}`} 
                                checked={filters.symbols.has(symbol!)}
                                onCheckedChange={() => toggleFilter('symbols', symbol!)}
                              />
                              <Label htmlFor={`symbol-${symbol}`} className="text-sm cursor-pointer">
                                {symbol}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {filters.symbols.size > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              setFilters({...filters, symbols: new Set()});
                              setCurrentPage(1);
                            }}
                          >
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        Setup
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Setup filtern</h4>
                        <div className="space-y-2 px-1 max-h-[200px] overflow-y-auto">
                          {setupTypes.map(setup => (
                            <div key={setup} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`setup-${setup}`} 
                                checked={filters.setups.has(setup)}
                                onCheckedChange={() => toggleFilter('setups', setup)}
                              />
                              <Label htmlFor={`setup-${setup}`} className="text-sm cursor-pointer">
                                {setup}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {filters.setups.size > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              setFilters({...filters, setups: new Set()});
                              setCurrentPage(1);
                            }}
                          >
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => requestSort('profitLoss')}
                      >
                        P/L
                        {sortConfig.key === 'profitLoss' && (
                          <div className="ml-1">
                            {sortConfig.direction === 'ascending' ? 
                              <ChevronUp className="h-3.5 w-3.5" /> : 
                              <ChevronDown className="h-3.5 w-3.5" />
                            }
                          </div>
                        )}
                        {sortConfig.key !== 'profitLoss' && (
                          <ArrowUpDown className="h-3 w-3 ml-1" />
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">P/L filtern</h4>
                        <div className="space-y-2 px-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="pl-high" 
                              checked={filters.plRanges.has('high')}
                              onCheckedChange={() => toggleFilter('plRanges', 'high')}
                            />
                            <Label htmlFor="pl-high" className="text-sm cursor-pointer">
                              Hoch (≥ $1000)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="pl-medium" 
                              checked={filters.plRanges.has('medium')}
                              onCheckedChange={() => toggleFilter('plRanges', 'medium')}
                            />
                            <Label htmlFor="pl-medium" className="text-sm cursor-pointer">
                              Mittel ($500-$999)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="pl-low" 
                              checked={filters.plRanges.has('low')}
                              onCheckedChange={() => toggleFilter('plRanges', 'low')}
                            />
                            <Label htmlFor="pl-low" className="text-sm cursor-pointer">
                              Niedrig ($1-$499)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="pl-loss" 
                              checked={filters.plRanges.has('loss')}
                              onCheckedChange={() => toggleFilter('plRanges', 'loss')}
                            />
                            <Label htmlFor="pl-loss" className="text-sm cursor-pointer">
                              Verlust (< $0)
                            </Label>
                          </div>
                        </div>
                        {filters.plRanges.size > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              setFilters({...filters, plRanges: new Set()});
                              setCurrentPage(1);
                            }}
                          >
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        Main-Trend
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">M15-Trend filtern</h4>
                        <div className="space-y-2 px-1">
                          {simpleTrendTypes.map(trend => (
                            <div key={trend} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`trend-${trend}`} 
                                checked={filters.mainTrends.has(trend)}
                                onCheckedChange={() => toggleFilter('mainTrends', trend)}
                              />
                              <Label htmlFor={`trend-${trend}`} className="text-sm cursor-pointer">
                                <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                              </Label>
                            </div>
                          ))}
                        </div>
                        {filters.mainTrends.size > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              setFilters({...filters, mainTrends: new Set()});
                              setCurrentPage(1);
                            }}
                          >
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        Internal-Trend
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">M5-Trend filtern</h4>
                        <div className="space-y-2 px-1">
                          {simpleTrendTypes.map(trend => (
                            <div key={trend} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`internal-${trend}`} 
                                checked={filters.internalTrends.has(trend)}
                                onCheckedChange={() => toggleFilter('internalTrends', trend)}
                              />
                              <Label htmlFor={`internal-${trend}`} className="text-sm cursor-pointer">
                                <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                              </Label>
                            </div>
                          ))}
                        </div>
                        {filters.internalTrends.size > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              setFilters({...filters, internalTrends: new Set()});
                              setCurrentPage(1);
                            }}
                          >
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        Einstieg
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Einstieg filtern</h4>
                        <div className="space-y-2 px-1">
                          {simpleTrendTypes.map(entry => (
                            <div key={entry} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`entry-${entry}`} 
                                checked={filters.entryTypes.has(entry)}
                                onCheckedChange={() => toggleFilter('entryTypes', entry)}
                              />
                              <Label htmlFor={`entry-${entry}`} className="text-sm cursor-pointer">
                                <BadgeTrend trend={entry} className="text-xs py-0 px-1" />
                              </Label>
                            </div>
                          ))}
                        </div>
                        {filters.entryTypes.size > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              setFilters({...filters, entryTypes: new Set()});
                              setCurrentPage(1);
                            }}
                          >
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => requestSort('rrAchieved')}
                      >
                        RR
                        {sortConfig.key === 'rrAchieved' && (
                          <div className="ml-1">
                            {sortConfig.direction === 'ascending' ? 
                              <ChevronUp className="h-3.5 w-3.5" /> : 
                              <ChevronDown className="h-3.5 w-3.5" />
                            }
                          </div>
                        )}
                        {sortConfig.key !== 'rrAchieved' && (
                          <ArrowUpDown className="h-3 w-3 ml-1" />
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">RR filtern</h4>
                        <div className="space-y-2 px-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="rr-high" 
                              checked={filters.rrRanges.has('high')}
                              onCheckedChange={() => toggleFilter('rrRanges', 'high')}
                            />
                            <Label htmlFor="rr-high" className="text-sm cursor-pointer">
                              ≥ 2R
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="rr-medium" 
                              checked={filters.rrRanges.has('medium')}
                              onCheckedChange={() => toggleFilter('rrRanges', 'medium')}
                            />
                            <Label htmlFor="rr-medium" className="text-sm cursor-pointer">
                              1R - 1.9R
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="rr-low" 
                              checked={filters.rrRanges.has('low')}
                              onCheckedChange={() => toggleFilter('rrRanges', 'low')}
                            />
                            <Label htmlFor="rr-low" className="text-sm cursor-pointer">
                              0.1R - 0.9R
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="rr-negative" 
                              checked={filters.rrRanges.has('negative')}
                              onCheckedChange={() => toggleFilter('rrRanges', 'negative')}
                            />
                            <Label htmlFor="rr-negative" className="text-sm cursor-pointer">
                              Negativ
                            </Label>
                          </div>
                        </div>
                        {filters.rrRanges.size > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              setFilters({...filters, rrRanges: new Set()});
                              setCurrentPage(1);
                            }}
                          >
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        Win/Loss
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Erfolg filtern</h4>
                        <div className="space-y-2">
                          <Button 
                            variant={filters.isWin === true ? 'default' : 'outline'} 
                            size="sm" 
                            className="w-full text-xs justify-start"
                            onClick={() => setWinLossFilter(true)}
                          >
                            <BadgeWinLoss isWin={true} />
                            <span className="ml-2">Gewinne</span>
                          </Button>
                          <Button 
                            variant={filters.isWin === false ? 'default' : 'outline'} 
                            size="sm" 
                            className="w-full text-xs justify-start"
                            onClick={() => setWinLossFilter(false)}
                          >
                            <BadgeWinLoss isWin={false} />
                            <span className="ml-2">Verluste</span>
                          </Button>
                          <Button 
                            variant={filters.isWin === null ? 'default' : 'outline'} 
                            size="sm" 
                            className="w-full text-xs justify-start"
                            onClick={() => setWinLossFilter(null)}
                          >
                            Alle anzeigen
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
                <th className="p-3 text-left whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    Feedback
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTrades.length > 0 ? (
                paginatedTrades.map((trade, index) => (
                  <tr 
                    key={`${trade.id}-${index}`} 
                    className={`hover:bg-muted/50 cursor-pointer transition-colors ${trade.id === selectedTrade?.id ? 'bg-primary/5' : ''}`}
                    onClick={() => handleTradeClick(trade)}
                  >
                    <td className="p-3 max-w-[180px] truncate">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${trade.userName === 'Mo' ? 'bg-teal-500/50' : 'bg-blue-500/50'}`}></div>
                        <span>{trade.userName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {typeof trade.date === 'string' ? formatDate(new Date(trade.date)) : formatDate(trade.date)}
                    </td>
                    <td className="p-3 font-medium max-w-[120px] truncate">
                      {trade.symbol || "—"}
                    </td>
                    <td className="p-3 max-w-[150px] truncate">
                      {trade.setup || "—"}
                    </td>
                    <td className="p-3">
                      <span className={`${trade.profitLoss && trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.profitLoss !== undefined && trade.profitLoss !== null ? `$${Math.abs(trade.profitLoss).toFixed(0)}` : "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      {trade.mainTrendM15 ? (
                        <BadgeTrend trend={trade.mainTrendM15} className="text-xs py-0 px-1" />
                      ) : "—"}
                    </td>
                    <td className="p-3">
                      {trade.internalTrendM5 ? (
                        <BadgeTrend trend={trade.internalTrendM5} className="text-xs py-0 px-1" />
                      ) : "—"}
                    </td>
                    <td className="p-3">
                      {trade.entryType ? (
                        <BadgeTrend trend={trade.entryType} className="text-xs py-0 px-1" />
                      ) : "—"}
                    </td>
                    <td className="p-3">
                      {trade.rrAchieved !== undefined && trade.rrAchieved !== null ? formatRR(trade.rrAchieved) : "—"}
                    </td>
                    <td className="p-3">
                      <BadgeWinLoss isWin={!!trade.isWin} />
                    </td>
                    <td className="p-3 max-w-[170px] truncate">
                      <div className="flex items-center">
                        <span className="truncate text-xs text-muted-foreground">
                          {trade.gptFeedback || "Kein Feedback"}
                        </span>
                        {trade.gptFeedback && (
                          <div className="ml-2 opacity-50">
                            <MessageSquare className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="rounded-full bg-muted p-3 mb-3">
                        <Search className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Keine Trades gefunden</h3>
                      <p className="text-muted-foreground text-sm max-w-md">
                        Es wurden keine Trades gefunden, die den aktuellen Filterkriterien entsprechen. Bitte passe die Filter an oder importiere neue Trades.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}