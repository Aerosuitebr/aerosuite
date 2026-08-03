import { app, BrowserWindow, ipcMain } from "electron";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const serverPort = 4181;
process.env.PORT = String(serverPort);
if (!process.env.AEROSUPPORT_CONTROL_PLANE_URL) process.env.AEROSUPPORT_CONTROL_PLANE_URL = "http://127.0.0.1:8080";
let agentWindow;
let inputHelper;
let controlEnabled = false;
const desktopDir = fileURLToPath(new URL(".", import.meta.url));

function helperPath() {
  if (app.isPackaged) return join(process.resourcesPath, "input-helper", "AeroSupport.InputHelper.exe");
  return join(desktopDir, "..", "apps", "windows-agent", "AeroSupport.InputHelper", "bin", "Release", "net5.0", "win-x64", "publish", "AeroSupport.InputHelper.exe");
}

function stopHelper() {
  controlEnabled = false;
  inputHelper?.kill();
  inputHelper = null;
}

function ensureHelper() {
  const target = helperPath();
  if (!existsSync(target)) return false;
  if (!inputHelper) {
    inputHelper = spawn(target, [], { windowsHide: true, stdio: ["pipe", "ignore", "ignore"] });
    inputHelper.once("exit", () => inputHelper = null);
  }
  return true;
}

if (!app.requestSingleInstanceLock()) app.quit();

function createAgentWindow() {
  agentWindow = new BrowserWindow({
    title: "AeroSupport Agent",
    width: 760,
    height: 820,
    minWidth: 620,
    minHeight: 680,
    backgroundColor: "#080c12",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: join(desktopDir, "agent-preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });
  agentWindow.loadURL(`http://127.0.0.1:${serverPort}/agent.html`);
  agentWindow.once("ready-to-show", () => agentWindow.show());
  agentWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  agentWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${serverPort}/`)) event.preventDefault();
  });
}

ipcMain.handle("control:set-enabled", (_event, enabled) => {
  controlEnabled = Boolean(enabled);
  if (!controlEnabled) stopHelper();
  return controlEnabled ? ensureHelper() : true;
});
ipcMain.handle("control:input", (_event, command) => {
  if (!controlEnabled || !ensureHelper() || !command || typeof command !== "object") return false;
  const allowed = ["move", "button", "wheel", "key"];
  if (!allowed.includes(command.type)) return false;
  inputHelper.stdin.write(`${JSON.stringify(command)}\n`);
  return true;
});

app.whenReady().then(async () => {
  await import("../tools/dev-server.mjs");
  createAgentWindow();
});
app.on("second-instance", () => {
  if (agentWindow?.isMinimized()) agentWindow.restore();
  agentWindow?.focus();
});
app.on("window-all-closed", () => { stopHelper(); app.quit(); });
