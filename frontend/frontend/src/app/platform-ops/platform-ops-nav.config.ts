/** Rotas reservadas ao plano de controle — não aparecem no menu comum do tenant. */
export const PLATFORM_OPS_RESTRICTED_ROUTES = [
  '/organizacoes',
  '/auditoria-acesso',
  '/settings/backup',
  '/plataforma'
] as const;

export function isPlatformOpsRestrictedRoute(rota: string | undefined | null): boolean {
  const path = (rota ?? '').trim().toLowerCase().split('?')[0];
  if (!path) {
    return false;
  }
  return PLATFORM_OPS_RESTRICTED_ROUTES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export interface PlatformOpsNavItem {
  route: string;
  icon: string;
  labelKey: string;
  groupKey: 'platformOps.nav.group.oversight' | 'platformOps.nav.group.management' | 'platformOps.nav.group.infra' | 'platformOps.nav.group.tenants';
}

export const PLATFORM_OPS_NAV: PlatformOpsNavItem[] = [
  {
    route: '/plataforma/console',
    icon: 'pi pi-th-large',
    labelKey: 'platformOps.nav.console',
    groupKey: 'platformOps.nav.group.oversight'
  },
  {
    route: '/plataforma/auditoria',
    icon: 'pi pi-shield',
    labelKey: 'platformOps.nav.audit',
    groupKey: 'platformOps.nav.group.oversight'
  },
  {
    route: '/plataforma/pagamentos',
    icon: 'pi pi-credit-card',
    labelKey: 'platformOps.nav.billing',
    groupKey: 'platformOps.nav.group.management'
  },
  {
    route: '/plataforma/usuarios',
    icon: 'pi pi-users',
    labelKey: 'platformOps.nav.users',
    groupKey: 'platformOps.nav.group.management'
  },
  {
    route: '/plataforma/operadores',
    icon: 'pi pi-verified',
    labelKey: 'platformOps.nav.operators',
    groupKey: 'platformOps.nav.group.management'
  },
  {
    route: '/plataforma/boas-vindas',
    icon: 'pi pi-envelope',
    labelKey: 'platformOps.nav.onboarding',
    groupKey: 'platformOps.nav.group.management'
  },
  {
    route: '/plataforma/backup',
    icon: 'pi pi-database',
    labelKey: 'platformOps.nav.backup',
    groupKey: 'platformOps.nav.group.infra'
  },
  {
    route: '/plataforma/configuracoes-sistema',
    icon: 'pi pi-cog',
    labelKey: 'platformOps.nav.systemSettings',
    groupKey: 'platformOps.nav.group.infra'
  },
  {
    route: '/plataforma/organizacoes',
    icon: 'pi pi-building',
    labelKey: 'platformOps.nav.organizations',
    groupKey: 'platformOps.nav.group.tenants'
  }
];

export const PLATFORM_OPS_NAV_GROUPS: PlatformOpsNavItem['groupKey'][] = [
  'platformOps.nav.group.oversight',
  'platformOps.nav.group.management',
  'platformOps.nav.group.infra',
  'platformOps.nav.group.tenants'
];
