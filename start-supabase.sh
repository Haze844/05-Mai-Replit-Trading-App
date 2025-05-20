#!/bin/bash

# Diese Datei hilft beim Starten der Anwendung mit Supabase PostgreSQL
echo "🚀 Starte Trading Journal mit Supabase PostgreSQL..."

# Umgebungsvariablen aus .env.supabase laden, falls vorhanden
if [ -f .env.supabase ]; then
  echo "📋 Lade Umgebungsvariablen aus .env.supabase..."
  export $(cat .env.supabase | xargs)
else
  echo "⚠️ .env.supabase nicht gefunden. Erstelle eine Beispieldatei..."
  cat > .env.supabase << 'EOL'
# Ersetzen Sie die folgenden Werte mit Ihren eigenen Supabase-Anmeldeinformationen
DATABASE_URL=postgres://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
DATABASE_PROVIDER=supabase
EOL
  echo "📝 .env.supabase wurde erstellt. Bitte bearbeiten Sie die Datei mit Ihren Supabase-Anmeldeinformationen."
  exit 1
fi

# Datenbank-Anbieter auf supabase setzen
export DATABASE_PROVIDER=supabase

# Datenbank einrichten, falls nötig
if [ ! -f ".supabase_setup_done" ]; then
  echo "🔧 Richte Supabase-Datenbank ein..."
  node setup-supabase.js
  touch .supabase_setup_done
else
  echo "✅ Supabase-Datenbank bereits eingerichtet."
fi

# Anwendung starten
echo "🌐 Starte Server..."
npm run dev