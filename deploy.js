/**
 * Deployment Helper-Skript
 * 
 * Dieses Skript hilft beim Deployment der Anwendung auf Replit
 * Es sollte mit `node deploy.js` ausgeführt werden
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting deployment preparation...');

// Überprüfen, ob das Dist-Verzeichnis existiert
if (!fs.existsSync('dist')) {
  console.log('📁 Creating dist directory...');
  fs.mkdirSync('dist', { recursive: true });
}

// Kopiere wichtige Dateien für das Deployment
console.log('📋 Copying important deployment files...');

// Einfache statische HTML-Datei zur Weiterleitung zum Server
const redirectHtml = `
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
`;

// Erstelle eine einfache HTML-Datei für das Static Hosting
fs.writeFileSync(path.join('dist', 'index.html'), redirectHtml);

console.log('🏁 Deployment preparation complete!');
console.log('\nNow you can deploy your application by clicking the "Deploy" button in Replit.');

// Information zur Problemlösung
console.log('\n🔧 If deployment fails with a 503 error, please try these solutions:');
console.log('  1. Refresh the page and try deploying again');
console.log('  2. Make sure your application isn\'t using too many resources');
console.log('  3. Check if there are any Replit service issues');