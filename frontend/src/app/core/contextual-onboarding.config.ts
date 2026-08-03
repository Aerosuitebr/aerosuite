export interface ContextualOnboardingTip {
  id: string;
  routePrefix: string;
  titleKey: string;
  bodyKey: string;
  icon?: string;
}

/** Dicas contextuais por rota (primeira visita até o usuário dispensar). */
export const CONTEXTUAL_ONBOARDING_TIPS: ContextualOnboardingTip[] = [
  {
    id: 'home-flight-deck',
    routePrefix: '/home',
    titleKey: 'onboarding.home.title',
    bodyKey: 'onboarding.home.body',
    icon: 'pi-compass'
  },
  {
    id: 'estoque-itens',
    routePrefix: '/estoque/itens',
    titleKey: 'onboarding.estoqueItens.title',
    bodyKey: 'onboarding.estoqueItens.body',
    icon: 'pi-box'
  },
  {
    id: 'suporte-tickets',
    routePrefix: '/suporte/tickets',
    titleKey: 'onboarding.suporte.title',
    bodyKey: 'onboarding.suporte.body',
    icon: 'pi-headphones'
  }
];
