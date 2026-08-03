/**
 * Aplica traduções i18n no template HTML de backup-config.
 * Executado uma vez via: node scripts/patch-backup-html-i18n.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '../src/app/settings/backup-config/backup-config.component.html');

const pairs = [
  ['Informações de Conexão', "{{ 'backup.card.connection' | translate }}"],
  ['Localização dos Backups', "{{ 'backup.card.pathLocation' | translate }}"],
  ['Configuração de Agendamento', "{{ 'backup.card.scheduleConfig' | translate }}"],
  ['Configurações de Notificação', "{{ 'backup.card.notifications' | translate }}"],
  ['Últimos Backups Executados', "{{ 'backup.card.historyList' | translate }}"],
  ['Host / Servidor *', "{{ 'backup.field.host' | translate }} *"],
  ['Porta *', "{{ 'backup.field.port' | translate }} *"],
  ['Nome do Banco de Dados *', "{{ 'backup.field.database' | translate }} *"],
  ['Usuário *', "{{ 'backup.field.user' | translate }} *"],
  ['Senha *', "{{ 'backup.field.password' | translate }} *"],
  ['Host é obrigatório', "{{ 'backup.err.hostRequired' | translate }}"],
  ['Porta inválida', "{{ 'backup.err.portInvalid' | translate }}"],
  ['Nome do banco é obrigatório', "{{ 'backup.err.databaseRequired' | translate }}"],
  ['Usuário é obrigatório', "{{ 'backup.err.usernameRequired' | translate }}"],
  ['Senha é obrigatória', "{{ 'backup.err.passwordRequired' | translate }}"],
  ['Habilitar conexão SSL/TLS', "{{ 'backup.sslEnabled' | translate }}"],
  ['Caminho do Diretório de Backup *', "{{ 'backup.field.backupPath' | translate }} *"],
  ['Caminho é obrigatório', "{{ 'backup.err.pathRequired' | translate }}"],
  ['Validando caminho...', "{{ 'backup.validatingPath' | translate }}"],
  ['<strong>Dicas:</strong>', '<strong>{{ \'backup.tips.title\' | translate }}</strong>'],
  ['Use caminhos absolutos (ex: /var/backups ou C:\\Backups)', "{{ 'backup.tips.absolutePath' | translate }}"],
  ['Certifique-se de que o diretório existe e tem permissões de escrita', "{{ 'backup.tips.permissions' | translate }}"],
  ['O sistema criará subdiretórios automaticamente se necessário', "{{ 'backup.tips.subdirs' | translate }}"],
  ['<motion>Agendamento Configurado:</motion>', '{{ \'backup.schedule.previewLabel\' | translate }}'],
  ['Agendamento Configurado:', "{{ 'backup.schedule.previewLabel' | translate }}"],
  ['<div class="preview-label">Agendamento Configurado:</motion>', '<motion class="preview-label">{{ \'backup.schedule.previewLabel\' | translate }}</motion>'],
  ['<motion class="preview-label">Agendamento Configurado:</motion>', '<div class="preview-label">{{ \'backup.schedule.previewLabel\' | translate }}</motion>'],
  ['Notificações enviadas:', "{{ 'backup.notifications.sentTitle' | translate }}"],
  ['Quando um backup é concluído com sucesso', "{{ 'backup.notifications.onSuccess' | translate }}"],
  ['Quando um backup falha', "{{ 'backup.notifications.onFail' | translate }}"],
  ['Quando um backup agendado não pode ser executado', "{{ 'backup.notifications.onSkipped' | translate }}"],
  ['<th>Data/Hora</th>', '<th>{{ \'backup.th.datetime\' | translate }}</th>'],
  ['<th>Caminho</th>', '<th>{{ \'backup.th.path\' | translate }}</th>'],
  ['<th>Tamanho</th>', '<th>{{ \'backup.th.size\' | translate }}</th>'],
  ['<th>Status</th>', '<th>{{ \'backup.th.status\' | translate }}</th>'],
  ['<th>Duração</th>', '<th>{{ \'backup.th.duration\' | translate }}</th>'],
  ['<th style="width: 80px;">Abrir Pasta</th>', '<th style="width: 80px;">{{ \'backup.th.openFolder\' | translate }}</th>'],
  ['<th style="width: 100px;">Ações</th>', '<th style="width: 100px;">{{ \'backup.th.actions\' | translate }}</th>'],
  ['<p>Nenhum backup encontrado</p>', '<p>{{ \'backup.history.empty\' | translate }}</p>'],
  ['<p>Carregando diretórios...</p>', '<p>{{ \'backup.dialog.selectFolder.loading\' | translate }}</p>'],
  ['<p>Nenhum diretório encontrado</p>', '<p>{{ \'backup.dialog.selectFolder.empty\' | translate }}</p>'],
  ['<strong>Nota:</strong>', '<strong>{{ \'backup.dialog.createFolder.noteTitle\' | translate }}</strong>'],
  ['O sistema tentará criar a pasta no servidor quando você salvar as configurações. Certifique-se de ter as permissões necessárias.', "{{ 'backup.dialog.createFolder.noteBody' | translate }}"],
  ['Backups mais antigos serão excluídos automaticamente', "{{ 'backup.hint.retention' | translate }}"],
  ['Digite os e-mails separados por vírgula', "{{ 'backup.hint.emails' | translate }}"],
  ['Deixe vazio para usar apenas o nome da pasta', "{{ 'backup.hint.folderPathEmpty' | translate }}"],
  ['Digite apenas o nome da pasta (sem barras ou barras invertidas)', "{{ 'backup.hint.folderNameOnly' | translate }}"]
];

let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(/<span>Informações de Conexão<\/span>/, '<span>{{ \'backup.card.connection\' | translate }}</span>');
html = html.replace(/<span>Localização dos Backups<\/span>/, '<span>{{ \'backup.card.pathLocation\' | translate }}</span>');
html = html.replace(/<span>Configuração de Agendamento<\/span>/, '<span>{{ \'backup.card.scheduleConfig\' | translate }}</span>');
html = html.replace(/<span>Configurações de Notificação<\/span>/, '<span>{{ \'backup.card.notifications\' | translate }}</span>');
html = html.replace(/<span>Últimos Backups Executados<\/span>/, '<span>{{ \'backup.card.historyList\' | translate }}</span>');

html = html.replace(/placeholder="localhost ou IP do servidor"/g, '[placeholder]="\'backup.placeholder.host\' | translate"');
html = html.replace(/placeholder="3306"/g, '[placeholder]="\'backup.placeholder.port\' | translate"');
html = html.replace(/placeholder="nome_do_banco"/g, '[placeholder]="\'backup.placeholder.database\' | translate"');
html = html.replace(/placeholder="usuário"/g, '[placeholder]="\'backup.placeholder.user\' | translate"');
html = html.replace(/placeholder="••••••••"/g, '[placeholder]="\'backup.placeholder.password\' | translate"');
html = html.replace(/placeholder="\/caminho\/para\/backups ou C:\\caminho\\para\\backups"/g, '[placeholder]="\'backup.placeholder.backupPath\' | translate"');
html = html.replace(/placeholder="Selecione o tipo"/g, '[placeholder]="\'backup.placeholder.scheduleType\' | translate"');
html = html.replace(/placeholder="Selecione a data"/g, '[placeholder]="\'backup.placeholder.date\' | translate"');
html = html.replace(/placeholder="1-31"/g, '[placeholder]="\'backup.placeholder.dayOfMonth\' | translate"');
html = html.replace(/placeholder="30"/g, '[placeholder]="\'backup.placeholder.retention\' | translate"');
html = html.replace(/placeholder="email1@exemplo.com, email2@exemplo.com"/g, '[placeholder]="\'backup.placeholder.emails\' | translate"');
html = html.replace(/placeholder="Nenhuma pasta selecionada"/g, '[placeholder]="\'backup.placeholder.noFolderSelected\' | translate"');
html = html.replace(/placeholder="C:\\Backups ou \/var\/backups"/g, '[placeholder]="\'backup.placeholder.folderPath\' | translate"');
html = html.replace(/placeholder="nome-da-pasta"/g, '[placeholder]="\'backup.placeholder.folderName\' | translate"');

html = html.replace(/label="Testar Conexão"/g, '[label]="\'backup.btn.testConnection\' | translate"');
html = html.replace(/label="Salvar Configurações"/g, '[label]="\'backup.btn.save\' | translate"');
html = html.replace(/label="Cancelar"/g, '[label]="\'backup.btn.cancel\' | translate"');
html = html.replace(/label="Selecionar Pasta Atual"/g, '[label]="\'backup.btn.selectCurrentFolder\' | translate"');
html = html.replace(/label="Confirmar"/g, '[label]="\'backup.btn.confirm\' | translate"');
html = html.replace(/label="Criar"/g, '[label]="\'backup.btn.create\' | translate"');

html = html.replace(/header="Selecionar Pasta de Backup"/g, '[header]="\'backup.dialog.selectFolder.title\' | translate"');
html = html.replace(/header="Criar Nova Pasta"/g, '[header]="\'backup.dialog.createFolder.title\' | translate"');

html = html.replace(/pTooltip="Selecionar pasta"/g, '[pTooltip]="\'backup.tooltip.selectFolder\' | translate"');
html = html.replace(/pTooltip="Criar nova pasta"/g, '[pTooltip]="\'backup.tooltip.createFolder\' | translate"');

for (const [from, to] of pairs) {
  if (html.includes(from)) {
    html = html.split(from).join(to);
  }
}

// Fix preview label if still literal
html = html.replace(
  /<motion class="preview-label">Agendamento Configurado:<\/motion>/,
  '<motion class="preview-label">{{ \'backup.schedule.previewLabel\' | translate }}</motion>'
);
html = html.replace(
  /<div class="preview-label">Agendamento Configurado:<\/motion>/,
  '<div class="preview-label">{{ \'backup.schedule.previewLabel\' | translate }}</motion>'
);
html = html.replace(
  /<div class="preview-label">Agendamento Configurado:<\/motion>/,
  '<div class="preview-label">{{ \'backup.schedule.previewLabel\' | translate }}</div>'
);
html = html.replace(
  /<div class="preview-label">Agendamento Configurado:<\/motion>/,
  '<motion class="preview-label">{{ \'backup.schedule.previewLabel\' | translate }}</motion>'
);

fs.writeFileSync(htmlPath, html);
console.log('backup-config.component.html patched');
