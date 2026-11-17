/** Detect only obvious provisional input; the technical adequacy is decided by the company. */
export function criterioProvisorio(valor?: string): boolean {
  const texto=(valor || '').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  return new Set(['asadasdasd','teste','test','placeholder','exemplo','asdf','qwerty','abc','xxx','123','1234','123456']).has(texto)
    || /^(asd|asdf|qwer|qwerty|abc|123){2,}$/.test(texto)
    || /^(.)\1{3,}$/.test(texto);
}
