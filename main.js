const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')

let mainWindow
let splash

function createSplash() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true
  })

  splash.loadFile(path.join(__dirname, 'splash.html'))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    fullscreen: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))

  mainWindow.once('ready-to-show', () => {
    splash.close()
    mainWindow.show()
  })

  mainWindow.webContents.on('did-fail-load', () => {
    dialog.showErrorBox(
      "خطأ في تشغيل البرنامج",
      "الواجهة لم يتم تحميلها. تأكد من ملفات البرنامج."
    )
  })
}

app.whenReady().then(() => {
  createSplash()
  createWindow()
})
