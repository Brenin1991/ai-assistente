const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Função para executar comandos Python
const runPythonScript = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath, ...args], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: output.trim() });
      } else {
        reject({ success: false, error: error.trim() || 'Erro desconhecido' });
      }
    });

    pythonProcess.on('error', (err) => {
      reject({ success: false, error: err.message });
    });
  });
};


// Comando para abrir aplicativo
router.post('/open-app', async (req, res) => {
  try {
    const { appName, appPath } = req.body;
    
    if (!appName && !appPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome do app ou caminho é obrigatório' 
      });
    }

    console.log('Backend: Abrindo aplicativo:', { appName, appPath });
    const scriptPath = 'scripts/open_app.py';
    const scriptArgs = [appName || appPath];
    console.log('Backend: Executando script Python:', { scriptPath, scriptArgs });
    
    const result = await runPythonScript(scriptPath, scriptArgs);
    console.log('Backend: Resultado do script:', result);
    
    res.json({
      success: true,
      message: `Aplicativo ${appName || appPath} aberto`,
      output: result.output
    });
  } catch (error) {
    console.error('Backend: Erro ao abrir aplicativo:', error);
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao abrir aplicativo'
    });
  }
});

// Comando para controlar volume
router.post('/volume-control', async (req, res) => {
  try {
    const { action, value } = req.body; // action: 'set', 'up', 'down', 'mute', 'unmute'
    
    if (!action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ação de volume é obrigatória' 
      });
    }

    const args = [action];
    if (value !== undefined) args.push(value.toString());

    const result = await runPythonScript('scripts/volume_control.py', args);
    
    res.json({
      success: true,
      message: `Volume ${action} executado`,
      output: result.output
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao controlar volume'
    });
  }
});

// Comando para capturar tela
router.post('/screenshot', async (req, res) => {
  try {
    const { filename, exclude_assistant = true } = req.body;
    
    const args = [];
    if (filename) args.push(filename);
    if (exclude_assistant) args.push('--exclude-assistant');
    
    const result = await runPythonScript('scripts/screenshot.py', args);
    
    res.json({
      success: true,
      message: 'Screenshot capturado',
      output: result.output
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao capturar screenshot'
    });
  }
});

// Screenshot avançado com opções
router.post('/screenshot-advanced', async (req, res) => {
  try {
    const { type, window_title, filename, exclude_assistant } = req.body;
    
    console.log('Screenshot avançado - Parâmetros recebidos:', {
      type, window_title, filename, exclude_assistant
    });
    
    const scriptPath = path.join(__dirname, '..', 'scripts', 'screenshot_advanced.py');
    const args = ['screenshot', type || 'full'];
    
    if (window_title) args.push(window_title);
    if (filename) args.push(filename);
    if (exclude_assistant !== undefined) args.push(exclude_assistant.toString());
    
    console.log('Executando script com args:', args);
    
    const result = await runPythonScript(scriptPath, args);
    
    console.log('Resultado do script:', result);
    console.log('Output do script:', result.output);
    
    // Verificar se o output é JSON válido
    let jsonResult;
    try {
      jsonResult = JSON.parse(result.output);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.error('Output que causou erro:', result.output);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar resposta do script de screenshot',
        details: result.output
      });
    }
    
    res.json(jsonResult);
  } catch (error) {
    console.error('Erro no screenshot avançado:', error);
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao capturar screenshot avançado'
    });
  }
});

// Analisar tela (screenshot + análise)
router.post('/analyze-screen', async (req, res) => {
  try {
    const { prompt = "Descreva o que você vê nesta tela" } = req.body;
    
    console.log('Analisando tela - Parâmetros recebidos:', { prompt });
    
    // 1. Primeiro, tirar screenshot
    const screenshotScriptPath = path.join(__dirname, '..', 'scripts', 'screenshot_advanced.py');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screen_analysis_${timestamp}.png`;
    const screenshotArgs = ['screenshot', 'full', null, filename, 'true', 'false']; // exclude_assistant = true, open_image = false
    
    console.log('Tirando screenshot...');
    const screenshotResult = await runPythonScript(screenshotScriptPath, screenshotArgs);
    const screenshotData = JSON.parse(screenshotResult.output);
    
    if (!screenshotData.success) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao capturar screenshot: ' + screenshotData.error
      });
    }
    
    console.log('Screenshot capturado:', screenshotData.filepath);
    
    // 2. Analisar a imagem capturada
    const analyzeResult = await fetch('http://localhost:3001/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagePath: screenshotData.filepath,
        prompt: prompt
      })
    });
    
    const analyzeData = await analyzeResult.json();
    
    if (!analyzeData.success) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao analisar imagem: ' + analyzeData.error
      });
    }
    
    console.log('Análise concluída');
    
    res.json({
      success: true,
      message: 'Tela analisada com sucesso',
      screenshotPath: screenshotData.filepath,
      analysis: analyzeData.response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao analisar tela:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao analisar tela'
    });
  }
});

// Listar janelas disponíveis para screenshot
router.post('/list-windows-screenshot', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'screenshot_advanced.py');
    const result = await runPythonScript(scriptPath, ['list_windows']);
    
    res.json(JSON.parse(result.output));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao listar janelas'
    });
  }
});

// Focar em janela específica
router.post('/focus-window', async (req, res) => {
  try {
    const { window_title } = req.body;
    
    if (!window_title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Título da janela é obrigatório' 
      });
    }
    
    const scriptPath = path.join(__dirname, '..', 'scripts', 'focus_window.py');
    const result = await runPythonScript(scriptPath, ['focus', window_title]);
    
    res.json(JSON.parse(result.output));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao focar na janela'
    });
  }
});

// Listar janelas disponíveis para foco
router.post('/list-windows-focus', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'focus_window.py');
    const result = await runPythonScript(scriptPath, ['list_windows']);
    
    res.json(JSON.parse(result.output));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao listar janelas'
    });
  }
});

// Comando para listar janelas abertas
router.post('/list-windows', async (req, res) => {
  try {
    const result = await runPythonScript('scripts/list_windows.py');
    
    res.json({
      success: true,
      message: 'Lista de janelas obtida',
      windows: JSON.parse(result.output)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao listar janelas'
    });
  }
});

// Comando para fechar janela
router.post('/close-window', async (req, res) => {
  try {
    const { windowTitle } = req.body;
    
    if (!windowTitle) {
      return res.status(400).json({ 
        success: false, 
        error: 'Título da janela é obrigatório' 
      });
    }

    const result = await runPythonScript('scripts/close_window.py', [windowTitle]);
    
    res.json({
      success: true,
      message: `Janela "${windowTitle}" fechada`,
      output: result.output
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao fechar janela'
    });
  }
});

// Comando para executar comando do sistema
router.post('/run-command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comando é obrigatório' 
      });
    }

    const result = await runPythonScript('scripts/run_command.py', [command]);
    
    res.json({
      success: true,
      message: `Comando "${command}" executado`,
      output: result.output
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.error || 'Erro ao executar comando'
    });
  }
});

// Rota para abrir sites
router.post('/open-website', async (req, res) => {
  try {
    const { url, siteName } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL é obrigatória'
      });
    }

    console.log('Abrindo site:', url);
    
    // Usar o comando start do Windows para abrir o site
    const { spawn } = require('child_process');
    
    console.log('Executando comando para abrir site:', url);
    
    const process = spawn('cmd', ['/c', 'start', '', url], {
      shell: true,
      detached: true,
      stdio: 'ignore'
    });
    
    process.on('error', (error) => {
      console.error('Erro ao executar comando:', error);
    });
    
    process.on('close', (code) => {
      console.log('Comando executado com código:', code);
    });
    
    process.unref();
    
    res.json({
      success: true,
      message: `Site ${siteName || 'aberto'} com sucesso`,
      url: url
    });
    
  } catch (error) {
    console.error('Erro ao abrir site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao abrir site'
    });
  }
});

module.exports = router;
