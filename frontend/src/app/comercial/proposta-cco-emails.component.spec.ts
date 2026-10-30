import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PropostaCcoEmailService } from '../core/proposta-cco-email.service';
import { PropostaCcoEmailsComponent } from './proposta-cco-emails.component';

function setup() {
  const users = [
    { email: 'alice@example.test', usuarioNome: 'Alice' },
    { email: 'bob@example.test', usuarioNome: 'Bob' },
  ];
  let saved: any[] = [];
  const api = {
    disponiveis: vi.fn(() => of(users.filter(user => !saved.some(item => item.email === user.email)))),
    listar: vi.fn(() => of([...saved])),
    adicionar: vi.fn((item: any) => { saved.push({ ...item, id: saved.length + 1 }); return of(item); }),
    remover: vi.fn((id: number) => { saved = saved.filter(item => item.id !== id); return of(null); }),
  };
  const injector = Injector.create({ providers: [
    { provide: PropostaCcoEmailService, useValue: api },
    { provide: MessageService, useValue: { add: vi.fn() } },
  ] });
  const component = runInInjectionContext(injector, () => new PropostaCcoEmailsComponent());
  component.recarregar();
  return { component, api };
}
function dragEvent() {
  return {
    preventDefault: vi.fn(),
    currentTarget: { closest: () => null },
    dataTransfer: { setData: vi.fn(), effectAllowed: '', dropEffect: '' },
  } as unknown as DragEvent;
}

describe('Lista CCo: transferência contextual', () => {
  it('seleciona vários usuários e persiste todos com a seta para a direita', () => {
    const { component: c, api } = setup();
    c.disponiveis.forEach(item => c.selecionar(item, 'disponivel', true));
    expect(c.selectionFrom).toBe('disponivel'); expect(c.selecionados.length).toBe(2);
    c.moverSelecionados();
    expect(api.adicionar).toHaveBeenCalledTimes(2); expect(c.cco.length).toBe(2);
    expect(c.disponiveis.length).toBe(0); expect(c.selecionados.length).toBe(0);
  });
  it('inverte a direção e devolve os destinatários selecionados', () => {
    const { component: c, api } = setup();
    c.disponiveis.forEach(item => c.selecionar(item, 'disponivel', true)); c.moverSelecionados();
    c.cco.forEach(item => c.selecionar(item, 'cco', true));
    expect(c.selectionFrom).toBe('cco'); c.moverSelecionados();
    expect(api.remover).toHaveBeenCalledTimes(2); expect(c.cco.length).toBe(0);
    expect(c.disponiveis.length).toBe(2);
  });
  it('arrasta o grupo selecionado em vez de apenas o registro sob o cursor', () => {
    const { component: c, api } = setup();
    c.disponiveis.forEach(item => c.selecionar(item, 'disponivel', true));
    const drag = dragEvent(); c.onDragStart(drag, c.disponiveis[0], 'disponivel');
    c.onDragOver(drag, 'cco'); expect(c.dragTarget).toBe('cco');
    c.onDropCco(drag); expect(api.adicionar).toHaveBeenCalledTimes(2); expect(c.dragTarget).toBeNull();
    c.cco.forEach(item => c.selecionar(item, 'cco', true));
    c.onDragStart(drag, c.cco[0], 'cco'); c.onDropDisponiveis(drag);
    expect(api.remover).toHaveBeenCalledTimes(2);
  });
  it('ao arrastar um registro não selecionado, move somente esse registro', () => {
    const { component: c, api } = setup();
    c.selecionar(c.disponiveis[0], 'disponivel', true);
    c.onDragStart(dragEvent(), c.disponiveis[1], 'disponivel'); c.onDropCco(dragEvent());
    expect(api.adicionar).toHaveBeenCalledTimes(1); expect(c.cco[0].email).toBe('bob@example.test');
  });
  it('mantém a seleção em apenas uma origem e oculta a seta ao desmarcar tudo', () => {
    const { component: c } = setup();
    c.cco = [{ id: 7, email: 'existing@example.test' }];
    c.selecionar(c.disponiveis[0], 'disponivel', true); c.selecionar(c.cco[0], 'cco', true);
    expect(c.disponiveis[0].selected).toBe(false); expect(c.selectionFrom).toBe('cco');
    c.selecionar(c.cco[0], 'cco', false); expect(c.selecionados.length).toBe(0); expect(c.selectionFrom).toBeNull();
  });
  it('ignora drops na própria origem e novas movimentações durante uma gravação', () => {
    const { component: c, api } = setup();
    c.onDragStart(dragEvent(), c.disponiveis[0], 'disponivel'); c.onDropDisponiveis(dragEvent());
    expect(api.adicionar).not.toHaveBeenCalled(); expect(api.remover).not.toHaveBeenCalled();
    c.busy = true; c.moverSelecionados();
    expect(api.adicionar).not.toHaveBeenCalled();
  });
  it('a seta da linha envia somente esse registro e preserva as outras seleções', () => {
    const { component: c, api } = setup();
    c.disponiveis.forEach(item => c.selecionar(item, 'disponivel', true));
    c.moverItem(c.disponiveis[0], 'disponivel');
    expect(api.adicionar).toHaveBeenCalledTimes(1);
    expect(c.cco[0].email).toBe('alice@example.test');
    expect(c.selecionados.map(item => item.email)).toEqual(['bob@example.test']);
    expect(c.selectionFrom).toBe('disponivel');
  });
  it('a seta da linha retira somente esse destinatário e mantém os demais selecionados', () => {
    const { component: c, api } = setup();
    c.disponiveis.forEach(item => c.selecionar(item, 'disponivel', true)); c.moverSelecionados();
    c.cco.forEach(item => c.selecionar(item, 'cco', true));
    c.moverItem(c.cco[0], 'cco');
    expect(api.remover).toHaveBeenCalledTimes(1);
    expect(c.selecionados.map(item => item.email)).toEqual(['bob@example.test']);
    expect(c.selectionFrom).toBe('cco');
  });
  it('a ação individual não envia registros desmarcados ou de outra origem', () => {
    const { component: c, api } = setup();
    c.moverItem(c.disponiveis[0], 'disponivel');
    c.selecionar(c.disponiveis[0], 'disponivel', true);
    c.moverItem(c.disponiveis[0], 'cco');
    expect(api.adicionar).not.toHaveBeenCalled(); expect(api.remover).not.toHaveBeenCalled();
  });
});