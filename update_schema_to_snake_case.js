import fs from 'fs';
import { db } from './server/db.js';
import { Pool } from 'pg';

// Lese die SQL-Datei ein
const sqlScript = fs.readFileSync('./reset_database_to_snake_case.sql', 'utf8');

// Verbinde direkt mit der Datenbank, um das Schema-Reset auszuführen
async function resetSchema() {
  console.log("Verbindung zur Datenbank herstellen...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log("Schema zurücksetzen...");
    // Führe das SQL-Skript aus
    await pool.query(sqlScript);
    console.log("Schema erfolgreich zurückgesetzt und auf snake_case vereinheitlicht!");
    console.log("Zwei Standardbenutzer wurden erstellt: admin/admin123 und mo/mo123");
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Schemas:", error);
  } finally {
    await pool.end();
  }
}

// Führe das Schema-Reset aus
resetSchema().then(() => {
  console.log("Prozess abgeschlossen.");
}).catch(err => {
  console.error("Unerwarteter Fehler:", err);
});