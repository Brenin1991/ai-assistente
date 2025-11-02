const express = require('express');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const open = require('open');
const router = express.Router();

// Rota para abrir aplicativos
router.post('/open-app', async (req, res) => {
  try {
    const { appName, path: appPath } = req.body;
    
    if (!appName && !appPath) {
      return res.status(400).json({ error: 'Nome do app ou caminho é obrigatório' });
    }

    let command;
    const platform = process.platform;

    if (appPath) {
      // Abrir por caminho específico
      if (platform === 'win32') {
        command = `start "" "${appPath}"`;
      } else if (platform === 'darwin') {
        command = `open "${appPath}"`;
      } else {
        command = `xdg-open "${appPath}"`;
      }
    } else {
      // Abrir por nome do aplicativo
      const appCommands = {
        'notepad': platform === 'win32' ? 'notepad' : 'gedit',
        'calculator': platform === 'win32' ? 'calc' : 'gnome-calculator',
        'browser': platform === 'win32' ? 'start chrome' : 'google-chrome',
        'explorer': platform === 'win32' ? 'explorer' : 'nautilus',
        'terminal': platform === 'win32' ? 'cmd' : 'gnome-terminal',
        'vscode': 'code',
        'spotify': 'spotify',
        'discord': 'discord',
        'steam': 'steam'
      };

      command = appCommands[appName.toLowerCase()] || appName;
    }

    console.log('Executando comando:', command);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Erro ao abrir aplicativo:', error);
        console.error('Comando que falhou:', command);
        return res.status(500).json({
          success: false,
          error: 'Erro ao abrir aplicativo',
          details: error.message,
          command: command
        });
      }

      console.log('Aplicativo aberto com sucesso:', stdout);
      res.json({
        success: true,
        message: `Aplicativo ${appName || 'especificado'} aberto com sucesso`,
        command: command
      });
    });

  } catch (error) {
    console.error('Erro ao abrir aplicativo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Rota para controlar volume do sistema
router.post('/volume', async (req, res) => {
  try {
    const { action, level } = req.body; // action: 'set', 'mute', 'unmute', 'up', 'down'
    
    let command;
    const platform = process.platform;

    switch (action) {
      case 'set':
        if (platform === 'win32') {
          command = `powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"`;
        } else {
          command = `amixer set Master ${level}%`;
        }
        break;
      case 'mute':
        if (platform === 'win32') {
          command = `powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"`;
        } else {
          command = 'amixer set Master mute';
        }
        break;
      case 'unmute':
        if (platform === 'win32') {
          command = `powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]174)"`;
        } else {
          command = 'amixer set Master unmute';
        }
        break;
      case 'up':
        if (platform === 'win32') {
          command = `powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]175)"`;
        } else {
          command = 'amixer set Master 5%+';
        }
        break;
      case 'down':
        if (platform === 'win32') {
          command = `powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]174)"`;
        } else {
          command = 'amixer set Master 5%-';
        }
        break;
      default:
        return res.status(400).json({ error: 'Ação de volume inválida' });
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Erro ao controlar volume:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao controlar volume',
          details: error.message
        });
      }

      res.json({
        success: true,
        message: `Volume ${action} executado com sucesso`,
        action: action
      });
    });

  } catch (error) {
    console.error('Erro ao controlar volume:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Rota para obter informações do sistema
router.get('/info', async (req, res) => {
  try {
    const os = require('os');
    
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      uptime: os.uptime(),
      hostname: os.hostname(),
      userInfo: os.userInfo()
    };

    res.json({
      success: true,
      data: systemInfo
    });

  } catch (error) {
    console.error('Erro ao obter informações do sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter informações do sistema',
      details: error.message
    });
  }
});

// Rota para executar comandos do sistema (com cuidado)
router.post('/execute', async (req, res) => {
  try {
    const { command, safe = true } = req.body;
    
    if (!command || command.trim() === '') {
      return res.status(400).json({ error: 'Comando é obrigatório' });
    }

    // Lista de comandos seguros permitidos
    const safeCommands = [
      'dir', 'ls', 'pwd', 'whoami', 'date', 'time',
      'echo', 'ping', 'ipconfig', 'ifconfig'
    ];

    if (safe && !safeCommands.some(safeCmd => command.toLowerCase().includes(safeCmd))) {
      return res.status(403).json({ 
        error: 'Comando não permitido por segurança',
        allowedCommands: safeCommands
      });
    }

    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Erro ao executar comando:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao executar comando',
          details: error.message,
          stderr: stderr
        });
      }

      res.json({
        success: true,
        output: stdout,
        command: command
      });
    });

  } catch (error) {
    console.error('Erro ao executar comando:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

module.exports = router;
