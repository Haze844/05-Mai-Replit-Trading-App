import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Link as LinkIcon, X } from "lucide-react";
import Papa from "papaparse";
import { Trade, insertTradeSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TradeImportProps {
  userId: number;
  onImport?: () => void;
}

export default function TradeImport({ userId, onImport }: TradeImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [linkInput, setLinkInput] = useState<string>("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Verwende die Benutzer-ID aus dem Auth-Kontext oder die über Props übergebene ID als Fallback
  const currentUserId = user?.id || userId;
  
  // Debug-Log: Zeige die verwendete User-ID
  useEffect(() => {
    console.log("TradeImport verwendet User-ID:", currentUserId, 
      user?.id ? "(aus Auth-Kontext)" : "(aus Props)");
  }, [currentUserId, user?.id]);

  const importMutation = useMutation({
    mutationFn: async (trades: any[]) => {
      console.log("Importiere Trades mit userId:", currentUserId);
      const res = await apiRequest("POST", "/api/import-csv", { 
        trades,
        userId: currentUserId // Verwende immer die aktuelle Benutzer-ID
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import erfolgreich",
        description: `${data.count || 'Ihre'} Trades wurden erfolgreich importiert.`,
      });
      // Queries invalidieren
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/setup-win-rates"] });
      
      // Form zurücksetzen
      setFile(null);
      setLinkInput("");
      setImporting(false);
      
      console.log("Import abgeschlossen - Callback aufrufen:", Boolean(onImport));
      // Callback aufrufen
      if (onImport) {
        onImport();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Import fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
      setImporting(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wählen Sie eine CSV-Datei aus.",
          variant: "destructive",
        });
      }
    }
  };

  // Event-Handler für Drag & Drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wählen Sie eine CSV-Datei aus.",
          variant: "destructive",
        });
      }
    }
  };

  // Überprüfung der TradingView-URL
  const isValidTradingViewUrl = (url: string): boolean => {
    // Überprüft, ob die URL mit http:// oder https:// beginnt
    const hasValidProtocol = /^https?:\/\//i.test(url);
    
    // Überprüft, ob es sich um eine Bild-URL handelt oder eine TradingView-URL
    const isTradingViewUrl = /\.(jpg|jpeg|png|gif)$/i.test(url) || 
                              /tradingview\.com/i.test(url) ||
                              /\.tradingstation\.com/i.test(url);
    
    return hasValidProtocol && isTradingViewUrl;
  };

  // TradingView Link Import Handler
  const handleLinkImport = () => {
    setLinkError(null);
    
    if (!linkInput.trim()) {
      setLinkError("Bitte gib einen TradingView-Link ein");
      return;
    }
    
    // Überprüfen, ob es ein gültiger TradingView-Link ist
    if (!isValidTradingViewUrl(linkInput)) {
      setLinkError("Der Link muss mit http:// oder https:// beginnen und zu TradingView gehören");
      return;
    }
    
    setImporting(true);
    
    // Speichere nur den Link selbst, aber genug Daten, damit ein gültiger Trade erstellt wird
    const minimalTrade = {
      userId: userId,
      chartImage: linkInput,
      symbol: "TradingView",
      setup: "",  // Leeres Setup
      date: new Date().toISOString(),
      // Setze Minimum an Pflichtfeldern, da das Schema sie erfordert
      mainTrendM15: "", 
      internalTrendM5: "",
      entryType: "",
      entryLevel: "",
      liquidation: "",
      location: "",
      rrAchieved: 0,
      rrPotential: 0,
      isWin: false
    };
    
    // Speichere als neuen Trade mit dem Link als chartImage-Feld
    importMutation.mutate([minimalTrade]);
    setLinkInput("");
    
    toast({
      title: "TradingView-Link importiert",
      description: "Der TradingView-Chart wurde als neuer Trade gespeichert. Sie können diesen nun bearbeiten, um weitere Details hinzuzufügen."
    });
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    
    try {
      // FileReader für optimierte Verarbeitung
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (!e.target || !e.target.result) return;
        
        const csvText = e.target.result as string;
        
        // Optimierung durch Worker-ähnlichen Ansatz (keine Blockierung des UI)
        setTimeout(() => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
              const data = results.data as any[];
              const errors = results.errors;
              
              if (errors.length > 0) {
                toast({
                  title: "Fehler beim Parsen der CSV-Datei",
                  description: "Bitte überprüfen Sie das Format Ihrer Datei.",
                  variant: "destructive",
                });
                setImporting(false);
                return;
              }
              
              // CSV-Format erkennen (TradingView oder andere)
              const detectCSVFormat = (row: any): 'tradingview' | 'unknown' => {
                // Prüfen auf charakteristische TradingView-Felder
                if (row['Symbol'] !== undefined || 
                    row['Setup'] !== undefined || 
                    row['Strategy'] !== undefined) {
                  return 'tradingview';
                }
                
                return 'unknown';
              };
              
              // TradingView Feldnamen erkennen
              const mapTradingViewFields = (row: any) => {
                // TradingView Exportfelder auf unsere Datenfelder mappen
                const mappings: Record<string, string[]> = {
                  symbol: ["Symbol", "Ticker", "symbol", "instrument", "Instrument", "Asset", "Trading Pair"],
                  setup: ["Setup", "Strategy", "setup", "Strategy Name", "strategy", "Trade Setup", "Pattern", "Trading Pattern"],
                  mainTrendM15: ["Main Trend", "mainTrendM15", "main_trend_m15", "Main Direction", "Trend M15", "Main Trend Direction", "Market Trend"],
                  internalTrendM5: ["Internal Trend", "internalTrendM5", "internal_trend_m5", "Sub Direction", "Trend M5", "Internal Direction", "Secondary Trend"],
                  entryType: ["Entry Type", "entryType", "entry_type", "Entry", "Order Type", "Trade Type", "Position Type", "Direction", "Side", "Buy/Sell"],
                  entryLevel: ["Entry Level", "entryLevel", "entry_level", "Entry Price", "Price", "Open Price", "Average Entry", "Entry Value"],
                  liquidation: ["Liquidation", "Stop Loss", "SL", "liquidation", "Stop", "Stop Level", "Stop Price", "Risk Level", "Exit if Wrong"],
                  location: ["Location", "location", "Entry Zone", "Zone", "Chart Area", "Chart Position", "Market Position"],
                  rrAchieved: ["RR Achieved", "R:R", "Risk/Reward Achieved", "rrAchieved", "rr_achieved", "Actual R:R", "Real R:R", "Risk Reward", "Risk-Reward", "RR Ratio Achieved"],
                  rrPotential: ["RR Potential", "Potential R:R", "Target R:R", "rrPotential", "rr_potential", "Expected R:R", "Target Risk Reward", "Planned RR", "Theoretical RR"],
                  isWin: ["Result", "Win", "isWin", "is_win", "Profit", "Trade Result", "Success", "Outcome", "Profitable", "Win/Loss"]
                };

                // Überprüfe für jedes unserer Felder, ob ein TradingView-Feld existiert
                const result: Record<string, any> = {};
                
                // Zeige verfügbare CSV-Spalten im ersten Durchlauf an
                if (Object.keys(result).length === 0) {
                  console.log("Verfügbare CSV-Spalten:", Object.keys(row).join(", "));
                }
                
                Object.entries(mappings).forEach(([ourField, possibleTvFields]) => {
                  // Suche in der Zeile nach einem passenden Feld
                  const matchedField = possibleTvFields.find(field => row[field] !== undefined);
                  
                  if (matchedField) {
                    result[ourField] = row[matchedField];
                    console.log(`Feld gefunden: ${ourField} = ${matchedField} mit Wert: ${row[matchedField]}`);
                  } else {
                    // Wenn kein Feld gefunden wurde, setze Default-Wert
                    result[ourField] = ourField === 'rrAchieved' || ourField === 'rrPotential' ? 0 : "";
                    console.log(`Kein passendes Feld für ${ourField} gefunden`);
                  }
                });
                
                return result;
              };

              const trades = data.map((row: any) => {
                try {
                  // Format erkennen
                  const csvFormat = detectCSVFormat(row);
                  let processedRow: any;
                  
                  // Standardmäßig TradingView-Format annehmen
                  processedRow = mapTradingViewFields(row);
                  
                  // Spezielle Behandlung für datenquellenspezifische Felder
                  
                  // Prüfen, ob dies eine CSV mit deinem speziellen Format ist (Symbol + pnl + timestamps + Preise)
                  const hasSpecialFormat = row.symbol && row.pnl !== undefined && 
                                         (row.boughtTimestamp !== undefined || row.soldTimestamp !== undefined) &&
                                         (row.buyPrice !== undefined || row.sellPrice !== undefined);
                                         
                  console.log("CSV-Format erkannt:", hasSpecialFormat ? "Speziell" : "Standard");
                  
                  // Versuche Profit/Loss-Wert aus verschiedenen möglichen Feldern zu extrahieren
                  // Erweiterte Debug-Ausgabe aller verfügbaren Spalten
                  console.log("IMPORT: Alle verfügbaren Spalten mit Werten:", 
                    Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(", "));
                  
                  let profitLossValue;
                  
                  if (hasSpecialFormat) {
                    // Verwende pnl aus deiner speziellen CSV
                    profitLossValue = row.pnl;
                    console.log("IMPORT: Spezialformat erkannt, verwende pnl:", profitLossValue);
                  } else {
                    // Standardfelder für andere Quellen - ERWEITERTE SPALTENSUCHE
                    // Prüfe jede mögliche Spalte und zeige die gefundenen Werte an
                    const possiblePlFields = ['P/L', 'PL', 'Profit', 'Profit/Loss', 'Net P/L', 
                                            'P&L', 'Trade P/L', 'Result Value', 'Net Profit', 
                                            'profit', 'gain', 'gain/loss', 'profit_loss', 
                                            'profitLoss', 'pl', 'pnl', 'result', 'Result',
                                            'Profit($)', 'Profit($)', 'Profit($)', 'P/L($)',
                                            'Net P/L($)', 'Net_Profit', 'GrossProfit', 'NetProfit',
                                            'Realized P/L', 'Realized_PL', 'tradePL'];
                    
                    // Log alle möglichen Felder und ihre Werte, wenn vorhanden
                    possiblePlFields.forEach(field => {
                      if (row[field] !== undefined) {
                        console.log(`IMPORT: Gefundenes P/L Feld "${field}" mit Wert: ${row[field]}`);
                      }
                    });
                    
                    profitLossValue = null;
                    
                    // Prüfe jedes mögliche Feld in der angegebenen Reihenfolge
                    for (const field of possiblePlFields) {
                      if (row[field] !== undefined && row[field] !== null && row[field] !== "") {
                        profitLossValue = row[field];
                        console.log(`IMPORT: Verwende P/L Wert aus Feld "${field}": ${profitLossValue}`);
                        break;
                      }
                    }
                    
                    // Fallback auf "0" nur wenn wirklich kein Wert gefunden wurde
                    if (profitLossValue === null) {
                      console.log("IMPORT: Kein P/L Feld gefunden, verwende Default-Wert 0");
                      profitLossValue = "0";
                    }
                  }
                  
                  // Entferne Währungssymbole und Tausendertrennzeichen für korrekte Umwandlung in Float
                  let profitLoss = 0;
                  
                  // WICHTIG: Zuerst prüfen, ob der Wert bereits eine Nummer ist
                  if (typeof profitLossValue === 'number') {
                    profitLoss = profitLossValue;
                    console.log("IMPORT: P/L ist bereits numerisch:", profitLoss);
                  }
                  // Verbesserte Erkennung für negative Werte wie $(272.00)
                  else if (typeof profitLossValue === 'string' && profitLossValue.includes('$(')) {
                    // Negativer Wert in Format $(272.00)
                    const numericValue = profitLossValue.replace(/\$\(|\)/g, '');
                    profitLoss = -parseFloat(numericValue);
                    console.log("IMPORT: Negativer P/L (Klammer-Format) erkannt:", profitLossValue, "→", profitLoss);
                  }
                  // Erkennung für negative Werte mit Minuszeichen und Währungssymbol wie -$272.00
                  else if (typeof profitLossValue === 'string' && profitLossValue.includes('-$')) {
                    const numericValue = profitLossValue.replace(/[^0-9.\-,]/g, '');
                    profitLoss = -Math.abs(parseFloat(numericValue));
                    console.log("IMPORT: Negativer P/L (Minus-Format) erkannt:", profitLossValue, "→", profitLoss);
                  }
                  else if (typeof profitLossValue === 'string') {
                    // Standardverarbeitung für andere Formate
                    const cleanProfitLossValue = String(profitLossValue)
                      .replace(/[$€£¥]/g, '') // Währungssymbole entfernen
                      .replace(/\(([^)]+)\)/g, '-$1') // (123.45) zu -123.45 umwandeln
                      .replace(/[^0-9.\-,]/g, '') // Alle nicht-numerischen Zeichen außer . - , entfernen
                      .replace(',', '.'); // Komma durch Punkt ersetzen
                      
                    profitLoss = parseFloat(cleanProfitLossValue) || 0;
                    console.log("IMPORT: Profit/Loss erkannt und bereinigt:", profitLossValue, "→", cleanProfitLossValue, "→", profitLoss);
                  } else {
                    console.log("IMPORT: Kein gültiger P/L-Wert gefunden, verwende 0");
                  }
                  
                  // Setze entryType basierend auf buyPrice/sellPrice oder anderen Feldern wenn verfügbar
                  let entryType = processedRow.entryType || "";
                  
                  // Suche mehr mögliche Felder für entryType
                  const possibleEntryFields = ['Entry Type', 'EntryType', 'entry_type', 'Entry', 'Order Type', 
                                              'Trade Type', 'Position Type', 'Direction', 'Side', 'Buy/Sell',
                                              'Trade Direction', 'Position', 'OrderSide', 'Type', 'order',
                                              'action', 'Action', 'trade_type', 'positionType'];
                                              
                  // Durchsuche alle möglichen Entry-Felder
                  for (const field of possibleEntryFields) {
                    if (row[field] !== undefined && row[field] !== null && row[field] !== "") {
                      const value = String(row[field]).trim().toLowerCase();
                      if (value === "long" || value === "buy" || value === "bullish") {
                        entryType = "Long";
                        console.log(`IMPORT: Entry-Typ aus Feld "${field}" gesetzt: ${entryType}`);
                        break;
                      } else if (value === "short" || value === "sell" || value === "bearish") {
                        entryType = "Short";
                        console.log(`IMPORT: Entry-Typ aus Feld "${field}" gesetzt: ${entryType}`);
                        break;
                      }
                    }
                  }
                  
                  // Fallback auf Price-basierte Logik
                  if (!entryType && hasSpecialFormat && row.buyPrice && row.sellPrice) {
                    entryType = parseFloat(row.buyPrice) > 0 ? "Long" : "Short";
                    console.log("IMPORT: Entry-Typ basierend auf Preis gesetzt:", entryType);
                  }
                  
                  console.log("IMPORT: Finaler EntryType:", entryType);
                  
                  // Setze Datumsfeld aus speziellen Timestamps oder anderen möglichen Datumsfeldern
                  // Suche mehr mögliche Datumsfelder
                  const possibleDateFields = ['Date', 'date', 'Time', 'time', 'timestamp', 'Timestamp',
                                             'Trade Date', 'TradeDate', 'trade_date', 'DateTime', 'Date Time',
                                             'Entry Date', 'EntryDate', 'entry_date', 'OpenTime', 'Open Time',
                                             'CloseTime', 'Close Time', 'ExecutionTime', 'Execution Time'];
                  
                  // Durchsuche alle möglichen Datumsfelder und zeige gefundene an
                  console.log("IMPORT: Suche Datumsfelder...");
                  possibleDateFields.forEach(field => {
                    if (row[field] !== undefined && row[field] !== null && row[field] !== "") {
                      console.log(`IMPORT: Datumsfeld "${field}" gefunden mit Wert: ${row[field]}`);
                    }
                  });
                  
                  // Versuche das erste verfügbare Datumsfeld zu verwenden
                  let tradeDate = null;
                  for (const field of possibleDateFields) {
                    if (row[field] !== undefined && row[field] !== null && row[field] !== "") {
                      tradeDate = row[field];
                      console.log(`IMPORT: Verwende Datum aus Feld "${field}": ${tradeDate}`);
                      break;
                    }
                  }
                  
                  // Spezialbehandlung für besondere Formate
                  if (hasSpecialFormat && (row.boughtTimestamp || row.soldTimestamp)) {
                    // Verwende den ersten verfügbaren Timestamp
                    tradeDate = row.boughtTimestamp || row.soldTimestamp || tradeDate;
                    console.log("IMPORT: Datum aus speziellem Timestamp gesetzt:", tradeDate);
                  }
                  
                  // Fallback auf aktuelles Datum, wenn kein Datum gefunden wurde
                  if (!tradeDate) {
                    tradeDate = new Date().toISOString();
                    console.log("IMPORT: Kein Datum gefunden, verwende aktuelles Datum:", tradeDate);
                  }
                  
                  // Setze isWin basierend auf profitLoss
                  const isWin = profitLoss > 0;
                  
                  // Berechne RR-Werte basierend auf Win/Loss und P/L
                  let rrAchieved = 0;
                  let rrPotential = 0;
                  
                  // Wenn der Trade ein Win ist, verwenden wir das errechnete RR oder den vorhandenen Wert
                  if (isWin) {
                    rrAchieved = processedRow.rrAchieved || 1;
                    rrPotential = processedRow.rrPotential || 1;
                  } else {
                    // Bei einem Verlust setzen wir rrAchieved auf -1 und lassen rrPotential leer (0)
                    rrAchieved = -1;
                    rrPotential = 0;
                  }
                  
                  // M5 Trend Vereinfachung: "Scalp Long" → "Long", "Scalp Short" → "Short"
                  let internalTrendM5 = processedRow.internalTrendM5 || "";
                  if (internalTrendM5.includes("Scalp Long")) {
                    internalTrendM5 = "Long";
                  } else if (internalTrendM5.includes("Scalp Short")) {
                    internalTrendM5 = "Short";
                  }
                                    
                  return {
                    userId,
                    symbol: processedRow.symbol || "",
                    setup: "", // Leeres Setup
                    mainTrendM15: processedRow.mainTrendM15 || "",
                    internalTrendM5,
                    entryType: entryType,
                    entryLevel: processedRow.entryLevel || "",
                    liquidation: processedRow.liquidation || "",
                    location: processedRow.location || "",
                    rrAchieved,
                    rrPotential,
                    profitLoss,
                    isWin,
                    date: tradeDate,
                    chartImage: row.chartImage || linkInput || "",
                  };
                } catch (error) {
                  console.error("Fehler beim Verarbeiten der Zeile:", error);
                  
                  // Fallback - Erstelle minimalen Trade für die Zeile
                  return {
                    userId,
                    symbol: row.Symbol || row.symbol || "",
                    setup: "",
                    mainTrendM15: "",
                    internalTrendM5: "",
                    entryType: "",
                    entryLevel: "",
                    liquidation: "",
                    location: "",
                    rrAchieved: 0,
                    rrPotential: 0,
                    isWin: false,
                    date: new Date().toISOString(),
                    chartImage: row.chartImage || linkInput || "",
                  };
                }
              });
              
              if (trades.length > 0) {
                console.log("Importiere", trades.length, "Trades");
                importMutation.mutate(trades);
                if (onImport) {
                  onImport();
                }
              } else {
                toast({
                  title: "Keine Trades gefunden",
                  description: "Die CSV-Datei enthält keine gültigen Trade-Daten.",
                  variant: "destructive",
                });
                setImporting(false);
              }
            },
            error: function(error: Error) {
              toast({
                title: "Fehler beim Parsen der CSV-Datei",
                description: error.message,
                variant: "destructive",
              });
              setImporting(false);
            }
          });
        }, 0);
      };
      
      reader.onerror = function(error) {
        toast({
          title: "Fehler beim Lesen der Datei",
          description: "Die Datei konnte nicht gelesen werden.",
          variant: "destructive",
        });
        setImporting(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Import fehlgeschlagen",
        description: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten",
        variant: "destructive",
      });
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Linke Spalte - TradingView Chart Link Eingabe */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">TradingView Chart Link</p>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="https://www.tradingview.com/x/..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className={`h-8 text-sm ${linkError ? "border-red-500" : ""}`}
            />
            <Button 
              onClick={handleLinkImport}
              className="bg-gradient-to-r from-primary to-blue-400 hover:from-primary hover:to-blue-500 text-white flex-shrink-0 h-8 text-xs px-2"
              disabled={importing}
              size="sm"
            >
              {importing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <LinkIcon className="h-3 w-3" />
              )}
            </Button>
          </div>
          {linkError && (
            <p className="text-xs text-red-500">{linkError}</p>
          )}
        </div>
        
        {/* Rechte Spalte - CSV Upload */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">CSV Upload</p>
          <div className="flex items-center space-x-2">
            <div 
              className={`border border-dashed border-primary/40 rounded-md p-1 text-center hover:border-primary/60 transition-colors flex-grow h-8 flex items-center justify-center cursor-pointer`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                {file ? file.name : "CSV-Datei auswählen oder hierher ziehen"}
              </p>
            </div>
            <Button
              onClick={handleImport}
              className="bg-gradient-to-r from-primary to-blue-400 hover:from-primary hover:to-blue-500 text-white h-8 text-xs px-2"
              disabled={!file || importing}
              size="sm"
            >
              {importing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
            </Button>
          </div>
          {file && (
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(2)} KB
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1 text-destructive inline-flex items-center justify-center"
                onClick={() => setFile(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}