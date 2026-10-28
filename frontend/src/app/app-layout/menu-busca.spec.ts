import { describe, expect, it } from 'vitest';
import { buscarFuncionalidades } from './menu-busca';
import type { MenuSection } from '../core/menu.service';
import type { Funcionalidade } from '../core/funcionalidade.service';
const item = (id: number, nome: string, extra = {}): Funcionalidade => ({ id, nome, codigo: 'F_' + id, secao: 'Sistema', tipo: 'funcionalidade', ativo: true, visivel: true, posicao: 0, createdAt: '', updatedAt: '', ...extra });
const secoes: MenuSection[] = [{ id: 'oficina', titulo: 'Oficina', icone: '', ordem: 0, funcionalidades: [
  item(1, 'Estação de bipagem'), item(2, 'Usuários'), item(3, 'Perfis de acesso'),
  item(4, 'Ordens de serviço'), item(5, 'Relatórios', { descricao: 'Consultar indicadores de desempenho' })
]}];
describe('busca do menu Bellows', () => {
  it('ignora acentos e caixa e destaca o texto original', () => {
    const r = buscarFuncionalidades('ESTACAO', secoes);
    expect(r[0].func.id).toBe(1);
    expect(r[0].nome.some(p => p.destaque && p.texto === 'Estação')).toBe(true);
  });
  it('encontra sinônimos de uso diário', () => {
    expect(buscarFuncionalidades('bipar', secoes)[0].func.id).toBe(1);
    expect(buscarFuncionalidades('cracha', secoes)[0].func.id).toBe(2);
  });
  it('tolera um erro de digitação', () => expect(buscarFuncionalidades('usuariso', secoes)[0].func.id).toBe(2));
  it('explica correspondências na descrição', () => expect(buscarFuncionalidades('indicadores', secoes)[0].descricao?.some(p => p.destaque)).toBe(true));
  it('prioriza nomes sobre correspondências na seção', () => {
    const data = [{ ...secoes[0], titulo: 'Usuários' }];
    expect(buscarFuncionalidades('usuarios', data)[0].func.id).toBe(2);
  });
  it('não inclui módulos fora do catálogo permitido e respeita o limite', () => {
    expect(buscarFuncionalidades('backup', secoes)).toEqual([]);
    expect(buscarFuncionalidades('oficina', secoes, 2)).toHaveLength(2);
    expect(buscarFuncionalidades('  ', secoes)).toEqual([]);
  });
});
