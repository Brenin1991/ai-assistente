const express = require('express');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Variáveis para controle de música
let currentMusicProcess = null;
let isPlaying = false;
let currentTrack = null;

// Rota para tocar música
router.post('/play', async (req, res) => {
  try {
    const { filePath, url, search } = req.body;
    
    // Parar música atual se estiver tocando
    if (isPlaying && currentMusicProcess) {
      currentMusicProcess.kill();
    }

    let command;
    const platform = process.platform;

    if (filePath) {
      // Tocar arquivo local
      if (platform === 'win32') {
        command = `start "" "${filePath}"`;
      } else if (platform === 'darwin') {
        command = `afplay "${filePath}"`;
      } else {
        command = `mpv "${filePath}"`;
      }
    } else if (url) {
      // Tocar URL/stream
      if (platform === 'win32') {
        command = `start "" "${url}"`;
      } else if (platform === 'darwin') {
        command = `afplay "${url}"`;
      } else {
        command = `mpv "${url}"`;
      }
    } else if (search) {
      // Pesquisar e tocar música (implementação básica)
      // Aqui você pode integrar com APIs como Spotify, YouTube, etc.
      return res.status(400).json({ 
        error: 'Funcionalidade de pesquisa de música não implementada ainda',
        suggestion: 'Use filePath ou url para tocar música'
      });
    } else {
      return res.status(400).json({ error: 'filePath, url ou search é obrigatório' });
    }

    // Executar comando de música
    currentMusicProcess = spawn(command, [], { 
      shell: true,
      detached: true,
      stdio: 'ignore'
    });

    currentMusicProcess.on('error', (error) => {
      console.error('Erro ao tocar música:', error);
      isPlaying = false;
      currentTrack = null;
    });

    currentMusicProcess.on('exit', (code) => {
      isPlaying = false;
      currentTrack = null;
      console.log(`Processo de música finalizado com código: ${code}`);
    });

    isPlaying = true;
    currentTrack = filePath || url;

    res.json({
      success: true,
      message: 'Música iniciada com sucesso',
      track: currentTrack,
      isPlaying: isPlaying
    });

  } catch (error) {
    console.error('Erro ao tocar música:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao tocar música',
      details: error.message
    });
  }
});

// Rota para pausar música
router.post('/pause', async (req, res) => {
  try {
    if (!isPlaying || !currentMusicProcess) {
      return res.status(400).json({ error: 'Nenhuma música tocando' });
    }

    // Enviar sinal de pausa (Ctrl+Z)
    if (process.platform === 'win32') {
      currentMusicProcess.kill('SIGSTOP');
    } else {
      currentMusicProcess.kill('SIGSTOP');
    }

    res.json({
      success: true,
      message: 'Música pausada',
      isPlaying: false
    });

  } catch (error) {
    console.error('Erro ao pausar música:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao pausar música',
      details: error.message
    });
  }
});

// Rota para retomar música
router.post('/resume', async (req, res) => {
  try {
    if (!currentMusicProcess) {
      return res.status(400).json({ error: 'Nenhuma música carregada' });
    }

    // Enviar sinal de continuação
    if (process.platform === 'win32') {
      currentMusicProcess.kill('SIGCONT');
    } else {
      currentMusicProcess.kill('SIGCONT');
    }

    isPlaying = true;

    res.json({
      success: true,
      message: 'Música retomada',
      isPlaying: isPlaying
    });

  } catch (error) {
    console.error('Erro ao retomar música:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao retomar música',
      details: error.message
    });
  }
});

// Rota para parar música
router.post('/stop', async (req, res) => {
  try {
    if (!currentMusicProcess) {
      return res.status(400).json({ error: 'Nenhuma música tocando' });
    }

    currentMusicProcess.kill();
    isPlaying = false;
    currentTrack = null;

    res.json({
      success: true,
      message: 'Música parada',
      isPlaying: false
    });

  } catch (error) {
    console.error('Erro ao parar música:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao parar música',
      details: error.message
    });
  }
});

// Rota para obter status da música
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isPlaying: isPlaying,
        currentTrack: currentTrack,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao obter status da música:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status da música',
      details: error.message
    });
  }
});

// Rota para listar arquivos de música em um diretório
router.post('/list', async (req, res) => {
  try {
    const { directory } = req.body;
    
    if (!directory) {
      return res.status(400).json({ error: 'Diretório é obrigatório' });
    }

    const musicExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.wma'];
    
    fs.readdir(directory, (error, files) => {
      if (error) {
        console.error('Erro ao ler diretório:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao ler diretório',
          details: error.message
        });
      }

      const musicFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return musicExtensions.includes(ext);
      }).map(file => ({
        name: file,
        path: path.join(directory, file),
        extension: path.extname(file).toLowerCase()
      }));

      res.json({
        success: true,
        data: {
          directory: directory,
          files: musicFiles,
          count: musicFiles.length
        }
      });
    });

  } catch (error) {
    console.error('Erro ao listar arquivos de música:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar arquivos de música',
      details: error.message
    });
  }
});

module.exports = router;
