import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { OsFluxoEstacoesComponent } from './os-fluxo-estacoes.component';

const estacao = { codigo: 'OFICINA-1', nome: 'Oficina 1', setor: 'Oficina', etapas: ['Montagem'], maquinas: 1 };
const dados = { setores: ['Oficina', 'Recebimento'], estacoes: [estacao], maquinas: [] };

function tela(): any {
  const componente = Object.create(OsFluxoEstacoesComponent.prototype);
  Object.assign(componente, {
    buscaEstacao: '', dados, toast: { add: vi.fn() },
    api: { historicoEstacao: vi.fn(()=>of([])), criarEstacao: vi.fn(() => of(dados)), renomearEstacao: vi.fn(() => of(dados)), excluirEstacao: vi.fn(() => of(dados)) },
    salvandoEstacao: false, excluindoEstacao: false
  });
  return componente;
}

describe('Gestão de estações', () => {
  it('edita o nome em um rascunho e permite cancelar sem salvar', () => {
    const c = tela();
    c.editarNome(estacao);
    c.nomeRascunho = 'Outra bancada';
    expect(estacao.nome).toBe('Oficina 1');
    c.cancelarNome();
    expect(c.editandoNome).toBeNull();
    expect(c.api.renomearEstacao).not.toHaveBeenCalled();
  });

  it('mantém o rascunho e a edição abertos quando salvar o nome falha', () => {
    const c = tela();
    c.editarNome(estacao);
    c.nomeRascunho = ' Nova bancada ';
    c.api.renomearEstacao.mockReturnValue(throwError(() => ({ error: { mensagem: 'Sem conexão' } })));
    c.salvarNome(estacao);
    expect(c.api.renomearEstacao).toHaveBeenCalledWith('OFICINA-1', 'Nova bancada');
    expect(c.editandoNome).toBe('OFICINA-1');
    expect(c.nomeRascunho).toBe(' Nova bancada ');
    expect(c.erroNome).toBe('Sem conexão');
    expect(c.salvandoNome).toBe(false);
  });

  it('fecha a edição depois da confirmação do servidor e ignora nomes inalterados', () => {
    const c = tela();
    c.editarNome(estacao);
    c.salvarNome(estacao);
    expect(c.api.renomearEstacao).not.toHaveBeenCalled();
    c.editarNome(estacao);
    c.nomeRascunho = 'Nome novo';
    c.salvarNome(estacao);
    expect(c.editandoNome).toBeNull();
    expect(c.salvandoNome).toBe(false);
  });

  it('abre o pareamento com a estação escolhida e limpa a seleção na abertura geral', () => {
    const c = tela();
    c.abrirPareamento(estacao.codigo);
    expect(c.parEstacao).toBe(estacao.codigo);
    expect(c.mostrarPareamento).toBe(true);
    c.abrirPareamento();
    expect(c.parEstacao).toBeNull();
  });

  it('o menu pede confirmação para excluir e não envia exclusão diretamente', () => {
    const c = tela();
    c.prepararAcoes(estacao);
    c.acoesEstacao.find((a: any) => a.icon === 'pi pi-trash').command();
    expect(c.mostrarExcluirEstacao).toBe(true);
    expect(c.estacaoParaExcluir).toBe(estacao);
    expect(c.api.excluirEstacao).not.toHaveBeenCalled();
  });

  it('cria uma estação com setor e atualiza a lista após salvar', () => {
    const c = tela();
    c.abrirEstacao();
    c.estacaoNome = ' Nova bancada ';
    c.estacaoSetor = 'Oficina';
    c.salvarEstacao();
    expect(c.api.criarEstacao).toHaveBeenCalledWith('Nova bancada', 'Oficina');
    expect(c.mostrarEstacao).toBe(false);
    expect(c.opcoesSetor).toEqual(['Oficina', 'Recebimento']);
  });

  it('isola o rascunho de edição e salva apenas ao confirmar', () => {
    const c = tela();
    c.abrirEstacao(estacao);
    c.estacaoNome = 'Novo nome';
    expect(estacao.nome).toBe('Oficina 1');
    expect(c.api.renomearEstacao).not.toHaveBeenCalled();
    c.salvarEstacao();
    expect(c.api.renomearEstacao).toHaveBeenCalledWith('OFICINA-1', 'Novo nome');
  });

  it('solicita confirmação antes de excluir e mantém a modal aberta em falhas', () => {
    const c = tela();
    c.pedirExclusaoEstacao({ ...estacao, maquinas: 0 });
    expect(c.api.excluirEstacao).not.toHaveBeenCalled();
    expect(c.exclusaoConfirmada).toBe(false);
    c.confirmacaoExclusao = estacao.nome;
    c.api.excluirEstacao.mockReturnValue(throwError(() => ({ error: { mensagem: 'Falha ao excluir' } })));
    c.excluirEstacao();
    expect(c.mostrarExcluirEstacao).toBe(true);
    expect(c.erroExclusao).toBe('Falha ao excluir');
    expect(c.excluindoEstacao).toBe(false);
  });

  it('bloqueia exclusão com máquinas mesmo quando o nome foi confirmado', () => {
    const c = tela();
    c.pedirExclusaoEstacao(estacao);
    c.confirmacaoExclusao = estacao.nome;
    c.excluirEstacao();
    expect(c.exclusaoConfirmada).toBe(false);
    expect(c.api.excluirEstacao).not.toHaveBeenCalled();
  });

  it('omite setores redundantes e mantém o setor de nomes personalizados', () => {
    const c = tela();
    expect(c.mostrarSetor(estacao)).toBe(false);
    expect(c.mostrarSetor({ ...estacao, nome: ' OFICINA ' })).toBe(false);
    expect(c.mostrarSetor({ ...estacao, nome: 'Bancada de motores' })).toBe(true);
  });

  it('conta estações sem máquina a partir dos dados reais', () => {
    const c = tela();
    expect(c.estacoesSemVinculo).toBe(0);
    c.dados = { ...dados, estacoes: [{ ...estacao, maquinas: 0 }, estacao] };
    expect(c.estacoesSemVinculo).toBe(1);
  });

  it('busca por nome, setor e etapa sem alterar a lista original', () => {
    const c = tela();
    c.buscaEstacao = 'montagem';
    expect(c.estacoesFiltradas).toEqual([estacao]);
    c.buscaEstacao = 'inexistente';
    expect(c.estacoesFiltradas).toEqual([]);
    expect(c.dados.estacoes).toHaveLength(1);
  });
});

describe('Painel operacional de estações', () => {
 it('combina busca e filtro de vínculo, calculando cobertura real', () => {
  const c=tela();c.dados={maquinas:[],estacoes:[estacao,{...estacao,codigo:'R-1',nome:'Recebimento',setor:'Recebimento',maquinas:0}]};c.filtroVinculo='sem';
  expect(c.estacoesFiltradas.map((e:any)=>e.codigo)).toEqual(['R-1']);expect(c.cobertura).toBe(50);
  c.buscaEstacao='Oficina';expect(c.estacoesFiltradas).toHaveLength(0);c.limparBusca();expect(c.estacoesFiltradas).toHaveLength(2);
 });
 it('abre transferência em rascunho sem alterar o vínculo persistido', () => {
  const c=tela();const m={terminalId:'T1',estacaoCodigo:'OUTRA',apelido:'Tablet',ativa:true};c.maquinaDrag=m;c.edicao={T1:{estacaoCodigo:'OUTRA',apelido:'Tablet'}};c.abrirMaquina=vi.fn();
  c.soltarMaquina({preventDefault:vi.fn()},estacao);expect(c.abrirMaquina).toHaveBeenCalledWith(m);expect(c.edicao.T1.estacaoCodigo).toBe(estacao.codigo);expect(m.estacaoCodigo).toBe('OUTRA');expect(c.maquinaDrag).toBeNull();
 });
});


describe('Visão orientada a exceções', () => {
 it('prioriza estações sem máquina e combina setor com busca por usuário', () => {
  const c=tela();const livre={...estacao,codigo:'L',nome:'Livre',maquinas:0};const m={terminalId:'TERM-1',apelido:'Bancada',usuarioNome:'Ana',estacaoCodigo:estacao.codigo};
  c.dados={estacoes:[estacao,livre],maquinas:[m]};c.maquinasPorEstacao={[estacao.codigo]:[m]};
  expect(c.estacoesFiltradas[0].codigo).toBe('L');c.buscaEstacao='Ana';expect(c.estacoesFiltradas.map((e:any)=>e.codigo)).toEqual([estacao.codigo]);c.setorFiltro='Expedição';expect(c.estacoesFiltradas).toHaveLength(0);
 });
 it('busca máquinas pelo usuário e retorna apenas o último acesso registrado', () => {
  const c=tela();const ms=[{terminalId:'T1',usuarioNome:'Ana',estacaoCodigo:estacao.codigo,ultimoAcesso:'2026-10-28T10:00:00'},{terminalId:'T2',usuarioNome:'Bia',estacaoCodigo:estacao.codigo,ultimoAcesso:'2026-10-29T09:00:00'}];
  c.dados={estacoes:[estacao],maquinas:ms};c.maquinasPorEstacao={[estacao.codigo]:ms};c.buscaMaquina='Ana';expect(c.maquinasFiltradas.map((m:any)=>m.terminalId)).toEqual(['T1']);expect(c.ultimoAcessoEstacao(estacao.codigo)).toBe('2026-10-29T09:00:00');expect(c.ultimoAcessoEstacao('VAZIA')).toBeNull();
 });
});

describe('Aprovação e monitoramento de vínculos', () => {
 it('exige salvar a estação e o nome antes de aprovar sem código', () => {
  const c=tela();const m={terminalId:'T1',userAgent:'Chrome',usuarioNome:'Ana'};
  c.api.aprovarMaquina=vi.fn(()=>of(dados));c.api.atualizarMaquina=vi.fn();c.edicao={};
  c.selecionarPendente(m);expect(c.aprovandoPendente).toBe(true);expect(c.api.aprovarMaquina).not.toHaveBeenCalled();
  c.edicao.T1={estacaoCodigo:estacao.codigo,apelido:'Bancada'};c.salvarMaquina(c.maquinaEmEdicao);
  expect(c.api.aprovarMaquina).toHaveBeenCalledWith('T1',estacao.codigo,'Bancada');expect(c.api.atualizarMaquina).not.toHaveBeenCalled();
 });
 it('mantém o rascunho quando a aprovação expira', () => {
  const c=tela();c.api.aprovarMaquina=vi.fn(()=>throwError(()=>({error:{mensagem:'Solicitação expirada'}})));c.edicao={};
  c.selecionarPendente({terminalId:'T1'});c.edicao.T1={estacaoCodigo:estacao.codigo,apelido:'Bancada'};c.salvarMaquina(c.maquinaEmEdicao);
  expect(c.mostrarEditarMaquina).toBe(true);expect(c.erroMaquina).toBe('Solicitação expirada');expect(c.salvandoMaquina).toBeNull();
 });
 it('não reinventa tempo anterior e só classifica como crítico depois de 24h observadas', () => {
  const c=tela();expect(c.tempoSemVinculo(estacao)).toBe('Tempo anterior não registrado');
  const e={...estacao,maquinas:0,semVinculoDesde:new Date(Date.now()-25*3600000).toISOString()};
  expect(c.semVinculoCritico(e)).toBe(true);expect(c.semVinculoCritico({...e,maquinas:1})).toBe(false);expect(c.semVinculoCritico({...e,semVinculoDesde:new Date().toISOString()})).toBe(false);
 });
 it('distingue vínculo ativo de sinal recente', () => {
  const c=tela();expect(c.presencaMaquina({ativa:true,ultimoAcesso:new Date().toISOString()})).toContain('Sinal recente');expect(c.sinalRecente({ativa:true,ultimoAcesso:new Date(Date.now()-10*60000).toISOString()})).toBe(true);expect(c.sinalRecente({ativa:true,ultimoAcesso:new Date(Date.now()-16*60000).toISOString()})).toBe(false);expect(c.presencaMaquina({ativa:true,ultimoAcesso:'2020-01-01T00:00:00'})).toBe('Sem sinal recente');expect(c.presencaMaquina({ativa:false})).toBe('Vínculo inativo');
 });
 it('classifica a idade do vínculo e coloca o mais antigo primeiro', () => {
  const c=tela();
  const recente={...estacao,codigo:'R',nome:'Recente',maquinas:0,semVinculoDesde:new Date(Date.now()-2*60000).toISOString()};
  const hora={...estacao,codigo:'H',nome:'Hora',maquinas:0,semVinculoDesde:new Date(Date.now()-90*60000).toISOString()};
  const turno={...estacao,codigo:'T',nome:'Turno',maquinas:0,semVinculoDesde:new Date(Date.now()-9*3600000).toISOString()};
  const antiga={...estacao,codigo:'A',nome:'Antiga',maquinas:0,semVinculoDesde:new Date(Date.now()-30*3600000).toISOString()};
  c.dados={estacoes:[recente,hora,antiga,turno,estacao],maquinas:[]};c.maquinasPorEstacao={};
  expect(c.nivelEstacao(recente)).toBe('fresh');
  expect(c.nivelEstacao({...estacao,maquinas:0,semVinculoDesde:new Date(Date.now()-20*60000).toISOString()})).toBe('watch');
  expect(c.nivelEstacao(hora)).toBe('hour');
  expect(c.nivelEstacao(turno)).toBe('shift');
  expect(c.nivelEstacao(antiga)).toBe('critical');
  expect(c.estacoesFiltradas.map((e:any)=>e.codigo)).toEqual(['A','T','H','R','OFICINA-1']);
  expect(c.etapasVisiveis({...estacao,etapas:['A','B','C','D']})).toEqual(['A','B','C']);
 });
 it('resume sinal atrasado, vínculos ativos e aprovações pendentes', () => {
  const c=tela();
  const agora=new Date().toISOString();
  const maquinas=[
    {terminalId:'T1',ativa:true,ultimoAcesso:agora,estacaoCodigo:estacao.codigo},
    {terminalId:'T2',ativa:true,ultimoAcesso:'2020-01-01T00:00:00',estacaoCodigo:estacao.codigo},
    {terminalId:'T3',ativa:false,ultimoAcesso:agora,estacaoCodigo:estacao.codigo}
  ];
  c.dados={estacoes:[estacao],maquinas,pendentes:[{terminalId:'P'}]};
  c.maquinasPorEstacao={[estacao.codigo]:maquinas};
  expect(c.maquinasSemSinalRecente).toBe(1);
  expect(c.vinculosAtivos).toBe(2);
  expect(c.aprovacoesPendentes).toBe(1);
  expect(c.acaoNecessaria).toBe(true);
  expect(c.nivelEstacao(estacao)).toBe('fault');
  c.filtroVinculo='sinal';
  expect(c.estacoesFiltradas.map((e:any)=>e.codigo)).toEqual([estacao.codigo]);
 });
 it('cancela a solicitação pendente e atualiza a lista', () => {
  const c=tela();
  const pendente={terminalId:'P1',usuarioNome:'Elinho'};
  const atualizado={...dados,pendentes:[]};
  c.dados={...dados,pendentes:[pendente]};
  c.api.cancelarSolicitacao=vi.fn(()=>of(atualizado));
  c.cancelarSolicitacao(pendente);
  expect(c.api.cancelarSolicitacao).toHaveBeenCalledWith('P1');
  expect(c.dados.pendentes).toEqual([]);
  expect(c.cancelandoSolicitacao).toBeNull();
  expect(c.toast.add).toHaveBeenCalled();
 });
 it('mostra o erro quando cancelar a solicitação falha', () => {
  const c=tela();
  c.api.cancelarSolicitacao=vi.fn(()=>throwError(()=>({error:{mensagem:'Sem permissão'}})));
  c.cancelarSolicitacao({terminalId:'P1'});
  expect(c.erroDescoberta).toBe('Sem permissão');
  expect(c.cancelandoSolicitacao).toBeNull();
 });
});
