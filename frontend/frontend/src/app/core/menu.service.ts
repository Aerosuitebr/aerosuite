import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, timeout } from 'rxjs';
import { FuncionalidadeService, Funcionalidade } from './funcionalidade.service';
import { AuthService, User } from '../auth/auth.service';
import { canonFuncionalidadeCodigo } from '../auth/permissao.util';
import { MenuItem } from 'primeng/api';
import { slugifyMenuSection } from './i18n/menu-i18n.util';
import { TranslationService } from './translation.service';
import { isPlatformOpsRestrictedRoute } from '../platform-ops/platform-ops-nav.config';

export interface MenuSection {
  id: string;
  titulo: string;
  icone: string;
  ordem: number;
  funcionalidades: Funcionalidade[];
}

const MENU_SESSION_KEY = 'aerosuite_menu_sections_v1';

interface MenuSessionPayload {
  userKey: string;
  sections: MenuSection[];
  savedAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private funcionalidadeService = inject(FuncionalidadeService);
  private authService = inject(AuthService);
  private i18n = inject(TranslationService);

  private cachedMenu$?: Observable<MenuSection[]>;
  private cachedMenuUserKey = '';

  /** Limpa cache (logout / mudança de permissões). */
  invalidateMenuCache(): void {
    this.cachedMenu$ = undefined;
    this.cachedMenuUserKey = '';
    try {
      sessionStorage.removeItem(MENU_SESSION_KEY);
    } catch {
      /* SSR / privacy mode */
    }
  }

  /** Menu pré-calculado no login — exibe sidebar sem aguardar GET /meu-menu. */
  applyLoginMenu(funcionalidades: Funcionalidade[] | undefined | null): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !funcionalidades?.length) {
      return;
    }
    const userKey = this.buildUserMenuKey(currentUser);
    const sections = this.buildMenuSections(funcionalidades);
    this.cachedMenuUserKey = userKey;
    this.cachedMenu$ = of(sections).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.writeSessionMenu(userKey, sections);
  }

  /** Menu imediato a partir do cache de sessão (ex.: reload com token válido). */
  primeMenuFromSessionStorage(): MenuSection[] | null {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return null;
    }
    const userKey = this.buildUserMenuKey(currentUser);
    const sections = this.readSessionMenu(userKey);
    if (!sections?.length) {
      return null;
    }
    this.cachedMenuUserKey = userKey;
    this.cachedMenu$ = of(sections).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return sections;
  }

  /**
   * Carrega o menu dinâmico baseado no perfil do usuário atual (com cache por sessão).
   */
  carregarMenuDinamico(forceRefresh = false): Observable<MenuSection[]> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return of([]);
    }

    const userKey = this.buildUserMenuKey(currentUser);
    if (!forceRefresh && this.cachedMenu$ && this.cachedMenuUserKey === userKey) {
      return this.cachedMenu$;
    }

    if (!forceRefresh) {
      const loginSections = this.sectionsFromLoginPayload(currentUser);
      if (loginSections?.length) {
        this.primeMenuCache(userKey, loginSections);
        return this.cachedMenu$!;
      }

      const sessionSections = this.readSessionMenu(userKey);
      if (sessionSections?.length) {
        this.primeMenuCache(userKey, sessionSections);
        return this.cachedMenu$!;
      }
    }

    const remote$ = this.carregarFuncionalidadesPorUsuario(currentUser).pipe(
      map((funcionalidades) => this.buildMenuSections(funcionalidades)),
      tap((sections) => this.writeSessionMenu(userKey, sections)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.cachedMenuUserKey = userKey;
    this.cachedMenu$ = remote$;

    return this.cachedMenu$;
  }

  private sectionsFromLoginPayload(user: User): MenuSection[] | null {
    if (!user.menuFuncionalidades?.length) {
      return null;
    }
    return this.buildMenuSections(user.menuFuncionalidades);
  }

  private primeMenuCache(userKey: string, sections: MenuSection[]): void {
    this.cachedMenuUserKey = userKey;
    this.cachedMenu$ = of(sections).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.writeSessionMenu(userKey, sections);
  }

  private buildMenuSections(funcionalidades: Funcionalidade[]): MenuSection[] {
    let merged = this.ensureConsultaTrocasEventuaisMenuItem(funcionalidades);
    merged = this.stripPlatformOpsRoutesFromTenantMenu(merged);
    merged = this.ensureBlingIntegracaoMenuItem(merged);
    merged = this.ensureWhatsAppIntegracaoMenuItem(merged);
    return this.organizarFuncionalidadesPorSecao(merged);
  }

  /** Remove rotas do plano de controle do menu comum (auditoria, backup, organizações). */
  private stripPlatformOpsRoutesFromTenantMenu(funcionalidades: Funcionalidade[]): Funcionalidade[] {
    return funcionalidades.filter(f => !isPlatformOpsRestrictedRoute(f.rota));
  }

  private readSessionMenu(userKey: string): MenuSection[] | null {
    try {
      const raw = sessionStorage.getItem(MENU_SESSION_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as MenuSessionPayload;
      if (parsed.userKey !== userKey || !Array.isArray(parsed.sections) || !parsed.sections.length) {
        return null;
      }
      return parsed.sections;
    } catch {
      return null;
    }
  }

  private writeSessionMenu(userKey: string, sections: MenuSection[]): void {
    if (!sections.length) {
      return;
    }
    try {
      const payload: MenuSessionPayload = { userKey, sections, savedAt: Date.now() };
      sessionStorage.setItem(MENU_SESSION_KEY, JSON.stringify(payload));
    } catch {
      /* quota / privacy mode */
    }
  }

  private buildUserMenuKey(user: User): string {
    const codes = [...(user.funcionalidadeCodigos ?? [])].sort().join('|');
    return `${user.id}:${user.tenantId ?? ''}:${user.perfil?.id ?? ''}:${codes}`;
  }

  /**
   * Se o perfil tem Ordem de Serviço mas o backend ainda não devolveu a nova funcionalidade (DB antigo),
   * injeta o item de menu para a consulta de trocas eventuais.
   */
  private ensureConsultaTrocasEventuaisMenuItem(funcionalidades: Funcionalidade[]): Funcionalidade[] {
    const hasOrdem = funcionalidades.some(
      (f) => canonFuncionalidadeCodigo(f.codigo) === 'ORDEM_SERVICO'
    );
    const hasConsulta = funcionalidades.some(
      (f) => canonFuncionalidadeCodigo(f.codigo) === 'CONSULTA_TROCAS_EVENTUAIS'
    );
    if (!hasOrdem || hasConsulta) {
      return funcionalidades;
    }
    const now = new Date().toISOString();
    return [
      ...funcionalidades,
      {
        id: -90827001,
        nome: this.i18n.translateMenuFunc('CONSULTA_TROCAS_EVENTUAIS', ''),
        descricao: this.i18n.translate('menu.func.CONSULTA_TROCAS_EVENTUAIS.desc'),
        codigo: 'CONSULTA_TROCAS_EVENTUAIS',
        icone: 'pi pi-search',
        rota: '/os/consulta-trocas-eventuais',
        ordem: 11,
        secao: 'Cadastro',
        tipo: 'funcionalidade',
        visivel: true,
        posicao: 9,
        ativo: true,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  /**
   * Centro de organizações: movido para /plataforma (plano de controle).
   * @deprecated mantido vazio — não injetar no menu comum.
   */
  private ensureOrganizacoesPlatformMenuItem(funcionalidades: Funcionalidade[]): Funcionalidade[] {
    return funcionalidades;
  }

  /** Central Bling (CONFIGURACOES + perfil admin). */
  private ensureBlingIntegracaoMenuItem(funcionalidades: Funcionalidade[]): Funcionalidade[] {
    const hasConfig = funcionalidades.some(
      f => canonFuncionalidadeCodigo(f.codigo) === 'CONFIGURACOES'
    );
    if (!hasConfig) {
      return funcionalidades;
    }
    if (funcionalidades.some(f => (f.rota || '').toLowerCase() === '/integracoes/bling')) {
      return funcionalidades;
    }
    const now = new Date().toISOString();
    return [
      ...funcionalidades,
      {
        id: -99002001,
        nome: this.i18n.translateMenuFunc('INTEGRACAO_BLING', ''),
        descricao: this.i18n.translate('menu.func.INTEGRACAO_BLING.desc'),
        codigo: 'INTEGRACAO_BLING',
        icone: 'pi pi-link',
        rota: '/integracoes/bling',
        ordem: 3,
        secao: 'Comercial',
        tipo: 'funcionalidade',
        visivel: true,
        posicao: 3,
        ativo: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  /** Central WhatsApp (CONFIGURACOES + perfil admin). */
  private ensureWhatsAppIntegracaoMenuItem(funcionalidades: Funcionalidade[]): Funcionalidade[] {
    const hasConfig = funcionalidades.some(
      f => canonFuncionalidadeCodigo(f.codigo) === 'CONFIGURACOES'
    );
    if (!hasConfig) {
      return funcionalidades;
    }
    if (funcionalidades.some(f => (f.rota || '').toLowerCase() === '/integracoes/whatsapp')) {
      return funcionalidades;
    }
    const now = new Date().toISOString();
    return [
      ...funcionalidades,
      {
        id: -99002002,
        nome: this.i18n.translateMenuFunc('INTEGRACAO_WHATSAPP', ''),
        descricao: this.i18n.translate('menu.func.INTEGRACAO_WHATSAPP.desc'),
        codigo: 'INTEGRACAO_WHATSAPP',
        icone: 'pi pi-whatsapp',
        rota: '/integracoes/whatsapp',
        ordem: 4,
        secao: 'Comercial',
        tipo: 'funcionalidade',
        visivel: true,
        posicao: 4,
        ativo: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  /**
   * Carrega funcionalidades do menu via backend ({@code /meu-menu}: perfil + delegações).
   */
  private carregarFuncionalidadesPorUsuario(user: User): Observable<Funcionalidade[]> {
    return this.funcionalidadeService.listarMeuMenu().pipe(
      timeout(12_000),
      catchError(() => of([] as Funcionalidade[]))
    );
  }

  /**
   * Organiza as funcionalidades por seção baseado na posição/ordem
   */
  private organizarFuncionalidadesPorSecao(funcionalidades: Funcionalidade[]): MenuSection[] {
    const secoesMap = new Map<string, MenuSection>();

    const funcionalidadesAtivas = funcionalidades.filter(f => {
      const tipo = (f.tipo || 'funcionalidade').toLowerCase();
      const codigo = canonFuncionalidadeCodigo(f.codigo);
      const rota = (f.rota || '').trim().toLowerCase();
      return (
        f.ativo &&
        f.visivel &&
        tipo !== 'secao' &&
        codigo !== 'DASHBOARD' &&
        codigo !== 'VIEW_DASHBOARD' &&
        rota !== '/' &&
        canonFuncionalidadeCodigo(f.codigo) !== 'TPFILES' &&
        (f.rota == null || f.rota.toLowerCase() !== '/tpfiles')
      );
    });

    funcionalidadesAtivas.forEach(funcionalidade => {
      const secaoSlug = slugifyMenuSection(funcionalidade.secao || 'Sistema');

      if (!secoesMap.has(secaoSlug)) {
        secoesMap.set(secaoSlug, {
          id: secaoSlug.toLowerCase(),
          titulo: secaoSlug,
          icone: this.getIconeSecaoPorSlug(secaoSlug),
          ordem: 0,
          funcionalidades: []
        });
      }

      secoesMap.get(secaoSlug)!.funcionalidades.push(funcionalidade);
    });

    const secoes = Array.from(secoesMap.values()).filter((s) => s.funcionalidades.length > 0);
    this.sortSecoesAlfabeticamente(secoes);
    secoes.forEach(secao => this.sortFuncionalidadesAlfabeticamente(secao.funcionalidades));

    return secoes;
  }

  /** Reaplica ordem alfabética de secções e itens (ex.: após mudança de idioma). */
  ordenarSecoesMenu(secoes: MenuSection[]): MenuSection[] {
    const ordenadas = secoes.map(secao => ({
      ...secao,
      funcionalidades: [...secao.funcionalidades]
    }));
    this.sortSecoesAlfabeticamente(ordenadas);
    ordenadas.forEach(secao => this.sortFuncionalidadesAlfabeticamente(secao.funcionalidades));
    return ordenadas;
  }

  private menuCollator(): Intl.Collator {
    return new Intl.Collator(this.i18n.getCurrentLanguage(), {
      sensitivity: 'base',
      numeric: true
    });
  }

  private sortSecoesAlfabeticamente(secoes: MenuSection[]): void {
    const collator = this.menuCollator();
    secoes.sort((a, b) =>
      collator.compare(
        this.i18n.translateMenuSecao(a.titulo),
        this.i18n.translateMenuSecao(b.titulo)
      )
    );
  }

  private sortFuncionalidadesAlfabeticamente(funcionalidades: Funcionalidade[]): void {
    const collator = this.menuCollator();
    funcionalidades.sort((a, b) =>
      collator.compare(
        this.i18n.translateMenuFunc(a.codigo, a.nome),
        this.i18n.translateMenuFunc(b.codigo, b.nome)
      )
    );
  }

  converterParaMenuItem(secoes: MenuSection[]): MenuItem[] {
    return secoes.map(secao => ({
      label: secao.titulo,
      icon: secao.icone,
      items: secao.funcionalidades.map(func => ({
        label: func.nome,
        icon: func.icone || 'pi pi-circle',
        routerLink: func.rota || `/${func.codigo}`,
        tooltip: func.descricao,
        badge: func.tipo === 'submenu' ? '+' : undefined
      }))
    }));
  }

  private getIconeSecaoPorSlug(secaoSlug: string): string {
    const iconesMap: Record<string, string> = {
      PRINCIPAL: 'pi pi-home',
      CADASTRO: 'pi pi-building',
      DOCUMENTOS: 'pi pi-file',
      SISTEMA: 'pi pi-cog',
      CONTROLE_DE_ACESSO: 'pi pi-shield',
      RELATORIOS: 'pi pi-chart-bar',
      CONFIGURACOES: 'pi pi-wrench',
      COMERCIAL: 'pi pi-briefcase',
      SUPORTE: 'pi pi-headphones',
      PUBLICACOES_TECNICAS: 'pi pi-book',
      ADMINISTRACAO: 'pi pi-briefcase',
      OPERACIONAL: 'pi pi-list-check',
      GESTAO: 'pi pi-briefcase',
      ESTOQUE: 'pi pi-box',
      ACOES_RAPIDAS: 'pi pi-bolt',
      COMUNICACAO: 'pi pi-comments',
      VITRINE: 'pi pi-video'
    };

    return iconesMap[secaoSlug] || 'pi pi-circle';
  }

  temPermissao(funcionalidadeCodigo: string): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return of(false);
    }

    const codes = currentUser.funcionalidadeCodigos;
    if (codes?.length) {
      const target = canonFuncionalidadeCodigo(funcionalidadeCodigo);
      return of(codes.some((c) => canonFuncionalidadeCodigo(c) === target));
    }

    return this.carregarFuncionalidadesPorUsuario(currentUser).pipe(
      map((funcionalidades) => {
        const merged = this.ensureConsultaTrocasEventuaisMenuItem(funcionalidades);
        return merged.some((f) => f.codigo === funcionalidadeCodigo && f.ativo);
      })
    );
  }

  carregarFuncionalidadesUsuario(): Observable<Funcionalidade[]> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return of([]);
    }

    return this.funcionalidadeService
      .listarMeuMenu()
      .pipe(map((list) => this.ensureConsultaTrocasEventuaisMenuItem(list)));
  }
}
