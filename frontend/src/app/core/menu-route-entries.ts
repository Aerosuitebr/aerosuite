import type { User } from '../auth/auth.service';
import { passesPermissaoRota, type PermissaoRota } from '../auth/permissao.util';
import type { Funcionalidade } from './funcionalidade.service';

/** Entradas de telas sem cadastro próprio; usam exatamente as permissões de suas rotas. */
export const MENU_ROUTE_ENTRIES: { route: string; code: string; name: string; section: string; icon: string; perm?: PermissaoRota }[] = [
  { route: '/', code: 'DASHBOARD', name: 'Página inicial', section: 'Administração', icon: 'pi pi-home' },
  { route: '/perfil', code: 'MENU_PERFIL', name: 'Meu perfil', section: 'Administração', icon: 'pi pi-user' },
  { route: '/os/carga-mecanicos', code: 'MENU_CARGA_MECANICOS', name: 'Carga dos mecânicos', section: 'Oficina', icon: 'pi pi-calendar' },
  { route: '/billing', code: 'MENU_BILLING', name: 'Assinatura e faturamento', section: 'Administração', icon: 'pi pi-credit-card' },
  { route: '/privacidade-dados', code: 'MENU_PRIVACIDADE', name: 'Privacidade e dados', section: 'Administração', icon: 'pi pi-shield' },
  { route: '/capacidade/hangares', code: 'MENU_HANGARES', name: 'Hangares e recursos', section: 'Cadastro', icon: 'pi pi-building', perm: { funcionalidadesAny: ['QUADRO_CAPACIDADE', 'ORDEM_SERVICO'] } },
  { route: '/associacao-usuario-perfil', code: 'MENU_ASSOCIACAO_PERFIL', name: 'Associação de usuários e perfis', section: 'Cadastro', icon: 'pi pi-users', perm: { funcionalidadesAny: ['USUARIOS', 'GERENCIAR_PERMISSOES'] } },
  { route: '/consulta-funcionalidades-usuario', code: 'MENU_CONSULTA_PERMISSOES', name: 'Consulta de permissões por usuário', section: 'Cadastro', icon: 'pi pi-search', perm: { funcionalidadesAny: ['GERENCIAR_PERMISSOES', 'USUARIOS'] } },
  { route: '/conformidade/contingencia', code: 'MENU_CONTINGENCIA', name: 'Contingência e reconciliação', section: 'Administração', icon: 'pi pi-sync', perm: { funcionalidadesAny: ['CONFORMIDADE_PAINEL', 'CONFORMIDADE_NC', 'GERENCIAR_PERMISSOES', 'DOSSIE_AUDITORIA'] } },
  { route: '/conformidade/releases', code: 'MENU_RELEASES', name: 'Aceite de versões', section: 'Administração', icon: 'pi pi-check-circle', perm: { funcionalidadesAny: ['CONFORMIDADE_PAINEL', 'GERENCIAR_PERMISSOES', 'DOSSIE_AUDITORIA'] } },
  { route: '/propostas-comerciais/cco-emails', code: 'MENU_CCO_EMAILS', name: 'E-mails em cópia de propostas', section: 'Comercial', icon: 'pi pi-envelope', perm: { funcionalidadesAny: ['propostas-comerciais'] } },
  { route: '/estoque/rastreio-saidas-automaticas', code: 'MENU_RASTREIO_SAIDAS', name: 'Rastreio de saídas automáticas', section: 'Estoque', icon: 'pi pi-history', perm: { funcionalidadesPrefix: ['ESTOQUE'] } },
  ...[
    ['impedimentos', 'Impedimentos', 'pi pi-bolt'], ['materiais', 'Materiais e reservas', 'pi pi-box'],
    ['compras', 'Compras operacionais', 'pi pi-shopping-cart'], ['prontidao', 'Prontidão da OS', 'pi pi-check-circle'],
    ['planejamento', 'Planejamento operacional', 'pi pi-calendar'], ['ferramentas', 'Ferramentas', 'pi pi-wrench'],
    ['retornos', 'Reincidências e retornos', 'pi pi-history']
  ].map(([slug, name, icon]) => ({ route: `/operacoes/${slug}`, code: `MENU_OPERACOES_${slug.toUpperCase()}`, name, icon, section: 'Oficina', perm: { funcionalidadesAny: ['CENTRAL_OPERACIONAL', 'CUSTOS_OPERACIONAIS'] } }))
];

export function completeMenuRoutes(items: Funcionalidade[], user: User | null): Funcionalidade[] {
  if (!user) return items;
  const routes = new Set(items.filter(item => item.ativo && item.visivel).map(item => (item.rota || '').replace(/\/+$/, '') || '/'));
  const additions = MENU_ROUTE_ENTRIES.filter(entry => !routes.has(entry.route.replace(/\/+$/, '') || '/') && passesPermissaoRota(user, entry.perm));
  return [...items, ...additions.map(entry => ({
    id: -920000 - MENU_ROUTE_ENTRIES.indexOf(entry), codigo: entry.code, nome: entry.name, rota: entry.route,
    secao: entry.section, icone: entry.icon, ativo: true, visivel: true, tipo: 'funcionalidade' as const,
    posicao: 500, createdAt: '', updatedAt: ''
  }))];
}
