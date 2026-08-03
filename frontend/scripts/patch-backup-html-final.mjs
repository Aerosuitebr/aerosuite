import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const htmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/app/settings/backup-config/backup-config.component.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const reps = [
  ["[onLabel]=\"'Ativo'\"", "[onLabel]=\"'backup.toggle.on' | translate\""],
  ["[offLabel]=\"'Inativo'\"", "[offLabel]=\"'backup.toggle.off' | translate\""],
  ['Data do Backup *', "{{ 'backup.field.scheduledDate' | translate }} *"],
  ['Dia do Mês *', "{{ 'backup.field.dayOfMonth' | translate }} *"],
  ['Retenção (dias) *', "{{ 'backup.field.retentionDays' | translate }} *"],
  ['Enviar notificações por e-mail', "{{ 'backup.field.emailNotify' | translate }}"],
  ['Destinatários (separados por vírgula)', "{{ 'backup.field.emailRecipientsLabel' | translate }}"],
  ["[emptyMessage]=\"'Nenhum backup encontrado'\"", "[emptyMessage]=\"'backup.history.empty' | translate\""],
  ["backup.status === 'success' ? 'Sucesso' : 'Falhou'", "backup.status === 'success' ? ('backup.status.success' | translate) : ('backup.status.failed' | translate)"],
  ['Ver erro', "{{ 'backup.btn.viewError' | translate }}"],
  ['pTooltip="Abrir pasta do backup"', "[pTooltip]=\"'backup.tooltip.openBackupFolder' | translate\""],
  ['pTooltip="Excluir backup"', "[pTooltip]=\"'backup.tooltip.deleteBackup' | translate\""],
  ['pTooltip="Voltar"', "[pTooltip]=\"'backup.tooltip.back' | translate\""],
  ['pTooltip="Atualizar"', "[pTooltip]=\"'backup.tooltip.refresh' | translate\""],
  ["currentExplorerPath || 'Raiz do Sistema'", "currentExplorerPath || ('backup.explorer.root' | translate)"],
  ['Pasta Selecionada:', "{{ 'backup.explorer.selectedFolder' | translate }}"],
  [
    'Mostrando {{ getFirstRecord(state) }} a {{ getLastRecord(state) }} de {{ backupHistory.length }} registros',
    "{{ 'backup.table.paginator' | translate:{ from: getFirstRecord(state), to: getLastRecord(state), total: backupHistory.length } }}"
  ]
];

for (const [a, b] of reps) {
  html = html.split(a).join(b);
}

fs.writeFileSync(htmlPath, html);
console.log('backup html final pass done');
