# Anleitung: Trading Journal mit Neon PostgreSQL verbinden

Diese Anleitung zeigt dir, wie du dein Trading Journal mit einer Neon PostgreSQL-Datenbank verbinden kannst.

## Vorteile der Neon-Datenbank

- **Serverless PostgreSQL**: Keine Verwaltung von Datenbankservern nötig
- **Automatische Skalierung**: Die Datenbank passt sich an die Nutzung an
- **Kosteneffizient**: Im Free-Tier ausreichend für persönliche Projekte
- **Permanente Datenspeicherung**: Deine Daten bleiben sicher gespeichert
- **Hohe Zuverlässigkeit**: Professioneller Datenbankdienst mit guter Verfügbarkeit

## Schritt 1: Neon-Datenbank einrichten

1. Gehe zu [Neon PostgreSQL](https://neon.tech) und erstelle einen Account (falls noch nicht vorhanden)
2. Erstelle ein neues Projekt (z.B. "Trading Journal")
3. Wähle den kostenlosen Plan aus
4. Wenn das Projekt erstellt ist, gehe zu den Verbindungsdetails:
   - Klicke auf "Connection Details"
   - Wähle "Connection string" und kopiere die Verbindungs-URL
   - Ersetze `[YOUR-PASSWORD]` in der URL mit dem Passwort, das du bei der Erstellung festgelegt hast

## Schritt 2: Replit mit Neon verbinden

1. Erstelle eine neue Datei `.env.neon` in deinem Replit-Projekt (basierend auf `.env.neon.sample`):
   ```
   NODE_ENV=development
   DATABASE_PROVIDER=neon
   DATABASE_URL=deine-neon-verbindungs-url-hier
   ```

2. Ersetze `deine-neon-verbindungs-url-hier` mit der kopierten Verbindungs-URL von Neon.

## Schritt 3: Datenbank-Tabellen einrichten

Wenn du das Projekt zum ersten Mal mit der Neon-Datenbank startest, werden die Tabellen automatisch erstellt und die Standard-Benutzer angelegt.

## Schritt 4: Trading Journal mit Neon starten

Verwende das Start-Skript, um das Trading Journal mit der Neon-Datenbank zu starten:

```bash
./start-neon.sh
```

## Fehlerbehebung

- **Verbindungsfehler**: Stelle sicher, dass du `[YOUR-PASSWORD]` in der Verbindungs-URL durch dein echtes Passwort ersetzt hast.
- **Tabellenfehler**: Falls die Tabellen nicht automatisch erstellt werden, kannst du das Setup-Skript manuell ausführen:
  ```bash
  NODE_ENV=development DATABASE_PROVIDER=neon node setup-db.js
  ```

## Bekannte Einschränkungen

- Die Neon-Verbindung wird in der Replit-Umgebung funktionieren, aber nicht im Render-Deployment. Für Render solltest du weiterhin die Render-interne Datenbank verwenden.