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
    api: { criarEstacao: vi.fn(() => of(dados)), renomearEstacao: vi.fn(() => of(dados)), excluirEstacao: vi.fn(() => of(dados)) },
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
