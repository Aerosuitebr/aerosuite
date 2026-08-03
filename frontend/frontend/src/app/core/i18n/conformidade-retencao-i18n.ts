import type { TranslationDictionary } from '../translation.service';

function L(pt: string, en: string, es: string, fr: string, lang: 'pt' | 'en' | 'es' | 'fr'): string {
  switch (lang) {
    case 'pt':
      return pt;
    case 'en':
      return en;
    case 'es':
      return es;
    case 'fr':
      return fr;
  }
}

function dict(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.retencao.title': L(
      'Retenção de registros',
      'Record retention',
      'Retención de registros',
      'Rétention des enregistrements',
      lang
    ),
    'conformidade.retencao.subtitle': L(
      'Política orientativa para arquivo morto de OS fechadas. Validar prazo legal e manual de manutenção da organização.',
      'Guidance policy for cold archive of closed work orders. Verify legal period and the organization maintenance manual.',
      'Política orientativa para archivo muerto de OS cerradas. Verifique plazo legal y manual de mantenimiento.',
      'Politique indicative pour archives froides des OS clôturées. Vérifier le délai légal et le manuel de maintenance.',
      lang
    ),
    'conformidade.retencao.anos': L('Anos de retenção', 'Retention years', 'Años de retención', 'Années de rétention', lang),
    'conformidade.retencao.limite': L('Data-limite (fechamento)', 'Cutoff date (closed)', 'Fecha límite (cierre)', 'Date limite (clôture)', lang),
    'conformidade.retencao.btn.salvar': L('Salvar política', 'Save policy', 'Guardar política', 'Enregistrer la politique', lang),
    'conformidade.retencao.btn.exportar': L('Exportar arquivo morto (ZIP)', 'Export cold archive (ZIP)', 'Exportar archivo muerto (ZIP)', 'Exporter archives froides (ZIP)', lang),
    'conformidade.retencao.stats.fechadas': L('OS fechadas', 'Closed WOs', 'OS cerradas', 'OS clôturées', lang),
    'conformidade.retencao.stats.dentro': L('Dentro da retenção', 'Within retention', 'Dentro de retención', 'Dans la rétention', lang),
    'conformidade.retencao.stats.fora': L('Fora da retenção', 'Outside retention', 'Fuera de retención', 'Hors rétention', lang),
    'conformidade.retencao.stats.abertas': L('OS ainda abertas', 'Still open WOs', 'OS aún abiertas', 'OS encore ouvertes', lang),
    'conformidade.retencao.amostra': L('Amostra fora da retenção', 'Sample outside retention', 'Muestra fuera de retención', 'Échantillon hors rétention', lang),
    'conformidade.retencao.export.dataInicio': L('Fechamento a partir de', 'Closed from', 'Cierre desde', 'Clôture à partir du', lang),
    'conformidade.retencao.export.dataFim': L('Fechamento até', 'Closed until', 'Cierre hasta', 'Clôture jusqu\'au', lang),
    'conformidade.retencao.export.limite': L('Máx. OS no ZIP', 'Max WOs in ZIP', 'Máx. OS en ZIP', 'Max OS dans le ZIP', lang),
    'conformidade.retencao.export.hint': L(
      'Se vazio, exporta OS fechadas antes da data-limite configurada.',
      'If empty, exports WOs closed before the configured cutoff.',
      'Si está vacío, exporta OS cerradas antes de la fecha límite.',
      'Si vide, exporte les OS clôturées avant la date limite configurée.',
      lang
    ),
    'conformidade.retencao.toast.salvo': L('Política de retenção salva.', 'Retention policy saved.', 'Política de retención guardada.', 'Politique de rétention enregistrée.', lang),
    'conformidade.retencao.toast.zip': L('Arquivo morto gerado.', 'Cold archive generated.', 'Archivo muerto generado.', 'Archives froides générées.', lang),
    'conformidade.retencao.err.zip': L('Falha ao gerar o ZIP.', 'Failed to generate ZIP.', 'Error al generar el ZIP.', 'Échec de génération du ZIP.', lang),
    'conformidade.retencao.err.salvar': L('Falha ao salvar a política.', 'Failed to save policy.', 'Error al guardar la política.', 'Échec d\'enregistrement de la politique.', lang),
    'conformidade.retencao.error.anos_obrigatorio': L('Informe os anos de retenção.', 'Enter retention years.', 'Indique los años de retención.', 'Indiquez les années de rétention.', lang),
    'conformidade.retencao.error.export': L('Falha ao exportar arquivo morto.', 'Failed to export cold archive.', 'Error al exportar archivo muerto.', 'Échec d\'export des archives froides.', lang),
    'conformidade.retencao.line': L(
      'OS {{numero}} — fech. {{fechamento}} — {{cliente}}',
      'WO {{numero}} — closed {{fechamento}} — {{cliente}}',
      'OS {{numero}} — cierre {{fechamento}} — {{cliente}}',
      'OS {{numero}} — clôture {{fechamento}} — {{cliente}}',
      lang
    )
  };
}

export const CONFORMIDADE_RETENCAO_PT_BR = dict('pt');
export const CONFORMIDADE_RETENCAO_EN_US = dict('en');
export const CONFORMIDADE_RETENCAO_ES_ES = dict('es');
export const CONFORMIDADE_RETENCAO_FR_FR = dict('fr');
