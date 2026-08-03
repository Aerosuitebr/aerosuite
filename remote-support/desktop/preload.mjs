import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("aeroSupportDesktop", Object.freeze({
  platform: process.platform,
  version: process.versions.electron
}));

