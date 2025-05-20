#!/bin/bash

# Diese Datei hilft beim Starten der Anwendung mit Neon PostgreSQL
echo "🚀 Starte Trading Journal mit Neon PostgreSQL..."

# Umgebungsvariablen aus .env.neon laden
if [ -f .env.neon ]; then
  echo "📋 Lade Umgebungsvariablen aus .env.neon..."
  export $(cat .env.neon | xargs)
else
  echo "⚠️ .env.neon nicht gefunden. Bitte stelle sicher, dass die Datei existiert."
  exit 1
fi

# Datenbank-Anbieter auf neon setzen
export DATABASE_PROVIDER=neon

# Anwendung starten
echo "🌐 Starte Server..."
npm run dev