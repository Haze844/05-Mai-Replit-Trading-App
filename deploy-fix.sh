#!/bin/bash

# Deployment-Fix-Skript für Replit
echo "🚀 Starte Deployment-Fix für Replit..."

# Dist-Verzeichnis erstellen (falls nicht vorhanden)
if [ ! -d "dist" ]; then
  echo "📁 Erstelle dist-Verzeichnis..."
  mkdir -p dist
fi

# Einfache statische HTML-Datei zur Weiterleitung zum Server
echo "📄 Erstelle Weiterleitung im dist-Verzeichnis..."
cat > dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trading Journal</title>
  <meta http-equiv="refresh" content="0;url=/" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #111;
      color: #fff;
      display: flex;
      height: 100vh;
      margin: 0;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .loader {
      width: 48px;
      height: 48px;
      border: 5px solid #FFF;
      border-bottom-color: #3b82f6;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    } 
  </style>
</head>
<body>
  <div>
    <span class="loader"></span>
    <p>Lade Trading Journal...</p>
  </div>
</body>
</html>
EOL

# 404.html Seite erstellen für besseres Routing
echo "📄 Erstelle 404.html für besseres Routing..."
cat > dist/404.html << 'EOL'
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trading Journal - Weiterleitung</title>
  <meta http-equiv="refresh" content="0;url=/" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #111;
      color: #fff;
      display: flex;
      height: 100vh;
      margin: 0;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .loader {
      width: 48px;
      height: 48px;
      border: 5px solid #FFF;
      border-bottom-color: #3b82f6;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    } 
  </style>
</head>
<body>
  <div>
    <span class="loader"></span>
    <p>Lade Trading Journal...</p>
  </div>
</body>
</html>
EOL

# Replit Deploy-Konfiguration erstellen
echo "⚙️ Erstelle Replit-Deploy-Konfiguration..."
cat > deploy.config.json << 'EOL'
{
  "deploymentTarget": "static",
  "publicDir": "dist",
  "buildCommand": "npm run build"
}
EOL

echo "✅ Deployment-Fix fertig!"
echo "🔄 Sie können jetzt das Deployment über den Deploy-Button starten."
echo "💡 Wenn der Fehler weiterhin besteht, versuchen Sie es später noch einmal oder wenden Sie sich an den Replit-Support."