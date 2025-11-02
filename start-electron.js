const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Assistente IA...\n');

// Primeiro, iniciar o backend
console.log('📡 Iniciando backend...');
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Aguardar um pouco para o backend inicializar
setTimeout(() => {
  console.log('🖥️ Iniciando Electron...');
  
  // Depois, iniciar o Electron
  const electron = spawn('npm', ['run', 'electron'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  electron.on('close', (code) => {
    console.log(`Electron finalizado com código ${code}`);
    backend.kill();
  });

  backend.on('close', (code) => {
    console.log(`Backend finalizado com código ${code}`);
  });

}, 3000);

// Capturar Ctrl+C para finalizar ambos os processos
process.on('SIGINT', () => {
  console.log('\n🛑 Finalizando aplicação...');
  backend.kill();
  process.exit(0);
});
