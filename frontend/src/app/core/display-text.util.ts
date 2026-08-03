/**
 * Repara texto exibido quando houve perda de acentos (mojibake) ou substituição por "?".
 * Não substitui dados corrompidos no banco — apenas melhora a leitura na UI.
 */
function repairQuestionMarkAccentLoss(value: string): string {
  return value
    .replace(/Mec\?{1,2}nico/gi, 'Mecânico')
    .replace(/Guimar\?{1,2}es/gi, 'Guimarães')
    .replace(/PE\?{1,2}ANHA/gi, 'PEÇANHA')
    .replace(/Pe\?{1,2}anha/gi, 'Peçanha')
    .replace(/\?{1,2}LCIO/gi, 'ÉLCIO')
    .replace(/Administra\?{1,2}o/gi, 'Administração')
    .replace(/Calibra\?{1,2}o/gi, 'Calibração')
    .replace(/Manuten\?{1,2}o/gi, 'Manutenção')
    .replace(/Inspe\?{1,2}o/gi, 'Inspeção')
    .replace(/Informa\?{1,2}o/gi, 'Informação');
}

export function repairDisplayText(text: string | null | undefined): string {
  if (text == null || text === '') {
    return '';
  }

  let s = text.normalize('NFC');

  s = tryRepairMojibake(s);
  s = repairQuestionMarkWrappers(s);
  s = repairQuestionMarkAccentLoss(s);
  s = repairCommonPtBrWords(s);

  return s;
}

/** Latin-1/Windows-1252 interpretado como UTF-8 (ex.: ServiÃ§o → Serviço). */
function tryRepairMojibake(value: string): string {
  if (!/[ÃÂÊÔÕÚÇãõúç]/.test(value)) {
    return value;
  }
  try {
    const bytes = Uint8Array.from([...value].map(ch => ch.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (decoded && decoded !== value && !decoded.includes('\uFFFD')) {
      return decoded;
    }
  } catch {
    /* mantém original */
  }
  return value;
}

/** ???Rótulo??? → «Rótulo» (padrão comum em títulos importados com charset errado). */
function repairQuestionMarkWrappers(value: string): string {
  return value.replace(/\?{2,}([^?\s][^?]*?)\?{2,}/g, '«$1»');
}

function repairCommonPtBrWords(value: string): string {
  return value
    .replace(/Servi\?{1,2}o/gi, 'Serviço')
    .replace(/Ordem de Servi\?{1,2}o/gi, 'Ordem de Serviço')
    .replace(/Informa\?{1,2}o/gi, 'Informação')
    .replace(/Configura\?{1,2}o/gi, 'Configuração')
    .replace(/Manuten\?{1,2}o/gi, 'Manutenção')
    .replace(/T[eé]cnico de Manuten[cç][aã]o/gi, 'Técnico de Manutenção')
    .replace(/Centro T[eéÃ©]cnico de Manuten[cçÃ§][aãÃ£]o/gi, 'Centro Técnico de Manutenção')
    .replace(/n\?{1,2}o/gi, 'não')
    .replace(/N\?{1,2}o/g, 'Não');
}
