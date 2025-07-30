const { app, BrowserWindow, Menu, dialog, shell, ipcMain, clipboard } = require('electron');
const path = require('path');

// Отключаем предупреждения о безопасности в dev режиме
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow;
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Создаем главное окно приложения
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Для работы с localhost:4723
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../public/icon.png'), // Иконка приложения
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Не показываем окно сразу
  });

  // Загружаем приложение
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Открываем DevTools в dev режиме
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Показываем окно когда оно готово
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Обработка внешних ссылок
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Предотвращаем навигацию
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
}

// IPC handlers
function setupIPC() {
  // App info
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  // Shell operations
  ipcMain.handle('shell:openExternal', async (event, url) => {
    await shell.openExternal(url);
  });

  // Clipboard operations
  ipcMain.handle('clipboard:writeText', (event, text) => {
    clipboard.writeText(text);
  });

  ipcMain.handle('clipboard:readText', () => {
    return clipboard.readText();
  });
}

// Создаем меню приложения
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'About Appium Inspector',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Appium Inspector',
              detail: `Modern desktop application for inspecting mobile app UI elements.\n\nVersion: ${app.getVersion()}\nBuilt with Electron + React + Vite`,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS специфичные настройки меню
  if (process.platform === 'darwin') {
    template[0].label = app.getName();
    template[0].submenu.unshift(
      { role: 'about' },
      { type: 'separator' }
    );

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Готовность приложения
app.whenReady().then(() => {
  setupIPC();
  createWindow();
  createMenu();

  app.on('activate', () => {
    // На macOS обычно пересоздают окно при клике на иконку в доке
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Выход из приложения
app.on('window-all-closed', () => {
  // На macOS приложения обычно остаются активными даже когда все окна закрыты
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Безопасность: предотвращаем создание новых окон
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Обработка протокола в production
if (!isDev) {
  // Устанавливаем протокол для обработки глубоких ссылок
  app.setAsDefaultProtocolClient('appium-inspector');
}

// Обработка второго экземпляра приложения
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Если пользователь пытается запустить второй экземпляр, фокусируемся на существующем окне
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
} 