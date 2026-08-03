import { app, BrowserWindow, shell } from "electron";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const desktopDir = fileURLToPath(new URL(".", import.meta.url));
const serverPort = 4180;
process.env.PORT = String(serverPort);
if (!process.env.AEROSUPPORT_CONTROL_PLANE_URL) process.env.AEROSUPPORT_CONTROL_PLANE_URL = "http://127.0.0.1:8080";
let mainWindow;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "AeroSupport",
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#080c12",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: join(desktopDir, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}/dashboard.html`);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${serverPort}/`)) event.preventDefault();
  });
}

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(async () => {
  await import("../tools/dev-server.mjs");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
