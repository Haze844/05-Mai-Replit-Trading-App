# Problembehebung für Replit-Deployment

## Bekannte Probleme

Der Versuch, die Anwendung auf Replit zu deployen, führt zu einem 503-Fehler mit der Meldung "failed to send deployment lifecycle client command".

## Ursachen

Mögliche Ursachen für dieses Problem:
1. **Temporäre Netzwerkprobleme** zwischen Ihrem Replit-Workspace und dem Replit-Deployment-Service
2. **Hohe Serverlast** auf den Replit-Deployment-Servern
3. **Inkompatibilität** zwischen der Projektstruktur und den Erwartungen des Deployment-Services
4. **Ressourcenlimitierungen** (z.B. zu große Projektdateien oder lange Build-Zeiten)

## Lösungsansätze

### Bereits versuchte Lösungen:
- Erstellung einer deploy.config.json-Datei mit Konfiguration für statisches Deployment
- Erstellung von statischen HTML-Dateien im dist-Verzeichnis für Weiterleitungen
- Bereinigung des Build-Prozesses durch deploy-fix.sh-Skript

### Weitere Optionen:
1. **Später erneut versuchen**: Replit-Dienste können manchmal temporär nicht verfügbar sein.
2. **Lokale Ausführung**: Verwenden Sie das start-neon.sh-Skript, um die Anwendung lokal zu starten.
3. **Replit-Support kontaktieren**: Bei anhaltenden Problemen.

## Lokale Entwicklung

Für die lokale Entwicklung erstellen Sie bitte die folgenden Dateien, falls noch nicht vorhanden:

### .env.neon (Beispiel)
```
DATABASE_URL=postgres://username:password@hostname:port/database
DATABASE_PROVIDER=neon
```

### Ausführung
```bash
chmod +x start-neon.sh
./start-neon.sh
```

Die Anwendung sollte dann auf http://localhost:3000 verfügbar sein.

## Authentifizierung

Zum Testen können Sie sich mit folgenden Zugangsdaten anmelden:
- Benutzer: admin / Passwort: admin123
- Benutzer: mo / Passwort: mo123

Alternativ können Sie die Authentifizierung umgehen, indem Sie `?userId=2` an die URL anhängen.