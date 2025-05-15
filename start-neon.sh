#!/bin/bash

# Dieses Skript startet die Anwendung mit Neon PostgreSQL Datenbankverbindung

# Prüfe, ob die Datei .env.neon existiert
if [ ! -f .env.neon ]; then
  echo "Fehler: Die Datei .env.neon wurde nicht gefunden."
  echo "Bitte erstelle die Datei basierend auf .env.neon.sample mit deinen Neon-Datenbank Zugangsdaten."
  exit 1
fi

# Lade Umgebungsvariablen aus .env.neon
set -a
source .env.neon
set +a

# Starte die Anwendung
echo "Starte Trading Journal mit Neon PostgreSQL Datenbankverbindung..."
node server.js
