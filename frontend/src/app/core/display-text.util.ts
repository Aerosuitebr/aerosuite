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

  s = tryRepairCp850Mojibake(s);
  s = tryRepairMojibake(s);
  s = repairQuestionMarkWrappers(s);
  s = repairQuestionMarkAccentLoss(s);
  s = repairCommonPtBrWords(s);

  return s;
}

/** UTF-8 lido como CP850 (ex.: Servi├ºo → Serviço, Usu├írios → Usuários). */
function tryRepairCp850Mojibake(value: string): string {
  if (!value.includes('\u251c') && !value.includes('\u00d4\u00c7\u00f6')) {
    return value;
  }
  try {
    const bytes = new Uint8Array(cp850Bytes(value));
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (decoded && decoded !== value && !decoded.includes('\u251c') && !decoded.includes('\uFFFD')) {
      return decoded;
    }
  } catch {
    /* mantém original */
  }
  return value;
}

function cp850Bytes(value: string): number[] {
  const bytes: number[] = [];
  for (const ch of value) {
    const code = ch.codePointAt(0)!;
    const mapped = CP850_BYTE.get(code);
    if (mapped === undefined) {
      throw new Error('unmapped');
    }
    bytes.push(mapped);
  }
  return bytes;
}

/** Code point Unicode → byte CP850. ASCII fica idêntico; o restante cobre o mojibake de acentos. */
const CP850_BYTE = new Map<number, number>([
  ...Array.from({ length: 128 }, (_, i) => [i, i] as [number, number]),
  [0x00c7, 0x80], [0x00fc, 0x81], [0x00e9, 0x82], [0x00e2, 0x83], [0x00e4, 0x84], [0x00e0, 0x85], [0x00e5, 0x86], [0x00e7, 0x87],
  [0x00ea, 0x88], [0x00eb, 0x89], [0x00e8, 0x8a], [0x00ef, 0x8b], [0x00ee, 0x8c], [0x00ec, 0x8d], [0x00c4, 0x8e], [0x00c5, 0x8f],
  [0x00c9, 0x90], [0x00e6, 0x91], [0x00c6, 0x92], [0x00f4, 0x93], [0x00f6, 0x94], [0x00f2, 0x95], [0x00fb, 0x96], [0x00f9, 0x97],
  [0x00ff, 0x98], [0x00d6, 0x99], [0x00dc, 0x9a], [0x00f8, 0x9b], [0x00a3, 0x9c], [0x00d8, 0x9d], [0x00d7, 0x9e], [0x0192, 0x9f],
  [0x00e1, 0xa0], [0x00ed, 0xa1], [0x00f3, 0xa2], [0x00fa, 0xa3], [0x00f1, 0xa4], [0x00d1, 0xa5], [0x00aa, 0xa6], [0x00ba, 0xa7],
  [0x00bf, 0xa8], [0x00ae, 0xa9], [0x00ac, 0xaa], [0x00bd, 0xab], [0x00bc, 0xac], [0x00a1, 0xad], [0x00ab, 0xae], [0x00bb, 0xaf],
  [0x2591, 0xb0], [0x2592, 0xb1], [0x2593, 0xb2], [0x2502, 0xb3], [0x2524, 0xb4], [0x00c1, 0xb5], [0x00c2, 0xb6], [0x00c0, 0xb7],
  [0x00a9, 0xb8], [0x2563, 0xb9], [0x2551, 0xba], [0x2557, 0xbb], [0x255d, 0xbc], [0x00a2, 0xbd], [0x00a5, 0xbe], [0x2510, 0xbf],
  [0x2514, 0xc0], [0x2534, 0xc1], [0x252c, 0xc2], [0x251c, 0xc3], [0x2500, 0xc4], [0x253c, 0xc5], [0x00e3, 0xc6], [0x00c3, 0xc7],
  [0x255a, 0xc8], [0x2554, 0xc9], [0x2569, 0xca], [0x2566, 0xcb], [0x2560, 0xcc], [0x2550, 0xcd], [0x256c, 0xce], [0x00a4, 0xcf],
  [0x00f0, 0xd0], [0x00d0, 0xd1], [0x00ca, 0xd2], [0x00cb, 0xd3], [0x00c8, 0xd4], [0x0131, 0xd5], [0x00cd, 0xd6], [0x00ce, 0xd7],
  [0x00cf, 0xd8], [0x2518, 0xd9], [0x250c, 0xda], [0x2588, 0xdb], [0x2584, 0xdc], [0x00a6, 0xdd], [0x00cc, 0xde], [0x2580, 0xdf],
  [0x00d3, 0xe0], [0x00df, 0xe1], [0x00d4, 0xe2], [0x00d2, 0xe3], [0x00f5, 0xe4], [0x00d5, 0xe5], [0x00b5, 0xe6], [0x00fe, 0xe7],
  [0x00de, 0xe8], [0x00da, 0xe9], [0x00db, 0xea], [0x00d9, 0xeb], [0x00fd, 0xec], [0x00dd, 0xed], [0x00af, 0xee], [0x00b4, 0xef],
  [0x00ad, 0xf0], [0x00b1, 0xf1], [0x2017, 0xf2], [0x00be, 0xf3], [0x00b6, 0xf4], [0x00a7, 0xf5], [0x00f7, 0xf6], [0x00b8, 0xf7],
  [0x00b0, 0xf8], [0x00a8, 0xf9], [0x00b7, 0xfa], [0x00b9, 0xfb], [0x00b3, 0xfc], [0x00b2, 0xfd], [0x25a0, 0xfe], [0x00a0, 0xff]
]);

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
