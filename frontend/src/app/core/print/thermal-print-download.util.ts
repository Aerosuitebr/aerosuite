import { bustStaticAssetUrl } from '../../../environments/asset-cache-bust';

export const THERMAL_PRINT_BRIDGE_ZIP_PATH = '/assets/downloads/AeroSuite-PrintBridge.zip';

export function getThermalPrintBridgeZipUrl(): string {
  return bustStaticAssetUrl(THERMAL_PRINT_BRIDGE_ZIP_PATH);
}

export function downloadThermalPrintBridgeZip(): void {
  const url = getThermalPrintBridgeZipUrl();
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'AeroSuite-PrintBridge.zip';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
