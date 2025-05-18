import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Save, Plus } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Textarea } from '@/components/ui/textarea';

interface TradeNote {
  id: string;
  text: string;
  createdAt: string;
  userName: string;
}

interface TradeNotesProps {
  tradeId: string;
  jasperNotes: TradeNote[];
  moNotes: TradeNote[];
  onAddNote?: (note: { text: string, userName: string, tradeId: string }) => void;
}

const TradeNotes: React.FC<TradeNotesProps> = ({ 
  tradeId, 
  jasperNotes = [], 
  moNotes = [], 
  onAddNote 
}) => {
  const [newNote, setNewNote] = useState('');
  const [userName, setUserName] = useState('Mo'); // Default auf aktuellen Benutzer
  
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    if (onAddNote) {
      onAddNote({
        text: newNote,
        userName,
        tradeId
      });
    }
    
    setNewNote('');
  };
  
  // Alle Notizen kombinieren und nach Datum sortieren
  const allNotes = [...jasperNotes, ...moNotes].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <Card className="bg-black/40 border-primary/20 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <MessageSquare className="w-4 h-4 mr-2 text-primary/80" />
          Trade-Notizen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allNotes.length > 0 ? (
          <div className="space-y-3">
            {allNotes.map((note) => (
              <div 
                key={note.id} 
                className={`p-3 rounded-md ${
                  note.userName === 'Jasper' 
                    ? 'bg-blue-950/20 border border-blue-800/20' 
                    : 'bg-teal-950/20 border border-teal-800/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-medium ${
                    note.userName === 'Jasper' ? 'text-blue-400' : 'text-teal-400'
                  }`}>
                    {note.userName}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(note.createdAt).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{note.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-gray-500">Keine Notizen vorhanden</p>
          </div>
        )}
        
        <div className="mt-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-black/30 border-primary/30 text-primary/70 hover:bg-black/20"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Notiz hinzufügen</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-primary flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 opacity-70" />
                  Neue Trade-Notiz
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">Als:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setUserName('Jasper')}
                      className={`px-2 py-1 text-xs rounded ${
                        userName === 'Jasper' 
                          ? 'bg-blue-900/50 text-blue-300' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/50'
                      }`}
                    >
                      Jasper
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserName('Mo')}
                      className={`px-2 py-1 text-xs rounded ${
                        userName === 'Mo' 
                          ? 'bg-teal-900/50 text-teal-300' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/50'
                      }`}
                    >
                      Mo
                    </button>
                  </div>
                </div>
                
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Schreibe hier deine Notiz..."
                  className="min-h-[120px] bg-black/50 border-gray-700 text-sm"
                />
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-gray-900 border-gray-700 hover:bg-gray-800"
                  >
                    Abbrechen
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    size="sm" 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className={`${
                      userName === 'Jasper' 
                        ? 'bg-blue-900 hover:bg-blue-800' 
                        : 'bg-teal-900 hover:bg-teal-800'
                    }`}
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Speichern
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeNotes;