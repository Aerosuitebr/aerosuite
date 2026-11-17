import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { PropostaAceitePublicaComponent } from './proposta-aceite-publica.component';

describe('moeda no aceite público', () => {
  const component = Object.create(PropostaAceitePublicaComponent.prototype) as PropostaAceitePublicaComponent;

  it('converte itens em USD para BRL usando a cotação da proposta', () => {
    expect(component.toMoedaExibicao(100, { id: 1, moedaExibicao: 'BRL', cotacaoDolar: 5.25 })).toBe(525);
  });

  it('preserva EUR e aplica a relação dos totais salvos', () => {
    const proposta = { id: 1, moedaExibicao: 'EUR', totalGeralUsd: 200, totalGeralExibicao: 180 };
    expect(component.moedaLabel(proposta)).toBe('EUR');
    expect(component.toMoedaExibicao(100, proposta)).toBe(90);
    expect(component.formatMoney(proposta)).toContain('€');
  });

  it('mantém valores em USD sem aplicar conversão', () => {
    expect(component.toMoedaExibicao(100, { id: 1, moedaExibicao: 'USD', cotacaoDolar: 5.25 })).toBe(100);
  });
});
