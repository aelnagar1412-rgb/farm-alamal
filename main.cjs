const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = false; // اجعلها false لأنك تقوم ببناء نسخة EXE

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.cjs'), // إذا كان لديك ملف preload
    },
    // لإخفاء شريط القوائم العلوي (اختياري)
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'dist/icon.ico') // تأكد من مسار الأيقونة إن وجدت
  });

  // هذا هو السطر الأهم: توجيه Electron لفتح ملف index.html داخل مجلد dist
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error("Failed to load index.html:", err);
  });

  // فتح أدوات المطور تلقائياً إذا أردت اكتشاف أخطاء أخرى (اختياري)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
