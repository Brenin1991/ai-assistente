const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const open = require('open');
const axios = require('axios');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Importar rotas
const aiRoutes = require('./routes/ai');
const systemRoutes = require('./routes/system');
const musicRoutes = require('./routes/music');
const voiceRoutes = require('./routes/voice-python');
const commandRoutes = require('./routes/commands');

// Usar rotas
app.use('/api/ai', aiRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/commands', commandRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Assistente IA funcionando!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}/api`);
});

module.exports = app;
