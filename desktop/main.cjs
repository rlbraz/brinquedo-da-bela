const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

let mainWindow = null;
let keyboardBlocker = null;
let allowExit = false;
let topmostTimer = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

app.commandLine.appendSwitch('disable-pinch');
app.commandLine.appendSwitch('overscroll-history-navigation', '0');

function helperPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'KeyboardBlocker.exe')
    : path.join(__dirname, 'bin', 'KeyboardBlocker.exe');
}

function stopKeyboardBlocker() {
  if (keyboardBlocker && !keyboardBlocker.killed) keyboardBlocker.kill();
  keyboardBlocker = null;
}

function startKeyboardBlocker() {
  stopKeyboardBlocker();
  keyboardBlocker = spawn(helperPath(), [String(process.pid)], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'ignore']
  });

  const lines = readline.createInterface({ input: keyboardBlocker.stdout });
  lines.on('line', line => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      mainWindow.webContents.send('bela-global-key', JSON.parse(line));
    } catch {}
  });

  keyboardBlocker.on('exit', () => {
    keyboardBlocker = null;
    if (!allowExit && mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(startKeyboardBlocker, 250);
    }
  });
}

function keepOnTop() {
  if (!mainWindow || mainWindow.isDestroyed() || allowExit) return;
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setKiosk(true);
  mainWindow.setFullScreen(true);
  mainWindow.moveTop();
  if (!mainWindow.isFocused()) mainWindow.focus();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Brinquedo da Bela',
    backgroundColor: '#90e0ee',
    frame: false,
    fullscreen: true,
    kiosk: true,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });

  mainWindow.removeMenu();
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (allowExit) return;
    event.preventDefault();
    mainWindow.webContents.send('bela-fallback-key', {
      key: input.key,
      code: input.code,
      repeat: input.isAutoRepeat
    });
  });

  mainWindow.on('close', event => {
    if (!allowExit) event.preventDefault();
  });
  mainWindow.on('blur', () => setTimeout(keepOnTop, 0));
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    keepOnTop();
    startKeyboardBlocker();
    topmostTimer = setInterval(keepOnTop, 1000);
  });
}

ipcMain.handle('bela-close-app', () => {
  allowExit = true;
  if (topmostTimer) clearInterval(topmostTimer);
  stopKeyboardBlocker();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setClosable(true);
    mainWindow.destroy();
  }
  app.quit();
});

app.on('second-instance', keepOnTop);
app.on('before-quit', event => {
  if (!allowExit) event.preventDefault();
});
app.whenReady().then(createWindow);

