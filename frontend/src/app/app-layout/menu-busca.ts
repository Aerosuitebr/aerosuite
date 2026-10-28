import { Funcionalidade } from '../core/funcionalidade.service';
import { MenuSection } from '../core/menu.service';

export interface TrechoDestacado {
  texto: string;
  destaque: boolean;
}

export interface MenuSugestao {
  func: Funcionalidade;
  secao: MenuSection;
  score: number;
  nome: TrechoDestacado[];
  /** Preenchido quando o termo só aparece na descrição, para explicar a sugestão. */
  descricao?: TrechoDestacado[];
}

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'para', 'por', 'em', 'no', 'na']);

/** Termos que o usuário costuma digitar e que não aparecem literalmente nos nomes. */
const SINONIMOS: Record<string, string[]> = {
  os: ['ordem', 'servico'],
  ordem: ['os'],
  rnc: ['nao conformidade', 'qualidade'],
  bipar: ['bipagem', 'estacao'],
  bipagem: ['estacao'],
  etiqueta: ['codigos', 'bipagem'],
  cracha: ['usuarios'],
  permissao: ['perfis', 'acesso'],
  acesso: ['permissoes', 'perfis'],
  cliente: ['externos'],
  fornecedor: ['fornecedores'],
  nf: ['invoices', 'entrada'],
  nota: ['invoices', 'entrada'],
  estoque: ['itens', 'lotes', 'movimentacoes'],
  mecanico: ['carga', 'mecanicos'],
  fluxo: ['etapas', 'bipagem'],
  etapa: ['fluxo', 'ajuste'],
  backup: ['banco'],
  chamado: ['suporte', 'chamados'],
  proposta: ['comercial', 'propostas']
};

interface TextoIndexado {
  original: string;
  norm: string;
  /** norm[i] corresponde a original[mapa[i]]. */
  mapa: number[];
  palavras: { ini: number; texto: string }[];
}

function normalizarChar(c: string): string {
  return c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function normalizarBusca(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function indexar(original: string): TextoIndexado {
  let norm = '';
  const mapa: number[] = [];
  let i = 0;
  for (const c of original || '') {
    const n = normalizarChar(c);
    for (const ch of n) {
      norm += ch;
      mapa.push(i);
    }
    i += c.length;
  }
  const palavras: { ini: number; texto: string }[] = [];
  const re = /[a-z0-9]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm))) {
    palavras.push({ ini: m.index, texto: m[0] });
  }
  return { original: original || '', norm, mapa, palavras };
}

function distanciaAteUm(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let diferencas = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++diferencas > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else if (a[i + 1] === b[j] && a[i] === b[j + 1]) {
      i += 2;
      j += 2;
    } else {
      i++;
      j++;
    }
  }
  return diferencas + (a.length - i) + (b.length - j) <= 1;
}

type Faixa = [number, number];

/** Pontua um termo num texto; devolve 0 quando não encontra. */
function pontuarTermo(termo: string, txt: TextoIndexado, faixas?: Faixa[]): number {
  let melhor = 0;
  txt.palavras.forEach((p, idx) => {
    let pts = 0;
    let fim = 0;
    if (p.texto === termo) {
      pts = 120;
      fim = termo.length;
    } else if (p.texto.startsWith(termo)) {
      pts = 100;
      fim = termo.length;
    } else if (termo.length >= 3 && p.texto.includes(termo)) {
      pts = 45;
      const off = p.texto.indexOf(termo);
      faixas?.push([p.ini + off, p.ini + off + termo.length]);
      melhor = Math.max(melhor, pts);
      return;
    } else if (
      termo.length >= 4 &&
      [0, 1, -1].some((d) => {
        const alvo = p.texto.slice(0, termo.length + d);
        return alvo.length >= termo.length - 1 && distanciaAteUm(termo, alvo);
      })
    ) {
      pts = 30;
      fim = Math.min(p.texto.length, termo.length);
    }
    if (pts) {
      if (idx === 0) pts += 15;
      faixas?.push([p.ini, p.ini + fim]);
      melhor = Math.max(melhor, pts);
    }
  });
  return melhor;
}

function siglaCombina(consulta: string, txt: TextoIndexado): boolean {
  if (consulta.length < 2 || /\s/.test(consulta)) return false;
  const iniciais = txt.palavras
    .filter((p) => !STOPWORDS.has(p.texto))
    .map((p) => p.texto[0])
    .join('');
  return iniciais.startsWith(consulta);
}

function destacar(txt: TextoIndexado, faixas: Faixa[]): TrechoDestacado[] {
  if (!faixas.length) return [{ texto: txt.original, destaque: false }];
  const marcado = new Array(txt.original.length).fill(false);
  for (const [ini, fim] of faixas) {
    for (let k = ini; k < fim && k < txt.mapa.length; k++) {
      const o = txt.mapa[k];
      marcado[o] = true;
      const c = txt.original.charCodeAt(o);
      if (c >= 0xd800 && c <= 0xdbff) marcado[o + 1] = true;
    }
  }
  const partes: TrechoDestacado[] = [];
  for (let k = 0; k < txt.original.length; k++) {
    const d = marcado[k];
    const ult = partes[partes.length - 1];
    if (ult && ult.destaque === d) ult.texto += txt.original[k];
    else partes.push({ texto: txt.original[k], destaque: d });
  }
  return partes;
}

export function buscarFuncionalidades(consulta: string, secoes: MenuSection[], limite = 10): MenuSugestao[] {
  const q = normalizarBusca(consulta).trim().replace(/\s+/g, ' ');
  if (!q) return [];

  const brutos = q.split(' ').filter(Boolean);
  const semStop = brutos.filter((t) => !STOPWORDS.has(t) || t === 'os');
  const termos = semStop.length ? semStop : brutos;

  const resultado: MenuSugestao[] = [];

  for (const secao of secoes) {
    const idxSecao = indexar(secao.titulo);
    for (const func of secao.funcionalidades) {
      const nome = indexar(func.nome);
      const desc = indexar(func.descricao || '');
      const tecnico = indexar(`${(func.codigo || '').replace(/_/g, ' ')} ${(func.rota || '').replace(/[/\-]/g, ' ')}`);

      const faixasNome: Faixa[] = [];
      const faixasDesc: Faixa[] = [];
      let score = 0;
      let todosNoNome = true;
      let completo = true;

      for (const termo of termos) {
        const noNome = pontuarTermo(termo, nome, faixasNome);
        const naSecao = pontuarTermo(termo, idxSecao) * 0.45;
        const naDesc = pontuarTermo(termo, desc, faixasDesc) * 0.3;
        const noTecnico = pontuarTermo(termo, tecnico) * 0.2;
        let pts = Math.max(noNome, naSecao, naDesc, noTecnico);
        let sinonimoNoNome = false;

        for (const alt of SINONIMOS[termo] || []) {
          const partes = alt.split(' ');
          const nosNomes = partes.map((a) => pontuarTermo(a, nome) * 0.9);
          if (nosNomes.every((x) => x > 0)) {
            if (Math.min(...nosNomes) > pts) pts = Math.min(...nosNomes);
            partes.forEach((a) => pontuarTermo(a, nome, faixasNome));
            sinonimoNoNome = true;
          } else if (!pts) {
            const pontos = partes.map((a) => Math.max(pontuarTermo(a, idxSecao) * 0.35, pontuarTermo(a, desc) * 0.2));
            if (pontos.every((x) => x > 0)) pts = Math.min(...pontos);
          }
        }

        if (!pts) {
          completo = false;
          break;
        }
        if (!noNome && !sinonimoNoNome) todosNoNome = false;
        score += pts;
      }

      const sigla = siglaCombina(q, nome);
      if (!completo && !sigla) continue;
      if (!completo) {
        score = 0;
        todosNoNome = true;
      }
      if (sigla) score += 140;

      if (nome.norm === q) score += 400;
      else if (nome.norm.startsWith(q)) score += 200;
      if (todosNoNome) score += 60;

      resultado.push({
        func,
        secao,
        score,
        nome: destacar(nome, faixasNome),
        descricao: !todosNoNome && faixasDesc.length ? destacar(desc, faixasDesc) : undefined
      });
    }
  }

  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
  resultado.sort((a, b) => b.score - a.score || collator.compare(a.func.nome, b.func.nome));
  return resultado.slice(0, limite);
}
