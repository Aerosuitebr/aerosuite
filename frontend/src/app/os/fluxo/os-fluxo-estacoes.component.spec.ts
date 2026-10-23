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
    c.pedirExclusaoEstacao(estacao);
    expect(c.api.excluirEstacao).not.toHaveBeenCalled();
    expect(c.estacaoParaExcluir.maquinas).toBe(1);
    c.api.excluirEstacao.mockReturnValue(throwError(() => ({ error: { mensagem: 'Falha ao excluir' } })));
    c.excluirEstacao();
    expect(c.mostrarExcluirEstacao).toBe(true);
    expect(c.erroExclusao).toBe('Falha ao excluir');
    expect(c.excluindoEstacao).toBe(false);
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
