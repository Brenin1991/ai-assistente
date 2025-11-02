const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Rota para iniciar gravação de áudio
router.post('/start-recording', async (req, res) => {
  try {
    const { duration = 5 } = req.body; // Duração em segundos
    
    // Usar PowerShell para gravar áudio - versão simplificada
    const script = `
      try {
        Add-Type -AssemblyName System.Speech
        $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
        $recognizer.SetInputToDefaultAudioDevice()
        
        # Configurar idioma português
        $recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
        
        $result = $null
        
        # Evento de reconhecimento
        $recognizer.Add_SpeechRecognized({
            param($e)
            $script:result = $e.Result.Text
            Write-Output "RECOGNIZED:$($e.Result.Text)"
        })
        
        # Iniciar reconhecimento
        $recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Single)
        
        # Aguardar
        Start-Sleep -Seconds ${duration}
        
        $recognizer.RecognizeAsyncStop()
        
        if ($result) {
          Write-Output "FINAL_RESULT:$result"
        } else {
          Write-Output "FINAL_RESULT:"
        }
      } catch {
        Write-Output "ERROR:$($_.Exception.Message)"
      }
    `;
    
    // Salvar script temporário
    const scriptPath = path.join(__dirname, '../temp_voice.ps1');
    fs.writeFileSync(scriptPath, script);
    
    // Executar PowerShell
    const psProcess = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let recognizedText = '';
    let output = '';
    
    psProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('PowerShell output:', data.toString());
    });
    
    psProcess.stderr.on('data', (data) => {
      console.error('PowerShell error:', data.toString());
    });
    
    psProcess.on('close', (code) => {
      console.log('PowerShell finalizado com código:', code);
      console.log('Output completo:', output);
      
      // Limpar arquivo temporário
      try {
        fs.unlinkSync(scriptPath);
      } catch (error) {
        console.log('Erro ao limpar arquivo temporário:', error.message);
      }
      
      // Processar resultado
      if (output.includes('FINAL_RESULT:')) {
        const result = output.split('FINAL_RESULT:')[1].trim();
        recognizedText = result;
      } else if (output.includes('ERROR:')) {
        const error = output.split('ERROR:')[1].trim();
        console.error('Erro no PowerShell:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro no reconhecimento de voz',
          details: error
        });
      }
      
      res.json({
        success: true,
        text: recognizedText,
        duration: duration,
        rawOutput: output
      });
    });
    
    psProcess.on('error', (error) => {
      console.error('Erro no PowerShell:', error);
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

// Rota para reconhecimento de voz usando Windows Speech API
router.post('/recognize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }
    
    // Usar Windows Speech API para síntese de voz
    const script = `
      Add-Type -AssemblyName System.Speech
      $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
      $synthesizer.Speak("${text}")
    `;
    
    const scriptPath = path.join(__dirname, '../temp_speech.ps1');
    fs.writeFileSync(scriptPath, script);
    
    const psProcess = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
    
    psProcess.on('close', (code) => {
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

// Rota para obter idiomas disponíveis
router.get('/languages', async (req, res) => {
  try {
    const script = `
      Add-Type -AssemblyName System.Speech
      $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
      $installedRecognizers = $recognizer.InstalledRecognizers()
      
      $languages = @()
      foreach ($recognizer in $installedRecognizers) {
          $languages += @{
              Culture = $recognizer.Culture.Name
              Name = $recognizer.Culture.DisplayName
          }
      }
      
      $languages | ConvertTo-Json
    `;
    
    const scriptPath = path.join(__dirname, '../temp_languages.ps1');
    fs.writeFileSync(scriptPath, script);
    
    const psProcess = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
    let output = '';
    
    psProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    psProcess.on('close', (code) => {
      try {
        fs.unlinkSync(scriptPath);
      } catch (error) {
        console.log('Erro ao limpar arquivo temporário:', error.message);
      }
      
      try {
        const languages = JSON.parse(output);
        res.json({
          success: true,
          languages: languages
        });
      } catch (error) {
        res.json({
          success: true,
          languages: [
            { Culture: 'pt-BR', Name: 'Português (Brasil)' },
            { Culture: 'en-US', Name: 'English (United States)' }
          ]
        });
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter idiomas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

module.exports = router;
