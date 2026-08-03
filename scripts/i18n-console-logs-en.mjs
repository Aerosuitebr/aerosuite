#!/usr/bin/env node
/**
 * Lote D — converte console.error/warn PT → EN (devtools only).
 * Only touches lines containing console.error or console.warn.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'frontend', 'src', 'app');

/** Longest-first exact replacements (console log messages only). */
const REPLACEMENTS = [
  ['🚫 SEGURANÇA: Usuário externo tentando acessar endpoint interno bloqueado:', '🚫 SECURITY: External user blocked from internal endpoint:'],
  ['Acesso negado: Usuário externo tentando acessar rota interna:', 'Access denied: external user attempted internal route:'],
  ['SistemaAtualizacaoService: erro na requisição:', 'SistemaAtualizacaoService: request error:'],
  ['UsuarioService.delete - Erro:', 'UsuarioService.delete - error:'],
  ['ExternoOSDetailComponent - Erro ao carregar OS:', 'ExternoOSDetailComponent - failed to load work order:'],
  ['Erro ao inicializar componente de notificação de backup:', 'Failed to initialize backup notification component:'],
  ['Erro ao obter circunferência do relógio:', 'Failed to get clock circumference:'],
  ['Erro ao calcular offset do relógio:', 'Failed to calculate clock offset:'],
  ['Erro ao calcular segundos restantes:', 'Failed to calculate remaining seconds:'],
  ['Erro ao obter cor do progresso:', 'Failed to get progress color:'],
  ['Erro ao atualizar estado do backup:', 'Failed to update backup state:'],
  ['Erro ao subscrever estado do backup:', 'Failed to subscribe to backup state:'],
  ['Erro ao verificar status do backup:', 'Failed to check backup status:'],
  ['Erro ao carregar preferências de aparência:', 'Failed to load appearance preferences:'],
  ['Erro ao salvar preferências de aparência:', 'Failed to save appearance preferences:'],
  ['Erro ao carregar status de atualização:', 'Failed to load update status:'],
  ['Erro ao verificar atualizações:', 'Failed to check for updates:'],
  ['Erro ao cancelar atualização:', 'Failed to cancel update:'],
  ['Erro ao aprovar atualização:', 'Failed to approve update:'],
  ['Erro ao subscrever atualizações:', 'Failed to subscribe to updates:'],
  ['Erro ao atualizar Produto Aeronáutico:', 'Failed to update aeronautical product:'],
  ['Erro ao criar Produto Aeronáutico:', 'Failed to create aeronautical product:'],
  ['Erro ao carregar usuário externo do localStorage:', 'Failed to load external user from localStorage:'],
  ['Erro ao carregar usuário do localStorage:', 'Failed to load user from localStorage:'],
  ['Erro ao recarregar dados do usuário:', 'Failed to reload user data:'],
  ['Erro no ngOnInit do FabricanteListComponent:', 'FabricanteListComponent ngOnInit error:'],
  ['Erro no reload do FabricanteListComponent:', 'FabricanteListComponent reload error:'],
  ['Erro ao carregar funcionalidades do perfil:', 'Failed to load profile permissions:'],
  ['Erro ao carregar funcionalidades do usuário:', 'Failed to load user permissions:'],
  ['Erro ao carregar funcionalidades:', 'Failed to load permissions:'],
  ['Erro ao carregar produtos disponíveis:', 'Failed to load available products:'],
  ['Erro ao recarregar produtos disponíveis:', 'Failed to reload available products:'],
  ['Erro ao carregar produtos existentes:', 'Failed to load existing products:'],
  ['Erro ao carregar arquivos disponíveis:', 'Failed to load available files:'],
  ['Erro ao carregar tipos de serviço:', 'Failed to load service types:'],
  ['Erro ao atualizar tipo de serviço:', 'Failed to update service type:'],
  ['Erro ao criar tipo de serviço:', 'Failed to create service type:'],
  ['Erro ao carregar tipo de serviço:', 'Failed to load service type:'],
  ['Erro ao carregar publicações:', 'Failed to load publications:'],
  ['Erro ao atualizar publicação:', 'Failed to update publication:'],
  ['Erro ao criar publicação:', 'Failed to create publication:'],
  ['Erro ao excluir publicação:', 'Failed to delete publication:'],
  ['Erro ao buscar publicações:', 'Failed to search publications:'],
  ['Erro ao carregar FCUs disponíveis:', 'Failed to load available FCUs:'],
  ['Erro ao carregar associações:', 'Failed to load associations:'],
  ['Erro ao recarregar associações:', 'Failed to reload associations:'],
  ['Erro ao associar FCUs:', 'Failed to associate FCUs:'],
  ['Erro ao associar produtos:', 'Failed to associate products:'],
  ['Erro ao remover associação:', 'Failed to remove association:'],
  ['Erro ao inativar associação:', 'Failed to deactivate association:'],
  ['Erro ao desfazer associação:', 'Failed to undo association:'],
  ['Erro ao carregar documentos da OS:', 'Failed to load work order documents:'],
  ['Erro ao carregar documentos diversos:', 'Failed to load miscellaneous documents:'],
  ['Erro ao carregar documentos salvos:', 'Failed to load saved documents:'],
  ['Erro ao processar arquivo Word:', 'Failed to process Word file:'],
  ['Erro ao salvar documento:', 'Failed to save document:'],
  ['Erro ao carregar documento:', 'Failed to load document:'],
  ['Erro ao carregar documentos:', 'Failed to load documents:'],
  ['Erro ao verificar acesso portal:', 'Failed to verify portal access:'],
  ['Erro ao disponibilizar portal:', 'Failed to enable portal access:'],
  ['Erro ao atualizar status ENVIADA:', 'Failed to update status to SENT:'],
  ['Erro ao clonar proposta:', 'Failed to clone proposal:'],
  ['Erro ao carregar proposta:', 'Failed to load proposal:'],
  ['Erro ao carregar propostas:', 'Failed to load proposals:'],
  ['Erro ao salvar itens automaticamente:', 'Failed to auto-save items:'],
  ['Erro ao salvar template:', 'Failed to save template:'],
  ['Erro ao carregar templates:', 'Failed to load templates:'],
  ['Erro ao carregar categorias:', 'Failed to load categories:'],
  ['Erro ao buscar clientes:', 'Failed to search clients:'],
  ['Erro ao atualizar cliente:', 'Failed to update client:'],
  ['Erro ao salvar cliente:', 'Failed to save client:'],
  ['Erro ao enviar email:', 'Failed to send email:'],
  ['Erro ao salvar assinatura:', 'Failed to save signature:'],
  ['Erro ao enviar imagem do produto:', 'Failed to upload product image:'],
  ['Erro ao carregar fabricantes:', 'Failed to load manufacturers:'],
  ['Erro ao recarregar fabricantes:', 'Failed to reload manufacturers:'],
  ['Erro ao carregar fabricante:', 'Failed to load manufacturer:'],
  ['Erro ao atualizar fabricante:', 'Failed to update manufacturer:'],
  ['Erro ao criar fabricante:', 'Failed to create manufacturer:'],
  ['Erro ao inativar fabricante:', 'Failed to deactivate manufacturer:'],
  ['Erro ao carregar perfis:', 'Failed to load profiles:'],
  ['Erro ao atualizar perfil:', 'Failed to update profile:'],
  ['Erro ao criar perfil:', 'Failed to create profile:'],
  ['Erro ao inativar perfil:', 'Failed to deactivate profile:'],
  ['Erro ao atualizar funcionalidade:', 'Failed to update permission:'],
  ['Erro ao criar funcionalidade:', 'Failed to create permission:'],
  ['Erro ao inativar funcionalidade:', 'Failed to deactivate permission:'],
  ['Erro ao salvar alterações:', 'Failed to save changes:'],
  ['Erro ao carregar configuração:', 'Failed to load configuration:'],
  ['Erro ao carregar estatísticas:', 'Failed to load statistics:'],
  ['Erro ao carregar chamados:', 'Failed to load tickets:'],
  ['Erro ao criar chamado:', 'Failed to create ticket:'],
  ['Erro ao carregar ticket:', 'Failed to load ticket:'],
  ['Erro ao assumir chamado:', 'Failed to take ticket:'],
  ['Erro ao alterar status:', 'Failed to change status:'],
  ['Erro ao enviar resposta:', 'Failed to send reply:'],
  ['Erro ao devolver chamado:', 'Failed to return ticket:'],
  ['Erro ao resolver chamado:', 'Failed to resolve ticket:'],
  ['Erro ao buscar tickets:', 'Failed to search tickets:'],
  ['Erro ao buscar lotes:', 'Failed to search batches:'],
  ['Erro ao carregar fornecedores:', 'Failed to load suppliers:'],
  ['Erro ao buscar invoices:', 'Failed to search invoices:'],
  ['Erro ao carregar invoices:', 'Failed to load invoices:'],
  ['Erro ao salvar lote:', 'Failed to save batch:'],
  ['Erro ao cadastrar fornecedor:', 'Failed to register supplier:'],
  ['Erro ao salvar invoice:', 'Failed to save invoice:'],
  ['Erro ao registrar entrada:', 'Failed to register inbound stock:'],
  ['Erro ao buscar item:', 'Failed to fetch item:'],
  ['Erro ao buscar auditoria:', 'Failed to fetch audit log:'],
  ['Erro ao carregar OS liberadas:', 'Failed to load released work orders:'],
  ['Erro ao configurar conexão remota:', 'Failed to configure remote connection:'],
  ['Erro ao configurar áudio:', 'Failed to configure audio:'],
  ['Erro na configuração de áudio:', 'Audio configuration error:'],
  ['Erro ao reproduzir áudio remoto:', 'Failed to play remote audio:'],
  ['Erro ao atender chamada no servidor:', 'Failed to answer call on server:'],
  ['Erro ao iniciar chamada:', 'Failed to start call:'],
  ['Erro ao encerrar chamada:', 'Failed to end call:'],
  ['Erro ao recusar chamada:', 'Failed to reject call:'],
  ['Erro ao monitorar chamada:', 'Failed to monitor call:'],
  ['Erro no polling de chamadas:', 'Call polling error:'],
  ['Erro ao enviar SDP de resposta:', 'Failed to send answer SDP:'],
  ['Erro ao enviar ICE candidates:', 'Failed to send ICE candidates:'],
  ['Erro ao tocar ringtone:', 'Failed to play ringtone:'],
  ['Erro ao tocar chamando:', 'Failed to play calling tone:'],
  ['Erro ao adicionar ICE candidates:', 'Failed to add ICE candidates:'],
  ['Erro ao adicionar ICE candidate:', 'Failed to add ICE candidate:'],
  ['Erro ao buscar cotação do BCB, tentando dia anterior...', 'Failed to fetch BCB exchange rate, trying previous day...'],
  ['Erro ao carregar cotação:', 'Failed to load exchange rate:'],
  ['Erro ao carregar ajuda da rota atual:', 'Failed to load help for current route:'],
  ['Erro ao carregar ajuda para rota:', 'Failed to load help for route:'],
  ['Erro ao obter ajuda da rota atual:', 'Failed to get help for current route:'],
  ['Erro ao carregar logo, imprimindo mesmo assim', 'Failed to load logo, printing anyway'],
  ['Erro ao validar token:', 'Failed to validate token:'],
  ['Erro no login externo:', 'External login error:'],
  ['Erro ao formatar data:', 'Failed to format date:'],
  ['Erro ao sanitizar URL:', 'Failed to sanitize URL:'],
  ['Erro ao carregar iframe:', 'Failed to load iframe:'],
  ['Erro ao inicializar PageHelpComponent:', 'Failed to initialize PageHelpComponent:'],
  ['Erro ao inicializar AppComponent:', 'Failed to initialize AppComponent:'],
  ['Erro ao inicializar serviços:', 'Failed to initialize services:'],
  ['Erro ao fazer upload:', 'Failed to upload:'],
  ['Erro no upload de fotos:', 'Photo upload error:'],
  ['Erro no upload do arquivo:', 'File upload error:'],
  ['Erro ao gerar PDF:', 'Failed to generate PDF:'],
  ['Erro ao traduzir:', 'Failed to translate:'],
  ['Erro ao atualizar quantidade:', 'Failed to update quantity:'],
  ['Erro ao navegar para edição:', 'Failed to navigate to edit:'],
  ['Erro ao navegar para', 'Failed to navigate to'],
  ['Erro ao tentar navegar:', 'Failed to attempt navigation:'],
  ['Erro ao inativar FCU:', 'Failed to deactivate FCU:'],
  ['Erro ao carregar FCUs:', 'Failed to load FCUs:'],
  ['Erro ao carregar histórico:', 'Failed to load history:'],
  ['Erro ao carregar usuários:', 'Failed to load users:'],
  ['Erro ao carregar usuário:', 'Failed to load user:'],
  ['Erro ao criar usuário:', 'Failed to create user:'],
  ['Erro ao atualizar usuário:', 'Failed to update user:'],
  ['Erro ao excluir usuário:', 'Failed to delete user:'],
  ['Erro ao carregar produtos:', 'Failed to load products:'],
  ['Erro ao buscar produtos:', 'Failed to search products:'],
  ['Erro ao atualizar produto:', 'Failed to update product:'],
  ['Erro ao criar produto:', 'Failed to create product:'],
  ['Erro ao carregar OS:', 'Failed to load work order:'],
  ['Erro ao salvar:', 'Failed to save:'],
  ['Erro detalhado:', 'Detailed error:'],
  ['Erro completo:', 'Full error:'],
  ['[BackupNotification] Erro ao criar conexão SSE:', '[BackupNotification] Failed to create SSE connection:'],
  ['[BackupNotification] Erro ao parsear mensagem:', '[BackupNotification] Failed to parse message:'],
  ['[BackupNotification] Erro ao parsear progresso de backup:', '[BackupNotification] Failed to parse backup progress:'],
  ['[BackupNotification] Erro na conexão SSE:', '[BackupNotification] SSE connection error:'],
  ['[BackupNotification] Estado da conexão:', '[BackupNotification] Connection state:'],
  ['[SistemaAtualizacao] Erro ao criar conexão SSE:', '[SistemaAtualizacao] Failed to create SSE connection:'],
  ['[SistemaAtualizacao] Erro ao parsear mensagem:', '[SistemaAtualizacao] Failed to parse message:'],
  ['[SistemaAtualizacao] Erro ao parsear progresso:', '[SistemaAtualizacao] Failed to parse progress:'],
  ['[SistemaAtualizacao] Erro na conexão SSE:', '[SistemaAtualizacao] SSE connection error:'],
  ['❌ Erro ao carregar arquivos disponíveis:', '❌ Failed to load available files:'],
  ['❌ Erro ao carregar associações:', '❌ Failed to load associations:'],
  ['❌ Erro ao carregar produtos disponíveis:', '❌ Failed to load available products:'],
  ['❌ Erro ao carregar produtos existentes:', '❌ Failed to load existing products:'],
  ['❌ Erro ao desfazer associação:', '❌ Failed to undo association:'],
  ['❌ Erro ao inativar associação:', '❌ Failed to deactivate association:'],
  ['❌ Erro ao recarregar associações:', '❌ Failed to reload associations:'],
  ['❌ Erro ao recarregar produtos disponíveis:', '❌ Failed to reload available products:'],
  ['❌ FCU ID não encontrado ao recarregar produtos disponíveis', '❌ FCU ID not found when reloading available products'],
  ['❌ FCU ID não encontrado', '❌ FCU ID not found'],
  ['❌ Falha total na navegação:', '❌ Navigation failed completely:'],
  ['❌ Navegação retornou false para:', '❌ Navigation returned false for:'],
  ['❌ Produto não encontrado. Evento:', '❌ Product not found. Event:'],
  ['❌ Rota inválida para funcionalidade:', '❌ Invalid route for permission:'],
  ['💥 Todos os endpoints de detecção falharam', '💥 All detection endpoints failed'],
  ['❌ Falha na detecção no endpoint', '❌ Detection failed on endpoint'],
  ['❌ Falha no', '❌ Failure in'],
  ['API não disponível!', 'API not available!'],
  ['ERRO: ID do FCU não encontrado para inativação.', 'ERROR: FCU ID not found for deactivation.'],
  ['ERRO: ID do usuário não encontrado', 'ERROR: User ID not found'],
  ['FCU inválido para edição:', 'Invalid FCU for edit:'],
  ['Fabricante inválido para edição:', 'Invalid manufacturer for edit:'],
  ['Produto inválido para edição:', 'Invalid product for edit:'],
  ['Tipo de serviço inválido para edição:', 'Invalid service type for edit:'],
  ['Usuário inválido para edição:', 'Invalid user for edit:'],
  ['Navegação falhou', 'Navigation failed'],
  ['Método:', 'Method:'],
  ['Não foi possível cancelar: ID da atualização não encontrado', 'Could not cancel: update ID not found'],
  ['Não foi possível carregar a foto do produto.', 'Could not load product photo.'],
  ['Não foi possível obter cotação, usando valor padrão', 'Could not fetch exchange rate, using default value'],
  ['config.connection não existe ou é null/undefined', 'config.connection is missing or null/undefined'],
  ['config.backupPath não existe ou está vazio', 'config.backupPath is missing or empty'],
  ['config.schedule não existe, usando valores padrão', 'config.schedule is missing, using defaults'],
  ['⚠️ Funcionalidade sem rota ou código:', '⚠️ Permission missing route or code:'],
  ['⚠️ Nenhum arquivo disponível encontrado', '⚠️ No available files found'],
  ['⚠️ OS sem ID, usando dados básicos da busca', '⚠️ Work order without ID, using basic search data'],
  ['Tradução não encontrada para chave', 'Translation not found for key'],
  [' no idioma "', ' in locale "'],
  ['⚠️ Fabricante com ID ${produto.idFabricante} não encontrado', '⚠️ Manufacturer with ID ${produto.idFabricante} not found'],
];

function transformConsoleLine(line) {
  let out = line;
  for (const [from, to] of REPLACEMENTS) {
    if (out.includes(from)) {
      out = out.split(from).join(to);
    }
  }
  return out;
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== 'node_modules') walk(p, out);
    else if (ent.name.endsWith('.ts') && !ent.name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

let filesChanged = 0;
let linesChanged = 0;

for (const file of walk(appDir)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = false;
  const next = lines.map((line) => {
    if (!/console\.(error|warn)\(/.test(line)) return line;
    const updated = transformConsoleLine(line);
    if (updated !== line) {
      linesChanged++;
      changed = true;
    }
    return updated;
  });
  if (changed) {
    fs.writeFileSync(file, next.join('\n'), 'utf8');
    filesChanged++;
  }
}

console.log(JSON.stringify({ filesChanged, linesChanged }, null, 2));
