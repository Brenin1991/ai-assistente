@echo off
echo 🚀 Iniciando Assistente IA...

echo 📡 Iniciando backend...
start cmd /k "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo 🖥️ Iniciando Electron...
cd frontend
npm run electron

pause
