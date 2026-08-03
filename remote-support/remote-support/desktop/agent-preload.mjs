import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("aeroSupportAgent", Object.freeze({
  setControlEnabled: enabled => ipcRenderer.invoke("control:set-enabled", Boolean(enabled)),
  applyInput: event => ipcRenderer.invoke("control:input", event)
}));

