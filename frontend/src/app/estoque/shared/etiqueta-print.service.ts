import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TranslationService } from '../../core/translation.service';
import { ThermalPrintBridgeClient } from '../../core/print/thermal-print-bridge.client';
import {
  ThermalPrintMode,
  ThermalPrintPreferencesService
} from '../../core/print/thermal-print-preferences.service';
import { ThermalPrintSetupService } from '../../core/print/thermal-print-setup.service';
import { buildPplbEtiquetaPadrao100x60, PplbEtiquetaPadrao100x60Params } from './pplb-etiqueta.builder';
import { openEtiquetaHtmlPrint } from './etiqueta-print.util';

export interface EtiquetaPadraoPrintInput {
  headerLine: string;
  codigoRastreio: string;
  partNumber: string;
  serialNumber?: string | null;
  linhaExtra?: string | null;
  qrPayload?: string | null;
  prefixPn?: string;
  prefixSn?: string;
  barcodeValue?: string;
}

export type EtiquetaPrintChannel = 'thermal' | 'browser';

/** @deprecated Use EtiquetaPadraoPrintInput */
export type EtiquetaPadraoThermalInput = EtiquetaPadraoPrintInput;

/**
 * Impressão de etiquetas: navegador (qualquer impressora) ou térmica PPLB (opcional).
 */
@Injectable({ providedIn: 'root' })
export class EtiquetaPrintService {
  private bridge = inject(ThermalPrintBridgeClient);
  private prefs = inject(ThermalPrintPreferencesService);
  private i18n = inject(TranslationService);
  private messageService = inject(MessageService);
  private setupService = inject(ThermalPrintSetupService);

  /** Impressão normal — diálogo do sistema / impressora de escritório. */
  printPadraoBrowser(html: string): boolean {
    const popupOk = openEtiquetaHtmlPrint(html);
    this.notifyBrowserPrintOpened(popupOk);
    return popupOk;
  }

  /**
   * Imprime etiqueta padrão 100×60.
   * @param channel `browser` = só HTML; `thermal` = só PPLB; `auto` ou omitido = preferência do usuário.
   */
  async printPadrao100x60(
    input: EtiquetaPadraoPrintInput,
    htmlFallback: () => void | Promise<void>,
    channel?: ThermalPrintMode
  ): Promise<EtiquetaPrintChannel> {
    const mode = channel ?? this.prefs.getMode();

    if (mode === 'browser') {
      await this.runBrowserFallback(htmlFallback);
      return 'browser';
    }

    const bridgeUp = await this.bridge.isAvailable();
    if (mode === 'thermal' && !bridgeUp) {
      this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'estoque.etiqueta.thermal.bridgeRequired');
      this.setupService.open('print-failed');
      throw new Error('thermal-bridge-unavailable');
    }
    if (!bridgeUp) {
      await this.runBrowserFallback(htmlFallback);
      return 'browser';
    }

    const pplb = buildPplbEtiquetaPadrao100x60(this.toPplbParams(input));
    try {
      await this.bridge.printRaw(pplb, this.prefs.getPrinterName());
    } catch (e) {
      const detail =
        e instanceof Error && e.message && !e.message.startsWith('print ')
          ? e.message
          : this.i18n.translate('estoque.etiqueta.thermal.printError');
      this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', detail);
      throw new Error('thermal-print-failed');
    }
    this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.etiqueta.thermal.sent');
    return 'thermal';
  }

  async printPplbContent(content: string): Promise<void> {
    const bridgeUp = await this.bridge.isAvailable();
    if (!bridgeUp) {
      this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'estoque.etiqueta.thermal.bridgeRequired');
      this.setupService.open('print-failed');
      throw new Error('thermal-bridge-unavailable');
    }
    await this.bridge.printRaw(content, this.prefs.getPrinterName());
    this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.etiqueta.thermal.sent');
  }

  async checkBridgeAndNotify(): Promise<boolean> {
    const ok = await this.bridge.isAvailable();
    if (!ok) {
      this.i18n.addToast(this.messageService, 'warn', 'estoque.etiqueta.thermal.infoTitle', 'estoque.etiqueta.thermal.bridgeOffline');
      this.setupService.open('manual');
    }
    return ok;
  }

  /** Impressão pelo navegador (ação principal). */
  notifyBrowserPrintOpened(popupOk: boolean): void {
    if (popupOk) {
      this.i18n.addToast(this.messageService, 'info', 'estoque.etiqueta.print.infoTitle', 'estoque.etiqueta.print.browserOpened');
      return;
    }
    this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.etiqueta.print.popupBlocked');
  }

  /** Fallback automático quando térmica indisponível. */
  notifyBrowserFallbackOpened(popupOk: boolean): void {
    if (popupOk) {
      this.i18n.addToast(this.messageService, 'info', 'estoque.etiqueta.thermal.infoTitle', 'estoque.etiqueta.thermal.fallbackBrowser');
      return;
    }
    this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.etiqueta.print.popupBlocked');
    this.setupService.open('print-failed');
  }

  private async runBrowserFallback(htmlFallback: () => void | Promise<void>): Promise<void> {
    await htmlFallback();
  }

  private toPplbParams(input: EtiquetaPadraoPrintInput): PplbEtiquetaPadrao100x60Params {
    const prefixPn = input.prefixPn ?? 'P/N: ';
    const prefixSn = input.prefixSn ?? 'S/N: ';
    const bodyLines: string[] = [];
    if (input.codigoRastreio) bodyLines.push(input.codigoRastreio);
    if (input.partNumber) bodyLines.push(`${prefixPn}${input.partNumber}`);
    if (input.serialNumber) bodyLines.push(`${prefixSn}${input.serialNumber}`);
    if (input.linhaExtra) bodyLines.push(input.linhaExtra.replace(/^📍\s*/, ''));

    const barcode =
      input.barcodeValue?.trim() ||
      input.partNumber?.trim() ||
      input.codigoRastreio?.trim() ||
      '';

    return {
      headerLine: input.headerLine,
      bodyLines,
      barcodeValue: barcode,
      qrPayload: input.qrPayload ?? null
    };
  }
}

/** @deprecated Use EtiquetaPrintService */
export { EtiquetaPrintService as EtiquetaThermalPrintService };
