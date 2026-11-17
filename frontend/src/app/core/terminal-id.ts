/** Mesmo terminal nas telas de produção e ferramentaria. Não altera vínculos existentes. */
let fallback: string | undefined;
export function obterTerminalId(): string {
  const gerar=()=>`T${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}${Math.random().toString(36).slice(2,10)}`;
  try {
    let id=localStorage.getItem('osFluxo.terminalId');
    if(!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)){id=gerar();localStorage.setItem('osFluxo.terminalId',id);}
    return id;
  } catch { return fallback ||= gerar(); }
}
