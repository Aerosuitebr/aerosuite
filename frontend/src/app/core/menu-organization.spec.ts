import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { MENU_SECTIONS, menuOrganization, uniqueMenuDestinations, activeMenuSection } from './menu-organization';
import { MenuService } from './menu.service';
import type { Funcionalidade } from './funcionalidade.service';
const item=(rota:string,secao='Sistema',codigo='F_TESTE',id=1):Funcionalidade=>({id,rota,secao,codigo,nome:rota,ativo:true,visivel:true,posicao:0,tipo:'funcionalidade',createdAt:'',updatedAt:''});
const service=()=>Object.assign(Object.create(MenuService.prototype),{i18n:{getCurrentLanguage:()=> 'pt-BR',translateMenuFunc:(_c:string,n:string)=>n,translateMenuSecao:(s:string)=>s,translate:(s:string)=>s}}) as any;
describe('Menu organizado por fluxo de trabalho',()=>{
 it.each(['/os','/hangar','/capacidade','/os/fluxo','/os/fluxo/estacao','/os/fluxo/codigos','/operacoes','/os/consulta-trocas-eventuais'])('reúne %s em OS',r=>expect(menuOrganization(item(r)).section).toBe('OS'));
 it('reúne todo o RNC numa seção própria',()=>{
  const entradas:[string,string,number][]=[['/nrc','NRC_LIST',10],['/nrc/nova','NRC_ABRIR',20],['/nrc/tratar','NRC_ANALISAR',30],['/nrc/encerrar','NRC_ENCERRAR',40],['/nrc/relatorio','NRC_RELATORIO',50],['/nrc/dashboard','NRC_DASHBOARD',60]];
  for(const [rota,codigo,order] of entradas)expect(menuOrganization(item(rota,'Gestão',codigo))).toEqual({section:'RNC',group:'',order});
 });
 it.each(['/relatorios','/os-auditoria','/operacoes/custos','/estoque/dashboard','/estoque/movimentacoes','/dossie-auditoria'])('mantém %s em auditorias e relatórios',r=>expect(menuOrganization(item(r)).group).toBe('AUDITORIAS_RELATORIOS'));
 it.each(['/os/fluxo/ajuste','/integracoes/bling','/go-live-migracao'])('separa a configuração %s da operação diária',r=>expect(menuOrganization(item(r)).section).toBe('ADMINISTRACAO'));
 it('preserva rotas, códigos e objetos recebidos; não cria funcionalidades na organização',()=>{
  const s=service(),entrada=[item('/os','Cadastro'),item('/estoque/entrada','Estoque','OUTRO',2),item('/usuarios','Cadastro','USUARIOS',3)];
  const before=JSON.stringify(entrada),out=s.organizarFuncionalidadesPorSecao(entrada).flatMap((x:any)=>x.funcionalidades);
  expect(JSON.stringify(entrada)).toBe(before);expect(out.map((f:any)=>[f.id,f.codigo,f.rota]).sort()).toEqual(entrada.map(f=>[f.id,f.codigo,f.rota]).sort());
 });
 it('elimina duplicação de destino sem perder outros destinos',()=>{
  const all=[item('/os-auditoria','Operacional','AUDITORIA_OS'),item('/os-auditoria','Ordem de serviço','OS_AUDITORIA',2),item('/os','Cadastro','ORDEM',3)];
  expect(uniqueMenuDestinations(all).map(f=>f.rota)).toEqual(['/os-auditoria','/os']);
 });
 it('converte menus de sessão antigos para a nova estrutura',()=>{
  const out=service().normalizeCachedMenuSections([{id:'oficina',titulo:'Oficina',funcionalidades:[item('/operacoes','Oficina'),item('/os/fluxo/estacoes','Oficina','F2',2)]}]);
  expect(out.map((s:any)=>s.titulo)).toEqual(['CADASTRO','OS']);
 });
 it('não exibe itens inativos ou ocultos e não cria seções vazias',()=>{
  const out=service().organizarFuncionalidadesPorSecao([item('/os'),{...item('/relatorios'),visivel:false},{...item('/usuarios'),ativo:false}]);
  expect(out.map((s:any)=>s.titulo)).toEqual(['OS']);expect(MENU_SECTIONS).toHaveLength(8);
 });
 it('ordena funcionalidades pelo nome, sem prioridade de fluxo ou subgrupo',()=>{
  const out=service().organizarFuncionalidadesPorSecao([
   {...item('/os'),nome:'Zebra',posicao:0},
   {...item('/hangar'),nome:'Águia',posicao:99},
   {...item('/os/fluxo'),nome:'banana',posicao:1}
  ]);
  expect(out[0].funcionalidades.map((f:any)=>f.nome)).toEqual(['Águia','banana','Zebra']);
 });
 it('ordena seções pelo título traduzido exibido',()=>{
  const s=service();
  s.i18n.translateMenuSecao=(key:string)=>({OS:'Z Ordens',CADASTRO:'Á Cadastros',RNC:'B Não conformidades'}[key]||key);
  const out=s.organizarFuncionalidadesPorSecao([item('/os'),item('/usuarios'),item('/nrc')]);
  expect(out.map((section:any)=>section.titulo)).toEqual(['CADASTRO','RNC','OS']);
 });
 it('ordena nomes traduzidos mesmo entre os antigos subgrupos',()=>{
  const s=service();
  s.i18n.translateMenuFunc=(code:string)=>({PESSOAS:'Á Pessoas',PRODUTOS:'Z Produtos'}[code]||code);
  const out=s.organizarFuncionalidadesPorSecao([item('/products','Cadastro','PRODUTOS'),item('/usuarios','Cadastro','PESSOAS')]);
  expect(out[0].funcionalidades.map((f:any)=>f.codigo)).toEqual(['PESSOAS','PRODUTOS']);
 });
 it('abre Administração para rotas específicas dentro do prefixo OS',()=>{
  const secoes=[{id:'os',funcionalidades:[item('/os'),item('/os/fluxo')]},{id:'administracao',funcionalidades:[item('/os/fluxo/estacoes')]}];
  expect(activeMenuSection('/os/fluxo/estacoes?teste=1',secoes)).toBe('administracao');
  expect(activeMenuSection('/os/fluxo/os/2371',secoes)).toBe('os');
 });
});
it('normaliza rotas legadas sem barra inicial',()=>{
 expect(menuOrganization(item('configuracoes')).group).toBe('CONFIGURACAO_INTEGRACOES');
 expect(menuOrganization(item('os')).section).toBe('OS');
});
describe("Cadastros centralizados",()=>{
 it.each(['/products', '/products/new', '/fabricantes', '/fcu', '/associacao-fcu', '/tipos-servico', '/estoque/fornecedores', '/estoque/lotes'])("agrupa %s em Cadastros",r=>expect(menuOrganization(item(r))).toMatchObject({section:"CADASTRO",group:"CADASTROS_PRODUTOS"}));
 it.each(['/usuarios', '/usuarios-externos', '/perfis', '/funcionalidades'])("agrupa %s em Cadastros",r=>expect(menuOrganization(item(r))).toMatchObject({section:"CADASTRO",group:"CADASTROS_PESSOAS"}));
 it.each(['/os/fluxo/estacoes', '/capacidade/hangares'])("agrupa %s em Cadastros",r=>expect(menuOrganization(item(r))).toMatchObject({section:"CADASTRO",group:"CADASTROS_ESTRUTURA"}));
 it.each(['/publicacoes-tecnicas/cadastro', '/publicacoes-tecnicas/associar-pn'])("agrupa %s em Cadastros",r=>expect(menuOrganization(item(r))).toMatchObject({section:"CADASTRO",group:"CADASTROS_DOCUMENTOS"}));
 it("mantém controle de acesso em Administração",()=>expect(menuOrganization(item("/controle-acesso")).section).toBe("ADMINISTRACAO"));
});

describe('Comercial sem Aero Studio', () => {
 it('restaura Arquivos Tipo Serviço e Página inicial e corrige rotas antigas', () => {
  const s = service();
  const out = s.organizarFuncionalidadesPorSecao(s.normalizeMenuRoutes([
   item('/tpfiles', 'Cadastro', 'ARQUIVOS_TIPO_SERVICO'),
   item('/', 'Principal', 'DASHBOARD', 2),
   item('/test', 'Sistema', 'CONFIGURACOES', 3),
   item('/publicacoes-tecnicas', 'Documentos', 'PUBLICACOES_TECNICAS', 4)
  ]));
  expect(out.flatMap((section:any) => section.funcionalidades).map((f:any) => f.rota).sort()).toEqual(['/', '/configuracoes', '/publicacoes-tecnicas/cadastro', '/tpfiles']);
 });
 it('remove Não conformidades de menus antigos sem remover RNC', () => {
  const out = service().normalizeCachedMenuSections([{id:'administracao', funcionalidades:[
   item('/conformidade/nao-conformidades', 'Sistema', 'CONFORMIDADE_NC'),
   item('conformidade/nao-conformidades?osId=1', 'Sistema', 'LEGADO', 2),
   item('/nrc', 'RNC', 'NRC_LIST', 3)
  ]}]);
  expect(out.flatMap((section:any) => section.funcionalidades).map((f:any) => f.rota)).toEqual(['/nrc']);
 });
 it('reúne propostas e templates em Comercial', () => {
  for (const route of ['/propostas-comerciais', '/templates-proposta']) {
   expect(menuOrganization(item(route, 'Cadastro')).section).toBe('COMERCIAL');
  }
 });
 it('remove Studio de menus armazenados em sessão', () => {
  const out = service().normalizeCachedMenuSections([{id:'comercial', funcionalidades:[
   item('/studio', 'Comercial', 'STUDIO_MARCA'),
   item('/studio/editor', 'Comercial', 'EDITOR', 2),
   item('/templates-proposta', 'Cadastro', 'TEMPLATES_PROPOSTA', 3)
  ]}]);
  expect(out).toHaveLength(1);
  expect(out[0].titulo).toBe('COMERCIAL');
  expect(out[0].funcionalidades.map((f:any) => f.rota)).toEqual(['/templates-proposta']);
 });
});
