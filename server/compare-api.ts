import { Request, Response, Router } from 'express';
import { storage } from './storage';

// Router für die Vergleichsfunktionalität
const compareRouter = Router();

// Helper Funktion für Fehlermeldungen
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

// Route zum Abrufen der Trades eines bestimmten Benutzers
compareRouter.get('/users/:userId/trades', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ message: "Gültige Benutzer-ID erforderlich" });
    }
    
    // Extract filter parameters
    const filters: Record<string, any> = {};
    const filterParams = ['symbol', 'setup', 'mainTrendM15', 'internalTrendM5', 'entryType', 'session', 'accountType'];
    
    for (const param of filterParams) {
      if (req.query[param]) {
        filters[param] = req.query[param];
      }
    }
    
    console.log(`Abrufen von Trades für Benutzer ${userId} mit Filtern:`, filters);
    const trades = await storage.getTrades(userId, filters);
    console.log(`${trades.length} Trades für Benutzer ${userId} gefunden`);
    
    res.status(200).json(trades);
  } catch (error) {
    console.error(`Fehler beim Abrufen der Trades für Benutzer:`, error);
    res.status(500).json({ message: errorMessage(error) });
  }
});

export default compareRouter;