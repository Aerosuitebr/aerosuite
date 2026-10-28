import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { completeMenuRoutes, MENU_ROUTE_ENTRIES } from './menu-route-entries';
import type { User } from '../auth/auth.service';
import type { Funcionalidade } from './funcionalidade.service';
import { PLATFORM_OPS_NAV } from '../platform-ops/platform-ops-nav.config';

const user = (codes: string[], profile = 'OPERADOR') => ({ id: 1, perfil: { codigo: profile }, funcionalidadeCodigos: codes }) as User;
const source = ts.createSourceFile('routes.ts', readFileSync(new URL('../app.routes.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const tenantRoutes = new Map<string, string>();
function walk(node: ts.Node, prefix = '') {
  if (ts.isObjectLiteralExpression(node)) {
    const props = node.properties.filter(ts.isPropertyAssignment);
    const path = props.find(p => p.name.getText(source) === 'path')?.initializer;
    if (path && ts.isStringLiteral(path)) {
      prefix = `${prefix}/${path.text}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
      if (!tenantRoutes.has(prefix)) tenantRoutes.set(prefix, node.getText(source));
      const children = props.find(p => p.name.getText(source) === 'children')?.initializer;
      if (children) walk(children, prefix === '/' ? '' : prefix);
      return;
    }
  }
  ts.forEachChild(node, child => walk(child, prefix));
}
walk(source);

describe('Menu coverage', () => {
  it('every added destination exists in the router', () => {
    for (const entry of MENU_ROUTE_ENTRIES) {
      const route = tenantRoutes.get(entry.route) || (entry.route.startsWith('/operacoes/') ? tenantRoutes.get('/operacoes/:modulo') : undefined);
      expect(route, entry.route).toBeTruthy();
      for (const code of entry.perm?.funcionalidadesAny || []) expect(route, entry.route).toContain(code);
      for (const code of entry.perm?.funcionalidadesPrefix || []) expect(tenantRoutes.get('/' + entry.route.split('/')[1]), entry.route).toContain(code);
    }
  });
  it('does not add restricted entries for a user without the required permissions', () => {
    const menu = completeMenuRoutes([], user([]));
    expect(menu.some(f => f.rota === '/perfil')).toBe(true);
    expect(menu.some(f => f.rota === '/conformidade/contingencia')).toBe(false);
    expect(menu.some(f => f.rota?.startsWith('/operacoes/'))).toBe(false);
    expect(menu.some(f => f.rota?.startsWith('/plataforma'))).toBe(false);
    expect(completeMenuRoutes([], null)).toEqual([]);
  });
  it('adds screens allowed by existing route permissions without duplicates', () => {
    const original = { id: 3, codigo: 'EXISTENTE', nome: 'Hangar', rota: '/capacidade/hangares', ativo: true, visivel: true } as Funcionalidade;
    const menu = completeMenuRoutes([original], user(['ORDEM_SERVICO', 'GERENCIAR_PERMISSOES', 'ESTOQUE_ITENS']));
    expect(menu.filter(f => f.rota === original.rota)).toEqual([original]);
    expect(menu.some(f => f.rota === '/associacao-usuario-perfil')).toBe(true);
    expect(menu.some(f => f.rota === '/estoque/rastreio-saidas-automaticas')).toBe(true);
    expect(menu.some(f => f.rota === '/conformidade/contingencia')).toBe(true);
  });
  it('covers every operational submodule', () => {
    const menu = completeMenuRoutes([], user(['CENTRAL_OPERACIONAL']));
    for (const slug of ['impedimentos','materiais','compras','prontidao','planejamento','ferramentas','retornos']) expect(menu.some(f => f.rota === `/operacoes/${slug}`)).toBe(true);
  });
  it('keeps onboarding discoverable in the control-plane menu and every link valid', () => {
    expect(PLATFORM_OPS_NAV.some(item => item.route === '/plataforma/boas-vindas')).toBe(true);
    for (const item of PLATFORM_OPS_NAV) expect(tenantRoutes.has(item.route), item.route).toBe(true);
  });
});
