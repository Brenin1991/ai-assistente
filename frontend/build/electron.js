const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Verifica se está em desenvolvimento
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Criar a janela do navegador
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 350,
    minHeight: 200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // icon: path.join(__dirname, 'icon.png'), // Ícone removido temporariamente
    frame: false, // Remove a toolbar do Windows
    titleBarStyle: 'hidden', // Esconde a barra de título
    show: false,
    transparent: false, // Janela sólida
    backgroundColor: '#1a1a2e', // Fundo sólido
    resizable: false,
    movable: true,
    minimizable: true,
    maximizable: false, // Não permitir maximizar (widget)
    closable: true,
    alwaysOnTop: true, // Sempre no topo
    skipTaskbar: false // Aparece na barra de tarefas
  });

  // Posicionar no canto direito da tela
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const windowWidth = 400;
  const windowHeight = 600;
  
  mainWindow.setBounds({
    x: screenWidth - windowWidth - 20, // 20px da borda direita
    y: 20, // 20px do topo
    width: windowWidth,
    height: windowHeight
  });

  // Sempre carregar o build de produção
  const indexPath = path.join(__dirname, '../build/index.html');
  mainWindow.loadFile(indexPath);

  // Mostrar a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Fechar quando todas as janelas estiverem fechadas
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevenir navegação para URLs externas
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== startUrl) {
      event.preventDefault();
    }
  });
}

// Este método será chamado quando o Electron terminar de inicializar
app.whenReady().then(createWindow);

// Sair quando todas as janelas estiverem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers para comunicação com o frontend
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Controles de janela personalizados
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
    return true;
  }
  return false;
});

// Redimensionar janela
ipcMain.handle('window-resize', (event, width, height) => {
  console.log('Electron: window-resize chamado com:', width, height);
  if (mainWindow) {
    console.log('Electron: Redimensionando janela para', width, 'x', height);
    
    // Forçar redimensionamento com setBounds
    const bounds = mainWindow.getBounds();
    console.log('Electron: Bounds atuais:', bounds);
    
    mainWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: width,
      height: height
    });
    
    console.log('Electron: setBounds executado');
    
    // Verificar se funcionou
    setTimeout(() => {
      const newBounds = mainWindow.getBounds();
      console.log('Electron: Novos bounds:', newBounds);
    }, 100);
    
    return true;
  }
  console.log('Electron: mainWindow não disponível');
  return false;
});

// Alterar opacidade da janela
ipcMain.handle('window-opacity', (event, opacity) => {
  if (mainWindow) {
    mainWindow.setOpacity(opacity);
    return true;
  }
  return false;
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return true;
  }
  return false;
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
    return true;
  }
  return false;
});

ipcMain.handle('window-is-maximized', () => {
  if (mainWindow) {
    return mainWindow.isMaximized();
  }
  return false;
});

// Minimizar para bandeja do sistema
ipcMain.handle('minimize-to-tray', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

// Restaurar da bandeja
ipcMain.handle('restore-from-tray', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Configurar bandeja do sistema (removido temporariamente por falta de ícone)
// const { Tray, Menu } = require('electron');
// let tray = null;

// app.whenReady().then(() => {
//   // Criar bandeja do sistema
//   const iconPath = path.join(__dirname, 'icon.png');
//   tray = new Tray(iconPath);
//   
//   const contextMenu = Menu.buildFromTemplate([
//     {
//       label: 'Mostrar Assistente',
//       click: () => {
//         if (mainWindow) {
//           mainWindow.show();
//           mainWindow.focus();
//         }
//       }
//     },
//     {
//       label: 'Sair',
//       click: () => {
//         app.quit();
//       }
//     }
//   ]);
//   
//   tray.setToolTip('Assistente IA');
//   tray.setContextMenu(contextMenu);
//   
//   // Clique duplo na bandeja para mostrar a janela
//   tray.on('double-click', () => {
//     if (mainWindow) {
//       mainWindow.show();
//       mainWindow.focus();
//     }
//   });
// });
