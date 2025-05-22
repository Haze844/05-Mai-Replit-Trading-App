const fs = require('fs');
const { Pool } = require('pg');

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

// Prüfe, ob die Umgebungsvariable gesetzt ist
if (!process.env.DATABASE_URL) {
  console.error("Die Umgebungsvariable DATABASE_URL ist nicht gesetzt!");
  process.exit(1);
} else {
  console.log("DATABASE_URL ist gesetzt, führe Schema-Reset aus...");
}

// Führe das Schema-Reset aus
resetSchema().then(() => {
  console.log("Prozess abgeschlossen.");
}).catch(err => {
  console.error("Unerwarteter Fehler:", err);
});