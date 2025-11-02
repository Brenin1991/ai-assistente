const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Rota para reconhecimento de voz simples
router.post('/start-recording', async (req, res) => {
  try {
    const { duration = 5 } = req.body;
    
    console.log('🎤 Iniciando reconhecimento de voz...');
    
    // Usar comando simples do Windows
    const command = `powershell -Command "& {Add-Type -AssemblyName System.Speech; $r = New-Object System.Speech.Recognition.SpeechRecognitionEngine; $r.SetInputToDefaultAudioDevice(); $r.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar)); $result = $null; $r.Add_SpeechRecognized({param($e) $script:result = $e.Result.Text}); $r.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Single); Start-Sleep -Seconds ${duration}; $r.RecognizeAsyncStop(); if($result) { Write-Output $result } else { Write-Output 'NENHUM_TEXTO' }}"`;
    
    console.log('Comando:', command);
    
    const process = spawn('cmd', ['/c', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Output:', data.toString());
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Error:', data.toString());
    });
    
    process.on('close', (code) => {
      console.log('Processo finalizado com código:', code);
      console.log('Output final:', output);
      console.log('Error final:', errorOutput);
      
      let recognizedText = '';
      
      if (output.includes('NENHUM_TEXTO')) {
        recognizedText = '';
      } else if (output.trim()) {
        recognizedText = output.trim();
      }
      
      res.json({
        success: true,
        text: recognizedText,
        duration: duration,
        rawOutput: output,
        errorOutput: errorOutput
      });
    });
    
    process.on('error', (error) => {
      console.error('Erro no processo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao executar reconhecimento de voz',
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

// Rota para síntese de voz
router.post('/speak', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }
    
    const command = `powershell -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak('${text}')"`;
    
    const process = spawn('cmd', ['/c', command]);
    
    process.on('close', (code) => {
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

module.exports = router;
