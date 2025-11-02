const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Rota para reconhecimento de voz usando Python
router.post('/start-recording', async (req, res) => {
  try {
    const { duration = 5 } = req.body;
    
    console.log('🐍 Iniciando reconhecimento de voz com Python...');
    
    // Caminho para o script Python
    const pythonScript = path.join(__dirname, '../voice_recognition.py');
    
    // Executar script Python
    const pythonProcess = spawn('python', [pythonScript, duration.toString()], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('Python stderr:', data.toString());
    });
    
    pythonProcess.on('close', (code) => {
      console.log('Python finalizado com código:', code);
      console.log('Output final:', output);
      
      try {
        // Tentar parsear JSON do output
        const result = JSON.parse(output);
        res.json(result);
      } catch (error) {
        console.error('Erro ao parsear JSON:', error);
        res.json({
          success: false,
          error: 'Erro ao processar resultado do Python',
          details: error.message,
          rawOutput: output,
          errorOutput: errorOutput
        });
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Erro no Python:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao executar Python',
        details: error.message
      });
    });
    
  } catch (error) {
    console.error('Erro ao iniciar gravação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Rota para síntese de voz usando Python
router.post('/speak', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }
    
    console.log('🔊 Convertendo texto para voz:', text);
    
    // Usar pyttsx3 para síntese de voz
    const pythonScript = `
import pyttsx3
import sys

try:
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)  # Velocidade da fala
    engine.setProperty('volume', 0.8)  # Volume
    
    # Configurar voz em português se disponível
    voices = engine.getProperty('voices')
    for voice in voices:
        if 'portuguese' in voice.name.lower() or 'pt' in voice.id.lower():
            engine.setProperty('voice', voice.id)
            break
    
    engine.say("${text}")
    engine.runAndWait()
    print('{"success": true, "message": "Texto convertido para voz com sucesso"}')
except Exception as e:
    print(f'{{"success": false, "error": "{str(e)}"}}')
`;
    
    // Salvar script temporário
    const fs = require('fs');
    const scriptPath = path.join(__dirname, '../temp_speech.py');
    fs.writeFileSync(scriptPath, pythonScript);
    
    const pythonProcess = spawn('python', [scriptPath]);
    
    pythonProcess.on('close', (code) => {
      // Limpar arquivo temporário
      try {
        fs.unlinkSync(scriptPath);
      } catch (error) {
        console.log('Erro ao limpar arquivo temporário:', error.message);
      }
      
      res.json({
        success: true,
        message: 'Texto convertido para voz com sucesso'
      });
    });
    
  } catch (error) {
    console.error('Erro na síntese de voz:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Rota para verificar se Python está funcionando
router.get('/test', async (req, res) => {
  try {
    const pythonProcess = spawn('python', ['--version']);
    
    pythonProcess.stdout.on('data', (data) => {
      res.json({
        success: true,
        message: 'Python está funcionando',
        version: data.toString().trim()
      });
    });
    
    pythonProcess.on('error', (error) => {
      res.status(500).json({
        success: false,
        error: 'Python não está instalado ou não está no PATH',
        details: error.message
      });
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao testar Python',
      details: error.message
    });
  }
});

module.exports = router;
