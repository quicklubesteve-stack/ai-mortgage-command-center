/**
 * AI Mortgage Assistant — Electron Desktop Application Entry Point
 * Manages the native Windows 11 desktop window, embedded backend lifecycle,
 * and secure credential vault.
 */

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const net = require('net');
const { startServer, server } = require('./server.js');
const { initSecureStore, getSettings, saveSettings, isEncryptionActive } = require('./secure-store.js');

let mainWindow = null;
let activePort = 3000;

// Set application name
app.setName('AI Mortgage Assistant');

// Helper to find an open port starting from preferredPort
function findAvailablePort(preferredPort) {
  return new Promise((resolve) => {
    const testServer = net.createServer();
    testServer.once('error', () => {
      // Port in use, try next
      resolve(findAvailablePort(preferredPort + 1));
    });
    testServer.once('listening', () => {
      testServer.close(() => {
        resolve(preferredPort);
      });
    });
    testServer.listen(preferredPort, '127.0.0.1');
  });
}

async function createWindow() {
  // Initialize secure credentials vault in AppData
  const userDataDir = app.getPath('userData');
  initSecureStore(userDataDir);

  const iconPath = path.join(__dirname, 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    title: 'AI Mortgage Assistant',
    icon: iconPath,
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#070b14',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Create clean application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Steve Authorization Desk',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.executeJavaScript("document.getElementById('tabBtnDossier')?.click();");
          }
        },
        {
          label: 'Wholesale Deals Matrix',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.webContents.executeJavaScript("document.getElementById('tabBtnMatrix')?.click();");
          }
        },
        {
          label: 'Scenario Studio',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.executeJavaScript("document.getElementById('tabBtnCalculator')?.click();");
          }
        },
        {
          label: 'Secure Vault & Settings',
          accelerator: 'CmdOrCtrl+V',
          click: () => {
            mainWindow.webContents.executeJavaScript("document.getElementById('tabBtnVault')?.click();");
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Refresh Cockpit' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Protocol Zero Guardrails',
          click: () => {
            mainWindow.webContents.executeJavaScript("alert('GOVERNANCE PROTOCOL ZERO:\\n\\nThe AI Mortgage Filtration Agent is legally and programmatically restricted from approving, denying, or committing to any mortgage deals.\\n\\nAll final underwriting authority is reserved exclusively for the authorized human loan officer (Steve).');");
          }
        },
        {
          label: 'About AI Mortgage Assistant',
          click: () => {
            mainWindow.webContents.executeJavaScript(`alert('AI Mortgage Assistant Desktop v1.0.0\\n\\nEnterprise-Grade Deal Filtration & Human Underwriting Cockpit\\nLead Underwriter: Steve\\nSecure Vault: ${isEncryptionActive() ? 'Windows DPAPI Active (Hardware Protected)' : 'Standard Storage'}');`);
          }
        }
      ]
    }
  ];

  const appMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(appMenu);

  // Load the application from the in-process server
  const appUrl = `http://127.0.0.1:${activePort}`;
  console.log(`[AI Mortgage Assistant] Loading interface from: ${appUrl}`);
  mainWindow.loadURL(appUrl);

  let windowShown = false;
  const revealWindow = () => {
    if (!windowShown && mainWindow) {
      windowShown = true;
      mainWindow.setTitle('Canadian AI Mortgage Assistant & Underwriting Cockpit');
      mainWindow.show();
      mainWindow.focus();
    }
  };

  mainWindow.once('ready-to-show', revealWindow);
  mainWindow.webContents.once('did-finish-load', revealWindow);
  setTimeout(revealWindow, 1200); // Fail-safe reveal

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.warn(`[AI Mortgage Assistant] Load warning: ${errorDescription} (${errorCode}). Retrying...`);
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(appUrl);
    }, 800);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Settings & DPAPI Vault
ipcMain.handle('get-vault-settings', async () => {
  return getSettings();
});

ipcMain.handle('save-vault-settings', async (event, newSettings) => {
  return saveSettings(newSettings);
});

ipcMain.handle('is-vault-encrypted', async () => {
  return isEncryptionActive();
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Application lifecycle
app.whenReady().then(async () => {
  try {
    console.log('[AI Mortgage Assistant] Initializing desktop runtime...');
    try {
      const serverRes = await startServer(3000);
      activePort = serverRes.port;
      console.log(`[AI Mortgage Assistant] Connected to backend on port ${activePort}`);
    } catch (serverErr) {
      console.log(`[AI Mortgage Assistant] Server notice (${serverErr.message}). Reusing existing active server on port 3000.`);
      activePort = 3000;
    }

    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error('[AI Mortgage Assistant] Startup notice:', err);
    // As a fail-safe, still create the window with default port 3000
    activePort = 3000;
    await createWindow();
  }
});

function cleanupBackend() {
  if (server && server.listening) {
    console.log('[AI Mortgage Assistant] Closing HTTP server...');
    try {
      server.close();
    } catch (e) {
      // Ignore if error during close
    }
  }
}

app.on('before-quit', () => {
  cleanupBackend();
});

app.on('window-all-closed', () => {
  cleanupBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
