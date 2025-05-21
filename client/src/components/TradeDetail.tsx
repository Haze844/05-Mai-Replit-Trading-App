import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Trade, 
  setupTypes, 
  trendTypes, 
  entryLevelTypes,
  simpleTrendTypes,
  structureTypes,
  timeframeTypes,
  liquidationTypes,
  unmitZoneTypes,
  marketPhaseTypes,
  rrValues 
} from "@shared/schema";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { BadgeTrend } from "@/components/ui/badge-trend";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ChartImageUpload from "./ChartImageUpload";
import TradeNotes from "./TradeNotes";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, MessageSquare, Edit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TradeDetailProps {
  selectedTrade: Trade | null;
  onTradeSelected?: (trade: Trade | null) => void;
  isCompareView?: boolean;
}

export default function TradeDetail({ selectedTrade, onTradeSelected, isCompareView = false }: TradeDetailProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  
  // Status für die bearbeiteten Felder, wird nur initialisiert, wenn selectedTrade sich ändert oder Edit-Modus gestartet wird
  const [editData, setEditData] = useState<Partial<Trade>>({});
  
  // Editing-States für alle editierbaren Felder
  const [editingSetup, setEditingSetup] = useState<string>('');
  const [editingEntryLevel, setEditingEntryLevel] = useState<string>('');
  const [editingTrend, setEditingTrend] = useState<string>('');
  const [editingInternalTrendNew, setEditingInternalTrendNew] = useState<string>('');
  const [editingMicroTrend, setEditingMicroTrend] = useState<string>('');
  const [editingMainTrend, setEditingMainTrend] = useState<string>('');
  const [editingInternalTrend, setEditingInternalTrend] = useState<string>('');
  const [editingLocation, setEditingLocation] = useState<string>('');
  const [editingStructure, setEditingStructure] = useState<string>('');
  const [editingLiquidation, setEditingLiquidation] = useState<string>('');
  const [editingTimeframeEntry, setEditingTimeframeEntry] = useState<string>('');
  const [editingMarketPhase, setEditingMarketPhase] = useState<string>('');
  const [editingUnmitZone, setEditingUnmitZone] = useState<string>('');
  const [editingRangePoints, setEditingRangePoints] = useState<number | undefined>(undefined);
  const [editingRRAchieved, setEditingRRAchieved] = useState<number | undefined>(undefined);
  const [editingRRPotential, setEditingRRPotential] = useState<number | undefined>(undefined);
  const [editingSlType, setEditingSlType] = useState<string>('');
  const [editingSlPoints, setEditingSlPoints] = useState<number | undefined>(undefined);
  const [editingProfitLoss, setEditingProfitLoss] = useState<number | undefined>(undefined);
  
  // Referenz für das geöffnete Select-Menü - muss an einer Stelle definiert werden
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Helfer-Funktion zum Aktualisieren einzelner Felder
  const updateField = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Mutation für das Update der Trade-Daten
  const updateTradeMutation = useMutation({
    mutationFn: async (updateData: Partial<Trade> & { id: number }) => {
      const { id, ...data } = updateData;
      await apiRequest("PUT", `/api/trades/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      // Keine Toast-Nachricht für jede einzelne Änderung, um nicht zu stören
      // Bearbeitungsmodus bleibt aktiv, bis explizit beendet
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Effekt zum Initialisieren der Bearbeitungsfelder wenn der Bearbeitungsmodus gestartet wird
  useEffect(() => {
    if (selectedTrade && editMode) {
      // Alle aktuellen Werte in den editData-Zustand kopieren
      setEditData({
        // Bestehende Felder
        setup: selectedTrade.setup || '',
        mainTrendM15: selectedTrade.mainTrendM15 || '',
        internalTrendM5: selectedTrade.internalTrendM5 || '',
        entryLevel: selectedTrade.entryLevel || '',
        profitLoss: selectedTrade.profitLoss || 0,
        
        // Neue Felder
        trend: selectedTrade.trend || '',
        internalTrend: selectedTrade.internalTrend || '',
        microTrend: selectedTrade.microTrend || '',
        structure: selectedTrade.structure || '',
        timeframeEntry: selectedTrade.timeframeEntry || '',
        liquidation: selectedTrade.liquidation || '',
        unmitZone: selectedTrade.unmitZone || '',
        rangePoints: selectedTrade.rangePoints,
        marketPhase: selectedTrade.marketPhase || '',
        rrAchieved: selectedTrade.rrAchieved || 0,
        rrPotential: selectedTrade.rrPotential || 0,
        location: selectedTrade.location || '',
        slType: selectedTrade.slType || '',
        slPoints: selectedTrade.slPoints
      });
    } else if (!editMode) {
      // Wenn der Bearbeitungsmodus beendet wird, setze editData zurück
      setEditData({});
    }
  }, [selectedTrade, editMode]);

  // Starte den Edit-Modus
  const startEditMode = () => {
    if (!selectedTrade) return;
    setEditMode(true);
  };

  // Abbrechen des Bearbeitungsmodus ohne zu speichern
  const cancelEditMode = () => {
    setEditMode(false);
    setEditData({});
    toast({
      title: "Bearbeitung abgebrochen",
      description: "Die Änderungen wurden verworfen."
    });
  };

  // Speichern der Änderungen
  const saveChanges = () => {
    if (!selectedTrade) return;
    
    // Konsolenausgabe für Debugging
    console.log("Speichere Änderungen:", {
      id: selectedTrade.id,
      ...editData
    });
    
    // Werte aus editData mit der ID kombinieren und an die Mutation übergeben
    updateTradeMutation.mutate({
      id: selectedTrade.id,
      ...editData,
      // userId ist wichtig, damit die API weiß, zu welchem Benutzer der Trade gehört
      userId: selectedTrade.userId || 2
    });
    
    // Bearbeitungsmodus beenden und Toast anzeigen
    setEditMode(false);
    toast({
      title: "Änderungen gespeichert",
      description: "Die Trade-Daten wurden erfolgreich aktualisiert."
    });
  };

  // Mutation für das Update des Charts
  const updateChartImageMutation = useMutation({
    mutationFn: async ({ id, chartImage, userId }: { id: number, chartImage: string | null, userId: number | null }) => {
      await apiRequest("PUT", `/api/trades/${id}`, { chartImage, userId: userId || 2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Chart aktualisiert",
        description: "Der TradingView-Chart wurde erfolgreich gespeichert."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Speichern des Charts",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handler für Chart-Änderungen
  const handleChartImageChange = (base64Image: string | null) => {
    if (!selectedTrade) return;
    
    updateChartImageMutation.mutate({
      id: selectedTrade.id,
      chartImage: base64Image,
      userId: selectedTrade.userId || 2 // Wichtig: userId hinzufügen, Fallback auf 2 (Mo) falls nicht gesetzt
    });
  };
  
  // Mutation für das Speichern des Feedbacks - VERBESSERTE VERSION
  const updateFeedbackMutation = useMutation({
    mutationFn: async (data: { id: number | string, gptFeedback: string, userId: number }) => {
      console.log("Sende Feedback-Update-Request für ID:", data.id);
      
      try {
        // DIREKTE FETCH-ANFRAGE MIT CREDENTIALS: INCLUDE FÜR SESSION-ERHALT
        const response = await fetch(`/api/trades/${data.id}/feedback`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gptFeedback: data.gptFeedback,
            userId: data.userId
          }),
          credentials: 'include'  // ENTSCHEIDEND: Stellt sicher, dass Cookies mitgesendet werden
        });
        
        if (!response.ok) {
          throw new Error(`Fehler beim Speichern des Feedbacks: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Fehler beim Feedback-Update:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Feedback wurde erfolgreich gespeichert, Antwort vom Server:", data);
      
      // Sofort alle Anfragen invalidieren
      queryClient.invalidateQueries();
      
      // Sofort nach allen Trades neu fragen
      queryClient.refetchQueries({ queryKey: ['/api/trades'] });
      
      // Beide Benutzer explizit neu laden
      queryClient.refetchQueries({ queryKey: ['/api/trades', { userId: 1 }] });
      queryClient.refetchQueries({ queryKey: ['/api/trades', { userId: 2 }] });
      
      // Verzögertes zusätzliches Refetch - für potenziell langsame Server-Reaktionen
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/trades'] });
      }, 300);
      
      // Spezielles Update für die Vergleichsansicht
      if (isCompareView && onTradeSelected && selectedTrade) {
        // Deep copy des aktuellen Trades mit aktualisierten Daten
        const updatedTrade = { 
          ...selectedTrade,
          gptFeedback: feedbackText
        };
        // Benachrichtige die Elternkomponente über den aktualisierten Trade
        onTradeSelected(updatedTrade);
      }
    }
  });

  // VOLLSTÄNDIG ÜBERARBEITETE FUNKTION ZUM SPEICHERN DES FEEDBACKS
  const handleSaveFeedback = () => {
    if (!selectedTrade) return;
    
    // SCHRITT 1: BESTIMME DIE KORREKTE TRADE-ID UND USER-ID
    let tradeId = selectedTrade.id;
    let originalUserId = selectedTrade.userId || 2; // Default: Mo (2)
    
    console.log("Speichere Feedback für Trade", selectedTrade);
    
    // Verarbeitung basierend auf Trade-ID-Format
    if (typeof selectedTrade.id === 'string') {
      // FALL 1: Wenn die ID ein String ist (Format "mo-123" oder "jasper-123")
      console.log("String-ID erkannt:", selectedTrade.id);
      
      if (selectedTrade.id.includes('-')) {
        const parts = selectedTrade.id.split('-');
        const userPrefix = parts[0].toLowerCase();
        
        // Bestimme die korrekte User-ID aus dem Präfix
        originalUserId = userPrefix === 'mo' ? 2 : 1;
        
        // Extrahiere die numerische ID
        if (parts.length > 1) {
          tradeId = parseInt(parts[1], 10);
          console.log(`ID '${selectedTrade.id}' verarbeitet zu: tradeId=${tradeId}, userId=${originalUserId}`);
        }
      }
    } else if (typeof selectedTrade.originalId !== 'undefined') {
      // FALL 2: Wenn die Original-ID explizit vorhanden ist
      tradeId = selectedTrade.originalId;
      console.log("Verwende explizite originalId:", tradeId);
    }
    
    console.log(`Endgültige Parameter für Feedback-Update: tradeId=${tradeId}, userId=${originalUserId}`);
    
    // SCHRITT 2: SENDE DIE AKTUALISIERUNGSANFRAGE
    console.log(`Sende PATCH-Anfrage an: /api/trades/${tradeId}/feedback`);
    
    // Direkte Fetch-Anfrage mit explizitem credentials: include
    fetch(`/api/trades/${tradeId}/feedback`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gptFeedback: feedbackText,
        userId: originalUserId
      }),
      credentials: 'include'  // WICHTIG: Stellt sicher, dass Session-Cookies mitgesendet werden
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Fehler: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("✅ Feedback erfolgreich gespeichert:", data);
      
      // SCHRITT 3: UI-FEEDBACK UND CACHE-AKTUALISIERUNG
      
      // Erfolgsmeldung anzeigen
      toast({
        title: "Feedback gespeichert",
        description: "Das Feedback wurde erfolgreich aktualisiert."
      });
      
      // Bearbeitungsmodus deaktivieren
      setIsEditingFeedback(false);
      
      // KRITISCH: Sofortige Cache-Aktualisierungen
      // 1. Alle Caches invalidieren
      queryClient.invalidateQueries();
      
      // 2. Sofort alle Trades neu laden
      queryClient.refetchQueries({ queryKey: ['/api/trades'] });
      
      // 3. Gezielt beide Benutzer-Caches aktualisieren
      queryClient.refetchQueries({ queryKey: ['/api/trades', { userId: 1 }] });
      queryClient.refetchQueries({ queryKey: ['/api/trades', { userId: 2 }] });
      
      // 4. Erneute Aktualisierung nach einer kurzen Verzögerung
      setTimeout(() => {
        console.log("Erneutes Laden aller Trades nach Feedback-Update");
        queryClient.refetchQueries({ queryKey: ['/api/trades'] });
        queryClient.refetchQueries({ queryKey: ['/api/trades', { userId: 1 }] });
        queryClient.refetchQueries({ queryKey: ['/api/trades', { userId: 2 }] });
      }, 300);
      
      // SCHRITT 4: SPEZIELLES UPDATE FÜR VERGLEICHSANSICHT
      if (isCompareView && onTradeSelected && selectedTrade) {
        // Aktualisiere den lokalen Trade in der übergeordneten Komponente
        const updatedTrade = {
          ...selectedTrade,
          gptFeedback: feedbackText
        };
        
        console.log("Aktualisiere Trade in Vergleichsansicht:", updatedTrade);
        
        // Benachrichtige die Elternkomponente (TradeCompare)
        onTradeSelected(updatedTrade);
      }
    })
    .catch(error => {
      console.error("❌ Fehler beim Speichern des Feedbacks:", error);
      
      // Fehlermeldung anzeigen
      toast({
        title: "Fehler beim Speichern",
        description: error.message || "Das Feedback konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    });
  };

  // Funktion entfernt, da wir jetzt BadgeTrend verwenden
  
  // Funktion zum automatischen Speichern und Beenden des Bearbeitungsmodus
  const autoSave = () => {
    // Nicht speichern/abbrechen wenn gerade ein Menü geöffnet ist
    if (menuOpen) {
      console.log("Menü ist offen, keine Aktion");
      return;
    }
    
    if (editMode && selectedTrade) {
      saveChanges();
      
      // Bearbeitungsmodus erst nach dem Speichern beenden und Toast anzeigen
      setTimeout(() => {
        setEditMode(false);
        toast({
          title: "Änderungen gespeichert",
          description: "Die Trade-Daten wurden erfolgreich aktualisiert."
        });
      }, 100);
    }
  };

  // Klick-Handler zum Umschalten des Bearbeitungsmodus
  const handleCardClick = (e: React.MouseEvent) => {
    // Wenn wir bereits im Bearbeitungsmodus sind, oder wenn angeklickte Element ein Button oder ein anderes interaktives Element ist, nichts tun
    if (editMode || 
        e.target instanceof HTMLButtonElement || 
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('select') ||
        (e.target as HTMLElement).closest('input')) {
      return;
    }
    
    // Sonst in den Edit-Modus wechseln
    startEditMode();
  };
  
  // Flag, um zu verfolgen, ob gerade ein DOM-Event verarbeitet wird
  const [processingEvent, setProcessingEvent] = useState(false);
  
  // Event-Listener für Klicks außerhalb der Karte hinzufügen (zum automatischen Speichern)
  useEffect(() => {
    // Wichtig: Diese Funktion wird nur beim Mounten/Unmounten des Komponenten ausgeführt
    function handleClickOutside(event: MouseEvent) {
      // Verhindere die Verarbeitung, wenn bereits ein Event verarbeitet wird
      // oder wenn ein Menü offen ist (wichtig für Dropdown-Auswahlen)
      if (processingEvent || menuOpen) {
        console.log("Event wird ignoriert - Verarbeitung oder Menü offen", { processingEvent, menuOpen });
        return;
      }
      
      // Prüft, ob der Klick außerhalb des Cards war und wir im Bearbeitungsmodus sind
      if (cardRef.current && !cardRef.current.contains(event.target as Node) && editMode) {
        console.log("Klick außerhalb erkannt - speichere Änderungen");
        setProcessingEvent(true);
        
        // Event-Queue nutzen um zu vermeiden, dass das Event noch vor Dropdown-Schließen verarbeitet wird
        setTimeout(() => {
          autoSave();
          // Nach kurzer Verzögerung können wir wieder Events verarbeiten
          setTimeout(() => {
            setProcessingEvent(false);
          }, 200);
        }, 100);
      }
    }
    
    // Escape-Taste zum Speichern
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && editMode && !processingEvent) {
        console.log("Escape-Taste gedrückt - speichere Änderungen");
        setProcessingEvent(true);
        
        setTimeout(() => {
          autoSave();
          setTimeout(() => {
            setProcessingEvent(false);
          }, 200);
        }, 100);
      }
    }

    // Event-Listener für Klicks und Escape-Taste
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Cleanup-Funktion
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [editMode, menuOpen, processingEvent]);

  return (
    <Card className="bg-card overflow-hidden mb-6 sticky top-4">
      <CardHeader className="border-b border-border">
        <CardTitle>Trade Details</CardTitle>
      </CardHeader>

      {!selectedTrade ? (
        // Empty state
        <div className="p-6 text-center text-muted-foreground">
          <i className="fas fa-mouse-pointer text-3xl mb-2"></i>
          <p>Wähle einen Trade aus, um Details zu sehen</p>
        </div>
      ) : (
        // Trade details
        <CardContent className="p-4" ref={cardRef} onClick={handleCardClick}>

          
          {/* Hauptinformationen in einer Zeile */}
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <div />
            <div>
              <BadgeWinLoss isWin={selectedTrade.isWin} />
              {editMode ? (
                <div className="ml-2 flex items-center">
                  <Input
                    type="number"
                    className="w-24 h-7 text-xs"
                    placeholder="P/L Wert"
                    value={editingProfitLoss !== undefined ? editingProfitLoss : selectedTrade.profitLoss || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setEditingProfitLoss(value);
                      updateField('profitLoss', value);
                      // Automatisch auch isWin aktualisieren basierend auf P/L
                      if (value !== undefined) {
                        updateField('isWin', value > 0);
                      }
                    }}
                  />
                  <span className="ml-1">$</span>
                </div>
              ) : (
                <span className={`ml-2 font-bold ${selectedTrade.profitLoss && selectedTrade.profitLoss > 0 ? 'text-green-500' : selectedTrade.profitLoss && selectedTrade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                  {selectedTrade.profitLoss ? `${selectedTrade.profitLoss > 0 ? '+' : ''}$${selectedTrade.profitLoss.toFixed(2)}` : '-'}
                </span>
              )}
            </div>
          </div>
          
          {/* Drei Spalten für die wichtigsten Informationen */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Spalte 1: Setup und Trends */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Setup &amp; Einstieg</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Datum</div>
                      <div className="font-bold text-xs">{formatDate(selectedTrade.date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Symbol</div>
                      <div className="font-bold text-xs">{selectedTrade.symbol}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Setup</div>
                    {editMode ? (
                      <Select 
                        value={editingSetup} 
                        onValueChange={setEditingSetup} 
                        onOpenChange={(open) => {
                          console.log("Setup select menu open:", open);
                          setMenuOpen(open);
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Setup auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {setupTypes.map((setup) => (
                            <SelectItem key={setup} value={setup}>
                              {setup}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="font-medium text-sm">{selectedTrade.setup}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Einstieg</div>
                    {editMode ? (
                      <Select value={editingEntryLevel} onValueChange={setEditingEntryLevel}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Level auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {entryLevelTypes.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="font-medium text-sm">
                        <BadgeTrend trend={selectedTrade.entryType || '-'} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Spalte 2: Trends */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Trends</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Trend</div>
                      {editMode ? (
                        <Select value={editingTrend} onValueChange={setEditingTrend}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Trend" />
                          </SelectTrigger>
                          <SelectContent>
                            {simpleTrendTypes.map((trend) => (
                              <SelectItem key={trend} value={trend}>
                                {trend}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <BadgeTrend trend={selectedTrade.trend || '-'} size="sm" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Int.</div>
                      {editMode ? (
                        <Select value={editingInternalTrendNew} onValueChange={setEditingInternalTrendNew}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Int." />
                          </SelectTrigger>
                          <SelectContent>
                            {simpleTrendTypes.map((trend) => (
                              <SelectItem key={trend} value={trend}>
                                {trend}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <BadgeTrend trend={selectedTrade.internalTrend || '-'} size="sm" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Micro</div>
                      {editMode ? (
                        <Select value={editingMicroTrend} onValueChange={setEditingMicroTrend}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Micro" />
                          </SelectTrigger>
                          <SelectContent>
                            {simpleTrendTypes.map((trend) => (
                              <SelectItem key={trend} value={trend}>
                                {trend}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <BadgeTrend trend={selectedTrade.microTrend || '-'} size="sm" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">M15</div>
                      {editMode ? (
                        <Select value={editingMainTrend} onValueChange={setEditingMainTrend}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="M15" />
                          </SelectTrigger>
                          <SelectContent>
                            {trendTypes.map((trend) => (
                              <SelectItem key={trend} value={trend}>
                                {trend}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <BadgeTrend trend={selectedTrade.mainTrendM15 || '-'} size="sm" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">M5</div>
                      {editMode ? (
                        <Select value={editingInternalTrend} onValueChange={setEditingInternalTrend}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="M5" />
                          </SelectTrigger>
                          <SelectContent>
                            {trendTypes.map((trend) => (
                              <SelectItem key={trend} value={trend}>
                                {trend}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <BadgeTrend trend={selectedTrade.internalTrendM5 || '-'} size="sm" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Spalte 3: Location und Liquidation */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Position &amp; Struktur</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Location</div>
                      {editMode ? (
                        <Select value={editingLocation} onValueChange={setEditingLocation}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Location" />
                          </SelectTrigger>
                          <SelectContent>
                            {['FVG', 'FVG Sweep', 'Micro FVG', 'Micro FVG Sweep', 'Wick', 'BOS', 'Delivery'].map((loc) => (
                              <SelectItem key={loc} value={loc}>
                                {loc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.location || '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Struktur</div>
                      {editMode ? (
                        <Select value={editingStructure} onValueChange={setEditingStructure}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Struktur" />
                          </SelectTrigger>
                          <SelectContent>
                            {structureTypes.map((structure) => (
                              <SelectItem key={structure} value={structure}>
                                {structure}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.structure || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Liquidation</div>
                      {editMode ? (
                        <Select value={editingLiquidation} onValueChange={setEditingLiquidation}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Liquidation" />
                          </SelectTrigger>
                          <SelectContent>
                            {liquidationTypes.map((liq) => (
                              <SelectItem key={liq} value={liq}>
                                {liq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.liquidation || '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">TF Entry</div>
                      {editMode ? (
                        <Select value={editingTimeframeEntry} onValueChange={setEditingTimeframeEntry}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="TF Entry" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeframeTypes.map((tf) => (
                              <SelectItem key={tf} value={tf}>
                                {tf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.timeframeEntry || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weitere Details in 2 Spalten */}
          <div className="grid grid-cols-2 gap-3">
            {/* Linke Spalte - Marktzonen */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Marktzonen</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Marktphase</div>
                      {editMode ? (
                        <Select value={editingMarketPhase} onValueChange={setEditingMarketPhase}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Phase" />
                          </SelectTrigger>
                          <SelectContent>
                            {marketPhaseTypes.map((phase) => (
                              <SelectItem key={phase} value={phase}>
                                {phase}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.marketPhase || '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Unmit. Zone</div>
                      {editMode ? (
                        <Select value={editingUnmitZone} onValueChange={setEditingUnmitZone}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {unmitZoneTypes.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.unmitZone || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Range Punkte</div>
                    {editMode ? (
                      <Input
                        type="number"
                        value={editingRangePoints === undefined ? "" : editingRangePoints}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                          setEditingRangePoints(value);
                        }}
                        className="h-7 text-xs"
                        min="0"
                      />
                    ) : (
                      <div className="font-medium text-sm">{(selectedTrade.rangePoints !== undefined && selectedTrade.rangePoints !== null) ? `${selectedTrade.rangePoints}` : '-'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rechte Spalte - Ergebnis */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Ergebnis &amp; RR</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">RR Achieved</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap">
                          {[-1, 1, 2, 3, 4, 5, 6, 7].map(val => (
                            <Button
                              key={val}
                              type="button"
                              variant={editingRRAchieved === val ? "default" : "outline"}
                              size="sm"
                              className={`p-1 h-6 text-[10px] flex-1 ${val === -1 ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : ''}`}
                              onClick={() => setEditingRRAchieved(val)}
                            >
                              {val}R
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.rrAchieved ? `${selectedTrade.rrAchieved}R` : '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">RR Potential</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap">
                          {[1, 2, 3, 4, 5, 6, 7].map(val => (
                            <Button
                              key={val}
                              type="button"
                              variant={editingRRPotential === val ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px] flex-1"
                              onClick={() => setEditingRRPotential(val)}
                            >
                              {val}R
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.rrPotential ? `${selectedTrade.rrPotential}R` : '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="text-xs text-muted-foreground">SL Typ</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap">
                          {["Sweep", "zerstört"].map(val => (
                            <Button
                              key={val}
                              type="button"
                              variant={editingSlType === val ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px] flex-1"
                              onClick={() => setEditingSlType(val)}
                            >
                              {val}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.slType || '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">SL Punkte</div>
                      {editMode ? (
                        <div>
                          <Select 
                            value={editingSlPoints?.toString() || ''}
                            onValueChange={(value) => setEditingSlPoints(Number(value))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Punkte wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 30 }, (_, i) => i + 1).map((val) => (
                                <SelectItem key={val} value={val.toString()} className="text-xs">
                                  {val}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.slPoints || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-muted-foreground">Trade Feedback</div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs px-2 hover:bg-primary/10" 
                onClick={() => selectedTrade && setIsEditingFeedback(!isEditingFeedback)}
              >
                {isEditingFeedback ? 'Abbrechen' : 'Bearbeiten'}
              </Button>
            </div>
            
            {isEditingFeedback ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Geben Sie hier Ihr Feedback zum Trade ein..."
                  className="min-h-[100px] text-sm"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      setIsEditingFeedback(false);
                      if (selectedTrade) {
                        setFeedbackText(selectedTrade.gptFeedback || "");
                      }
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="text-xs"
                    onClick={handleSaveFeedback}
                  >
                    Speichern
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-3 rounded-lg text-sm relative group">
                {selectedTrade?.gptFeedback || "Kein Feedback verfügbar."}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => {
                      if (selectedTrade) {
                        setIsEditingFeedback(true);
                        setFeedbackText(selectedTrade.gptFeedback || "");
                      }
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* TradingView Chart Upload */}
          <div className="border-t border-border pt-4 mt-6">
            <ChartImageUpload 
              existingImage={selectedTrade.chartImage || null} 
              onChange={handleChartImageChange}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
