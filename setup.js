const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando Assistente IA...\n');

// Criar arquivo .env no backend
const envContent = `GROQ_API_KEY=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
PORT=3001
NODE_ENV=development`;

try {
  fs.writeFileSync(path.join(__dirname, 'backend', '.env'), envContent);
  console.log('✅ Arquivo .env criado no backend');
} catch (error) {
  console.log('⚠️  Erro ao criar .env:', error.message);
}

// Instalar dependências do backend
console.log('\n📦 Instalando dependências do backend...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
  console.log('✅ Dependências do backend instaladas');
} catch (error) {
  console.log('❌ Erro ao instalar dependências do backend:', error.message);
}

// Instalar dependências do frontend
console.log('\n📦 Instalando dependências do frontend...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  console.log('✅ Dependências do frontend instaladas');
} catch (error) {
  console.log('❌ Erro ao instalar dependências do frontend:', error.message);
}

console.log('\n🎉 Configuração concluída!');
console.log('\n📋 Próximos passos:');
console.log('1. Execute: npm run dev');
console.log('2. O assistente será aberto automaticamente');
console.log('3. Configure sua voz nas configurações');
console.log('4. Comece a usar comandos de voz!');
console.log('\n💡 Comandos de exemplo:');
console.log('- "Abra o navegador"');
console.log('- "Toque uma música"');
console.log('- "Pesquise sobre IA"');
console.log('- "Aumente o volume"');
