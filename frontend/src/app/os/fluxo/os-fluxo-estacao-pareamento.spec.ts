import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { OsFluxoEstacaoComponent } from './os-fluxo-estacao.component';

function estacao(podeTrocarEstacao: boolean): any {
  const tela = Object.create(OsFluxoEstacaoComponent.prototype);
  Object.assign(tela, {
    podeTrocarEstacao,
    pareamentoConfirmado: false,
    config: { nome: 'Antiga', estacaoCodigo: 'ANTIGA', etapaIds: [1], modo: 'AUTO', som: true },
    etapas: [{ id: 1 }],
    estacoes: [{ codigo: 'ESTACAO', nome: 'Estação', etapaIds: [1] }],
    salvarConfig: vi.fn(), atualizarOpcoesBip: vi.fn(), limparPendencias: vi.fn(),
    iniciarPareamento: vi.fn(), carregarFila: vi.fn(), vincular: vi.fn()
  });
  return tela;
}

describe('Pareamento obrigatório da máquina', () => {
  it.each([true, false])('abre o código sem vínculo, com permissão de gestão = %s', (permissao) => {
    const tela = estacao(permissao);
    tela.resolverEstacao(null, null);
    expect(tela.maquinaBloqueada).toBe(true);
    expect(tela.mostrarConfig).toBe(true);
    expect(tela.modoPareamento).toBe(true);
    expect(tela.iniciarPareamento).toHaveBeenCalledOnce();
    expect(tela.config.estacaoCodigo).toBeNull();
    expect(tela.vincular).not.toHaveBeenCalled();
    expect(tela.carregarFila).not.toHaveBeenCalled();
  });

  it('libera a máquina quando o servidor confirma a estação', () => {
    const tela = estacao(false);
    tela.resolverEstacao('ESTACAO', 'Computador 01');
    expect(tela.maquinaBloqueada).toBe(false);
    expect(tela.config.estacaoCodigo).toBe('ESTACAO');
    expect(tela.config.maquina).toBe('Computador 01');
    expect(tela.carregarFila).toHaveBeenCalledOnce();
    expect(tela.iniciarPareamento).not.toHaveBeenCalled();
  });
});
