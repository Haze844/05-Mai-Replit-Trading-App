import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  CalendarDays, 
  Filter, 
  X, 
  Users 
} from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

export interface FilterBarProps {
  onFilterChange: (filters: any) => void;
  initialFilters?: any;
  showUserFilter?: boolean;
  userId?: number;
  filters?: any;
}

// Die Komponente für Filterungen
export default function FilterBar({ 
  onFilterChange, 
  initialFilters = {}, 
  showUserFilter = false 
}: FilterBarProps) {
  // Filter state
  const [filters, setFilters] = useState({
    symbol: 'all',
    accountType: 'all',
    session: 'all',
    setup: 'all',
    trend: 'all',
    dateFrom: '',
    dateTo: '',
    user: 'all',
    ...initialFilters
  });

  // Wenn sich Filter ändern, benachrichtige die übergeordnete Komponente
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilters({
      symbol: 'all',
      accountType: 'all',
      session: 'all',
      setup: 'all',
      trend: 'all',
      dateFrom: '',
      dateTo: '',
      user: 'all',
    });
  };

  return (
    <Card className="mb-4 bg-black/50 border-primary/20">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbol Filter */}
          <div className="min-w-[120px]">
            <Label htmlFor="symbol-filter" className="text-xs">Symbol</Label>
            <Select
              value={filters.symbol}
              onValueChange={(value) => setFilters({...filters, symbol: value})}
            >
              <SelectTrigger id="symbol-filter" className="h-8">
                <SelectValue placeholder="Symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Symbole</SelectItem>
                <SelectItem value="MNQM5">MNQM5</SelectItem>
                <SelectItem value="MESM5">MESM5</SelectItem>
                <SelectItem value="MYMM5">MYMM5</SelectItem>
                <SelectItem value="MGM5">MGM5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Konto-Typ Filter */}
          <div className="min-w-[120px]">
            <Label htmlFor="account-filter" className="text-xs">Konto</Label>
            <Select
              value={filters.accountType}
              onValueChange={(value) => setFilters({...filters, accountType: value})}
            >
              <SelectTrigger id="account-filter" className="h-8">
                <SelectValue placeholder="Konto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Konten</SelectItem>
                <SelectItem value="PA">PA</SelectItem>
                <SelectItem value="EVA">EVA</SelectItem>
                <SelectItem value="EK">EK</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Session Filter */}
          <div className="min-w-[140px]">
            <Label htmlFor="session-filter" className="text-xs">Session</Label>
            <Select
              value={filters.session}
              onValueChange={(value) => setFilters({...filters, session: value})}
            >
              <SelectTrigger id="session-filter" className="h-8">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Sessions</SelectItem>
                <SelectItem value="London">London</SelectItem>
                <SelectItem value="London Neverland">London Neverland</SelectItem>
                <SelectItem value="NY AM">NY AM</SelectItem>
                <SelectItem value="NY AM Neverland">NY AM Neverland</SelectItem>
                <SelectItem value="NY PM">NY PM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Setup Filter */}
          <div className="min-w-[140px]">
            <Label htmlFor="setup-filter" className="text-xs">Setup</Label>
            <Select
              value={filters.setup}
              onValueChange={(value) => setFilters({...filters, setup: value})}
            >
              <SelectTrigger id="setup-filter" className="h-8">
                <SelectValue placeholder="Setup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Setups</SelectItem>
                <SelectItem value="Reversal">Reversal</SelectItem>
                <SelectItem value="Retest">Retest</SelectItem>
                <SelectItem value="Breakout">Breakout</SelectItem>
                <SelectItem value="Trendfolge">Trendfolge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trend Filter */}
          <div className="min-w-[140px]">
            <Label htmlFor="trend-filter" className="text-xs">Trend</Label>
            <Select
              value={filters.trend}
              onValueChange={(value) => setFilters({...filters, trend: value})}
            >
              <SelectTrigger id="trend-filter" className="h-8">
                <SelectValue placeholder="Trend" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Trends</SelectItem>
                <SelectItem value="Bullish">Bullish</SelectItem>
                <SelectItem value="Bearish">Bearish</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Datum Filter */}
          <div className="min-w-[140px]">
            <Label htmlFor="date-filter" className="text-xs">Datum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-8 w-full justify-start text-left font-normal"
                >
                  <CalendarDays className="h-3 w-3 mr-2" />
                  {filters.dateFrom || filters.dateTo ? (
                    <span>
                      {filters.dateFrom ? filters.dateFrom : 'Start'} 
                      {' - '} 
                      {filters.dateTo ? filters.dateTo : 'Ende'}
                    </span>
                  ) : (
                    <span>Zeitraum auswählen</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-3" align="start">
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="date-from">Von</Label>
                    <Input
                      id="date-from"
                      type="date"
                      className="h-8"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="date-to">Bis</Label>
                    <Input
                      id="date-to"
                      type="date"
                      className="h-8"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Benutzer Filter (nur anzeigen, wenn aktiviert) */}
          {showUserFilter && (
            <div className="min-w-[140px]">
              <Label htmlFor="user-filter" className="text-xs">Benutzer</Label>
              <Select
                value={filters.user}
                onValueChange={(value) => setFilters({...filters, user: value})}
              >
                <SelectTrigger id="user-filter" className="h-8">
                  <SelectValue placeholder="Benutzer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Benutzer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="mo">Mo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filter zurücksetzen */}
          <div className="min-w-[140px] pt-6">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 w-full" 
              onClick={resetFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Filter zurücksetzen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}