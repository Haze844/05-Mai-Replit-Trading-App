/**
 * Datenbank-Migrations-Skript: Spaltennamen ändern von snake_case zu camelCase
 * 
 * Dieses Skript führt SQL-Befehle aus, um die Spalten in der Datenbank 
 * von snake_case (z.B. profit_loss) zu camelCase (z.B. profitLoss) umzubenennen.
 * 
 * Verwendung: 
 * - Stelle sicher, dass DATABASE_URL in der Umgebung gesetzt ist
 * - Führe das Skript mit `node update_db_columns.js` aus
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verbindung zur Datenbank herstellen
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function renameColumns() {
  // SQL-Skript einlesen
  const sqlFile = path.join(__dirname, 'rename_columns.sql');
  const sqlCommands = fs.readFileSync(sqlFile, 'utf8');
  
  // SQL-Befehle in ein Array aufteilen (ein Befehl pro Zeile)
  const commands = sqlCommands
    .split(';')
    .filter(cmd => cmd.trim().length > 0 && !cmd.trim().startsWith('--'));
  
  const client = await pool.connect();
  
  try {
    // Transaktion starten
    await client.query('BEGIN');
    
    console.log(`Starte Migration: ${commands.length} SQL-Befehle werden ausgeführt...`);
    
    // Jeden SQL-Befehl ausführen
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command.length === 0 || command.startsWith('--') || command === 'COMMIT') {
        continue;
      }
      
      try {
        await client.query(command);
        console.log(`✓ SQL-Befehl ${i+1}/${commands.length} erfolgreich ausgeführt`);
      } catch (error) {
        console.error(`✗ Fehler beim Ausführen des SQL-Befehls ${i+1}:`, error.message);
        console.error(`SQL: ${command}`);
        // Bei einem Fehler die Transaktion abbrechen und beenden
        await client.query('ROLLBACK');
        throw error;
      }
    }
    
    // Transaktion abschließen
    await client.query('COMMIT');
    console.log('Migration erfolgreich abgeschlossen!');
    
  } catch (error) {
    console.error('Migration fehlgeschlagen:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('Starte Datenbank-Migration: Spaltennamen von snake_case zu camelCase...');
renameColumns().then(() => {
  console.log('Skript beendet.');
});