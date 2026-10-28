import type { Funcionalidade } from './funcionalidade.service';
import { slugifyMenuSection } from './i18n/menu-i18n.util';

export const MENU_SECTIONS = ['OS','RNC','ESTOQUE','COMERCIAL','CADASTRO','TECNICA_DOCUMENTOS','ADMINISTRACAO','AJUDA_COMUNICACAO'] as const;
type Section = typeof MENU_SECTIONS[number];
export interface MenuOrganization { section: Section; group: string; order: number; }
const OS_ORDER: Record<string,number> = {
 '/os':10, '/capacidade':20, '/os/carga-mecanicos':25, '/hangar':30, '/operacoes':40,
 '/os/fluxo':50, '/os/fluxo/estacao':60, '/os/fluxo/codigos':70,
 '/os/consulta-trocas-eventuais':80, '/os/pendentes-pagamento-trocas':90
};
const RNC_ORDER: Record<string, number> = {
 '/nrc':10, '/nrc/nova':20, '/nrc/tratar':30, '/nrc/encerrar':40, '/nrc/relatorio':50, '/nrc/dashboard':60
};
const REGISTRATIONS: Record<string,[string,number]> = {
 '/products':['CADASTROS_PRODUTOS',10],
 '/products/new':['CADASTROS_PRODUTOS',10],
 '/fabricantes':['CADASTROS_PRODUTOS',10],
 '/fcu':['CADASTROS_PRODUTOS',10],
 '/associacao-fcu':['CADASTROS_PRODUTOS',10],
 '/tipos-servico':['CADASTROS_PRODUTOS',10],
 '/estoque/fornecedores':['CADASTROS_PRODUTOS',10],
 '/estoque/lotes':['CADASTROS_PRODUTOS',10],
 '/usuarios':['CADASTROS_PESSOAS',20],
 '/usuarios-externos':['CADASTROS_PESSOAS',20],
 '/perfis':['CADASTROS_PESSOAS',20],
 '/funcionalidades':['CADASTROS_PESSOAS',20],
 '/os/fluxo/estacoes':['CADASTROS_ESTRUTURA',30],
 '/capacidade/hangares':['CADASTROS_ESTRUTURA',30],
 '/publicacoes-tecnicas/cadastro':['CADASTROS_DOCUMENTOS',40],
 '/publicacoes-tecnicas/associar-pn':['CADASTROS_DOCUMENTOS',40],
};
const ADMIN_REPORTS = new Set(['/relatorios','/os-auditoria','/dossie-auditoria','/operacoes/custos','/estoque/dashboard','/estoque/movimentacoes','/conformidade/painel']);
const ADMIN_CONFIG = new Set(['/configuracoes','/go-live-migracao','/os/fluxo/estacoes','/os/fluxo/ajuste','/capacidade/hangares','/estoque/estoque-minimo-lote']);
const ADMIN_ACCESS = new Set(['/usuarios','/usuarios-externos','/perfis','/funcionalidades','/controle-acesso']);
const TECHNICAL = new Set(['/fabricantes','/tipos-servico','/fcu','/associacao-fcu','/fcu-assembly','/biblioteca','/aero/diretrizes']);
export function menuOrganization(f: Pick<Funcionalidade,'rota'|'codigo'|'secao'>): MenuOrganization {
 const rawRoute=(f.rota||'').trim().split('?')[0].split('#')[0];
 const route=rawRoute?'/'+rawRoute.replace(/^\/+|\/+$/g,'').toLowerCase():'';
 const code=(f.codigo||'').trim().toUpperCase();
 const old=slugifyMenuSection(f.secao||'');
 const item=(section:Section,group='',order=500):MenuOrganization=>({section,group,order});
 if(REGISTRATIONS[route])return item('CADASTRO',...REGISTRATIONS[route]);
 if(code.startsWith('NRC_')||route==='/nrc'||route.startsWith('/nrc/'))return item('RNC','',RNC_ORDER[route]??80);
 // Administrative exceptions take precedence over the operational route prefix.
 if(ADMIN_REPORTS.has(route)||/AUDITOR|RELATOR|CUSTOS_OPERACIONAIS/.test(code))return item('ADMINISTRACAO','AUDITORIAS_RELATORIOS',10);
 if(ADMIN_ACCESS.has(route))return item('ADMINISTRACAO','ACESSOS',40);
 if(ADMIN_CONFIG.has(route)||code==='CONFIGURACOES'||route.startsWith('/integracoes/'))return item('ADMINISTRACAO','CONFIGURACAO_INTEGRACOES',30);
 if(route.startsWith('/conformidade/'))return item('ADMINISTRACAO','CONTROLES_TECNICOS',20);
 if(route in OS_ORDER)return item('OS','',OS_ORDER[route]);
 if(route.startsWith('/os/')||route.startsWith('/operacoes/')||route.startsWith('/capacidade/'))return item('OS');
 if(route.startsWith('/estoque')||route.startsWith('/products'))return item('ESTOQUE');
 if(['/propostas-comerciais','/templates-proposta'].includes(route))return item('COMERCIAL');
 if(TECHNICAL.has(route)||route.startsWith('/publicacoes-tecnicas/'))return item('TECNICA_DOCUMENTOS');
 if(route.startsWith('/suporte')||route.startsWith('/vitrine')||route==='/chat')return item('AJUDA_COMUNICACAO');
 // Preserve new/legacy entries even before their route is explicitly catalogued.
 if(['OS','ORDEM_DE_SERVICO','OFICINA','OPERACIONAL'].includes(old))return item('OS');
 if(old==='ESTOQUE')return item('ESTOQUE');
 if(old==='COMERCIAL')return item('COMERCIAL');
 if(old==='CADASTRO')return item('CADASTRO','CADASTROS_PRODUTOS',10);
 if(['DOCUMENTOS','PUBLICACOES_TECNICAS','TECNICA_DOCUMENTOS'].includes(old))return item('TECNICA_DOCUMENTOS');
 if(['SUPORTE','VITRINE','COMUNICACAO','AJUDA_COMUNICACAO'].includes(old))return item('AJUDA_COMUNICACAO');
 return item('ADMINISTRACAO','OUTROS_CONTROLES',50);
}
export function uniqueMenuDestinations(items:Funcionalidade[]):Funcionalidade[] {
 const seen=new Set<string>();
 return items.filter(f=>{const key=f.rota?.trim().replace(/\/+$/,'')||'code:'+f.codigo;if(seen.has(key))return false;seen.add(key);return true;});
}

/** The most specific route wins (station settings must not open the generic OS group). */
export function activeMenuSection(url:string, sections:{id:string;funcionalidades:{rota?:string}[]}[]):string|undefined {
 const norm=(r:string)=>('/'+r.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g,''));
 const path=norm(url);
 return sections.flatMap(s=>s.funcionalidades.filter(f=>!!f.rota).map(f=>({id:s.id,route:norm(f.rota!)})))
  .filter(f=>path===f.route||(f.route!=='/'&&path.startsWith(f.route+'/')))
  .sort((a,b)=>b.route.length-a.route.length)[0]?.id;
}
