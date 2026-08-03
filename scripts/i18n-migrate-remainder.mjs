#!/usr/bin/env node
/**
 * Migrates remaining PT literal throws to ApiI18nMessages.encode / withDetail.
 * Run: node scripts/i18n-migrate-remainder.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const javaRoot = path.join(root, 'backend', 'src', 'main', 'java');

/** @type {Array<{file?: string, find: string|RegExp, replace: string}>} */
const REPLACEMENTS = [
  // BlingTenantApiClient
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao interpretar contato Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_PARSE_CONTACT_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao pesquisar contatos Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_SEARCH_CONTACTS_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Bling não retornou id do contato criado");',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACT_ID_NOT_RETURNED));',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao criar contato Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_CREATE_CONTACT_API_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Bling não retornou id do produto criado");',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_PRODUCT_ID_NOT_RETURNED));',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao criar produto Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_CREATE_PRODUCT_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao obter dados da empresa Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_FETCH_COMPANY_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao interpretar pedido Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_PARSE_PEDIDO_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Bling não retornou id do pedido criado");',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_PEDIDO_ID_NOT_RETURNED));',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao criar pedido Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_CREATE_PEDIDO_API_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao interpretar NF-e Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_PARSE_NFE_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Bling não retornou id da NF-e criada");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_NFE_ID_NOT_RETURNED));',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao emitir NF-e Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_EMIT_NFE_API_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Tenant " + tenantId + " sem token Bling");',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_TENANT_NO_TOKEN, "tenantId", String.valueOf(tenantId)));',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao chamar Bling POST " + path + ": " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_POST_FAILED, path + ": " + e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Bling HTTP " + res.statusCode() + " em " + path);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_HTTP_ERROR, "detail", res.statusCode() + " em " + path));',
  },
  {
    file: 'com/aerosuite/integration/bling/BlingTenantApiClient.java',
    find: 'throw new IllegalStateException("Falha ao chamar Bling " + path + ": " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_GET_FAILED, path + ": " + e.getMessage()), e);',
  },

  // FcuService
  {
    file: 'com/aerosuite/service/FcuService.java',
    find: 'throw new RuntimeException("FCU não encontrado");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.FCU_NOT_FOUND_GENERIC));',
  },
  {
    file: 'com/aerosuite/service/FcuService.java',
    find: 'throw new RuntimeException("Nenhuma linha foi atualizada. FCU pode não existir ou já estar inativo.");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.FCU_DEACTIVATE_NO_ROWS));',
  },
  {
    file: 'com/aerosuite/service/FcuService.java',
    find: 'throw new RuntimeException("Erro ao inativar FCU: " + e.getMessage(), e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_DEACTIVATE_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/FcuService.java',
    find: 'throw new RuntimeException("Erro ao converter FCU para DTO: " + e.getMessage(), e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_DTO_CONVERT_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/FcuService.java',
    find: 'throw new RuntimeException("Erro ao atualizar campos do FCU: " + e.getMessage(), e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_UPDATE_FIELDS_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/FcuService.java',
    find: 'throw new IllegalArgumentException("ID do FCU é obrigatório");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FCU_ID_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/FcuService.java',
    find: 'throw new RuntimeException("FCU não encontrado: " + id);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.FCU_NOT_FOUND, "id", String.valueOf(id)));',
  },
  {
    file: 'com/aerosuite/service/FcuService.java',
    find: 'throw new RuntimeException("Nenhuma linha foi atualizada. FCU pode não existir.");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.FCU_DEACTIVATE_NO_ROWS_SIMPLE));',
  },

  // TipoServicoService
  {
    file: 'com/aerosuite/service/TipoServicoService.java',
    find: 'if (e == null) throw new IllegalArgumentException("TipoServico not found: " + id);',
    replace:
      'if (e == null) throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_NOT_FOUND, "id", String.valueOf(id)));',
  },
  {
    file: 'com/aerosuite/service/TipoServicoService.java',
    find: 'throw new IllegalArgumentException("ID do TipoServico é obrigatório");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_ID_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/TipoServicoService.java',
    find: 'throw new IllegalArgumentException("TipoServico não encontrado com ID: " + id);',
    replace:
      'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_NOT_FOUND, "id", String.valueOf(id)));',
  },
  {
    file: 'com/aerosuite/service/TipoServicoService.java',
    find: 'throw new RuntimeException("Nenhuma linha foi atualizada para o ID: " + id);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_DEACTIVATE_NO_ROWS, "id", String.valueOf(id)));',
  },
  {
    file: 'com/aerosuite/service/TipoServicoService.java',
    find: 'throw new RuntimeException("Erro ao recarregar TipoServico ID " + id + " após inativação");',
    replace:
      'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_RELOAD_FAILED, "id", String.valueOf(id)));',
  },
  {
    file: 'com/aerosuite/service/TipoServicoService.java',
    find: 'throw new RuntimeException("Erro ao inativar TipoServico ID " + id + ": " + e.getMessage(), e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.TIPO_SERVICO_DEACTIVATE_FAILED, id + ": " + e.getMessage()), e);',
  },

  // OSFileService
  {
    file: 'com/aerosuite/service/OSFileService.java',
    find: 'throw new RuntimeException("Erro ao listar arquivos disponíveis", e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FILE_LIST_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/OSFileService.java',
    find: 'throw new RuntimeException("Erro ao criar pasta da OS: " + osId, e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FOLDER_CREATE_FAILED, String.valueOf(osId)), e);',
  },
  {
    file: 'com/aerosuite/service/OSFileService.java',
    find: 'throw new RuntimeException("Erro ao criar pasta diversos", e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FOLDER_DIVERSOS_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/OSFileService.java',
    find: 'throw new RuntimeException("Erro ao criar pasta diversos para OS: " + osId, e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FOLDER_DIVERSOS_OS_FAILED, String.valueOf(osId)), e);',
  },

  // EstoqueService QR
  {
    file: 'com/aerosuite/service/EstoqueService.java',
    find: 'throw new RuntimeException("Erro ao gerar QR Code: " + e.getMessage(), e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.ESTOQUE_QR_GENERATE_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/EstoqueService.java',
    find: 'throw new RuntimeException("Erro ao gerar imagem do QR Code: " + e.getMessage(), e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.ESTOQUE_QR_IMAGE_FAILED, e.getMessage()), e);',
  },

  // OsCrsService
  {
    file: 'com/aerosuite/service/OsCrsService.java',
    find: 'throw new BadRequestException("CRS ainda não emitido para esta OS");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_CRS_NOT_EMITTED));',
  },

  // SistemaAtualizacaoService
  {
    file: 'com/aerosuite/service/SistemaAtualizacaoService.java',
    find: 'throw new RuntimeException("Atualização não encontrada");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_NOT_FOUND));',
  },
  {
    file: 'com/aerosuite/service/SistemaAtualizacaoService.java',
    find: 'throw new RuntimeException("Atualização não está disponível para aprovação");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_NOT_AVAILABLE));',
  },
  {
    file: 'com/aerosuite/service/SistemaAtualizacaoService.java',
    find: 'throw new RuntimeException("Usuário não encontrado ou sem perfil");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_USER_NOT_FOUND));',
  },
  {
    file: 'com/aerosuite/service/SistemaAtualizacaoService.java',
    find: 'throw new RuntimeException("Apenas administradores e diretores podem aprovar atualizações");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_APPROVE_FORBIDDEN));',
  },

  // TenantBillingService
  {
    file: 'com/aerosuite/service/TenantBillingService.java',
    find: 'throw new BadRequestException("Billing não configurado para o tenant");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_NOT_CONFIGURED));',
  },
  {
    file: 'com/aerosuite/service/TenantBillingService.java',
    find: 'throw new BadRequestException("Organização da plataforma não requer checkout");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_PLATFORM_NO_CHECKOUT));',
  },
  {
    file: 'com/aerosuite/service/TenantBillingService.java',
    find: 'throw new BadRequestException("Ativação mock disponível apenas com provider mock");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_MOCK_ONLY));',
  },
  {
    file: 'com/aerosuite/service/TenantBillingService.java',
    find: 'throw new BadRequestException("Billing não encontrado");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_NOT_FOUND));',
  },

  // Pagarme / Stripe
  {
    file: 'com/aerosuite/billing/PagarmeBillingGateway.java',
    find: 'throw new BadRequestException("Webhook Pagar.me não configurado");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_PAGARME_WEBHOOK_NOT_CONFIGURED));',
  },
  {
    file: 'com/aerosuite/billing/StripeBillingGateway.java',
    find: 'throw new BadRequestException("Stripe não configurado (AERO_SUITE_STRIPE_SECRET_KEY)");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_NOT_CONFIGURED));',
  },
  {
    file: 'com/aerosuite/billing/StripeBillingGateway.java',
    find: 'throw new BadRequestException("Stripe incompleto: defina secret key e price id");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_INCOMPLETE));',
  },
  {
    file: 'com/aerosuite/billing/StripeBillingGateway.java',
    find: 'throw new BadRequestException("Falha ao criar sessão Stripe: " + e.getMessage());',
    replace:
      'throw new BadRequestException(ApiI18nMessages.withDetail(ApiI18nMessages.BILLING_STRIPE_SESSION_FAILED, e.getMessage()));',
  },
  {
    file: 'com/aerosuite/billing/StripeBillingGateway.java',
    find: 'throw new BadRequestException("Webhook Stripe não configurado");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_WEBHOOK_NOT_CONFIGURED));',
  },
  {
    file: 'com/aerosuite/billing/StripeBillingGateway.java',
    find: 'throw new BadRequestException("Assinatura Stripe inválida");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_SIGNATURE_INVALID));',
  },

  // Bling contact sync / connection
  {
    file: 'com/aerosuite/integration/bling/TenantBlingConnectionService.java',
    find: 'throw new IllegalStateException("OAuth Bling não configurado na plataforma");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_OAUTH_NOT_CONFIGURED));',
  },
  {
    file: 'com/aerosuite/integration/bling/TenantBlingConnectionService.java',
    find: 'throw new IllegalStateException("Resposta Bling sem access_token");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_OAUTH_NO_ACCESS_TOKEN));',
  },
  {
    file: 'com/aerosuite/integration/bling/TenantBlingConnectionService.java',
    find: 'throw new IllegalStateException("Falha ao obter token Bling: " + e.getMessage(), e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_OAUTH_TOKEN_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/BlingContactSyncService.java',
    find: 'throw new IllegalStateException("Contato Bling não encontrado: " + blingContatoId);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACT_NOT_FOUND, "id", String.valueOf(blingContatoId)));',
  },
  {
    file: 'com/aerosuite/service/BlingContactSyncService.java',
    find: 'throw new IllegalStateException("Webhook sem ID de contato");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_WEBHOOK_NO_CONTACT_ID));',
  },
  {
    file: 'com/aerosuite/service/BlingContactSyncService.java',
    find: 'throw new IllegalArgumentException("Cliente proposta não encontrado");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BLING_PROPOSTA_CLIENT_NOT_FOUND));',
  },
  {
    file: 'com/aerosuite/service/BlingContactSyncService.java',
    find: 'throw new IllegalArgumentException("Cliente já vinculado a outro contato Bling");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CLIENT_ALREADY_LINKED));',
  },
  {
    file: 'com/aerosuite/service/BlingSyncJobService.java',
    find: 'throw new IllegalStateException("Falha ao enfileirar job Bling", e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_ENQUEUE_JOB_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/BlingWebhookProcessor.java',
    find: 'throw new IllegalStateException("Job sem tenant_id");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_NO_TENANT));',
  },
  {
    file: 'com/aerosuite/service/BlingWebhookProcessor.java',
    find: 'throw new IllegalStateException("blingContatoId ausente no job");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_NO_CONTACT_ID));',
  },
  {
    file: 'com/aerosuite/service/BlingPropostaFluxoService.java',
    find: 'throw new NotFoundException("Proposta não encontrada: " + propostaId);',
    replace:
      'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_NOT_FOUND, "id", String.valueOf(propostaId)));',
  },

  // Fiscal cert
  {
    file: 'com/aerosuite/util/FiscalCertificateUtil.java',
    find: 'throw new IllegalArgumentException("Arquivo de certificado vazio");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_EMPTY));',
  },
  {
    file: 'com/aerosuite/util/FiscalCertificateUtil.java',
    find: 'throw new IllegalArgumentException("Certificado PKCS#12 sem certificado X.509 válido");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_INVALID_PKCS12));',
  },
  {
    file: 'com/aerosuite/util/FiscalCertificateUtil.java',
    find: 'throw new IllegalArgumentException("Certificado inválido ou senha incorreta", e);',
    replace:
      'throw new IllegalArgumentException(ApiI18nMessages.withDetail(ApiI18nMessages.FISCAL_CERT_INVALID_PASSWORD, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/util/FiscalCertificateUtil.java',
    find: 'throw new IllegalArgumentException("Informe o tipo do certificado (A1 ou A3)");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_TYPE_REQUIRED));',
  },
  {
    file: 'com/aerosuite/util/FiscalCertificateUtil.java',
    find: 'throw new IllegalArgumentException("Tipo de certificado deve ser A1 ou A3");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_TYPE_INVALID));',
  },
  {
    file: 'com/aerosuite/service/TenantBlingFiscalConfigService.java',
    find: 'throw new IllegalArgumentException("Arquivo .pfx/.p12 obrigatório");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CERT_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/TenantBlingFiscalConfigService.java',
    find: 'throw new IllegalArgumentException("Senha do certificado obrigatória");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_PASSWORD_REQUIRED));',
  },

  // AssociacaoFcu / Product
  {
    file: 'com/aerosuite/service/AssociacaoFcuService.java',
    find: 'throw new NotFoundException("FCU não encontrado: " + idFcu);',
    replace:
      'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FCU_NOT_FOUND, "id", String.valueOf(idFcu)));',
  },
  {
    file: 'com/aerosuite/service/AssociacaoFcuService.java',
    find: 'throw new NotFoundException("Produto não encontrado: " + idProduct);',
    replace:
      'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NOT_FOUND, "id", String.valueOf(idProduct)));',
  },
  {
    file: 'com/aerosuite/service/AssociacaoFcuService.java',
    find: 'throw new NotFoundException("Associação não encontrada: " + id);',
    replace:
      'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.ASSOCIACAO_FCU_NOT_FOUND, "id", String.valueOf(id)));',
  },
  {
    file: 'com/aerosuite/service/AssociacaoFcuService.java',
    find: 'throw new IllegalArgumentException("idFcu é obrigatório");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.ASSOCIACAO_FCU_ID_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/ProductService.java',
    find: 'throw new NotFoundException("Product not found: " + id);',
    replace:
      'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NOT_FOUND, "id", String.valueOf(id)));',
  },

  // TpFiles / Template
  {
    file: 'com/aerosuite/service/TpFilesService.java',
    find: 'throw new NotFoundException("Arquivo não encontrado com ID: " + id);',
    replace:
      'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_NOT_FOUND, "id", String.valueOf(id)));',
  },
  {
    file: 'com/aerosuite/service/TemplateProdutoServicoService.java',
    find: 'throw new NotFoundException("Template não encontrado: " + id);',
    replace:
      'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.TEMPLATE_NOT_FOUND, "id", String.valueOf(id)));',
  },

  // Gmail / OAuth
  {
    file: 'com/aerosuite/service/GmailApiService.java',
    find: 'throw new IllegalStateException("OAuth2 não está habilitado");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_NOT_ENABLED));',
  },
  {
    file: 'com/aerosuite/service/GmailApiService.java',
    find: 'throw new IllegalStateException("GmailService não foi inicializado");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.GMAIL_NOT_INITIALIZED));',
  },
  {
    file: 'com/aerosuite/service/GmailApiService.java',
    find: 'throw new RuntimeException("Erro ao enviar email via Gmail API: " + e.getMessage(), e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.GMAIL_SEND_FAILED, e.getMessage()), e);',
  },

  // Studio
  {
    file: 'com/aerosuite/studio/AeroStudioHtmlBuilder.java',
    find: 'default -> throw new IllegalArgumentException("Template desconhecido: " + ctx.templateId);',
    replace:
      'default -> throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TEMPLATE_INVALID, "id", ctx.templateId));',
  },
  {
    file: 'com/aerosuite/studio/AeroStudioLetterheadPresets.java',
    find: 'throw new IllegalArgumentException("Preset de timbrado inválido: " + presetId);',
    replace:
      'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_LETTERHEAD_INVALID, "id", presetId));',
  },
  {
    file: 'com/aerosuite/studio/AeroStudioLetterheadPresets.java',
    find: 'default -> throw new IllegalArgumentException("Preset de timbrado inválido: " + id);',
    replace:
      'default -> throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_LETTERHEAD_INVALID, "id", id));',
  },
  {
    file: 'com/aerosuite/studio/AeroStudioPdfPreviewUtil.java',
    find: 'throw new IllegalArgumentException("PDF vazio");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_PDF_EMPTY));',
  },
  {
    file: 'com/aerosuite/studio/AeroStudioPdfPreviewUtil.java',
    find: 'throw new IllegalStateException("PDF sem páginas");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_PDF_NO_PAGES));',
  },
  {
    file: 'com/aerosuite/studio/AeroStudioCustomHtmlBuilder.java',
    find: 'throw new IllegalArgumentException("Layout personalizado ausente");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_CUSTOM_LAYOUT_REQUIRED));',
  },
  {
    file: 'com/aerosuite/studio/AeroStudioCustomHtmlBuilder.java',
    find: 'throw new IllegalArgumentException("Demasiados elementos no layout (máx. " + MAX_ELEMENTS + ")");',
    replace:
      'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TOO_MANY_ELEMENTS, "max", String.valueOf(MAX_ELEMENTS)));',
  },
  {
    file: 'com/aerosuite/studio/AeroStudioGifUtil.java',
    find: 'throw new IllegalStateException("GIF ImageWriter não disponível");',
    replace: 'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_GIF_WRITER_UNAVAILABLE));',
  },

  // Misc services
  {
    file: 'com/aerosuite/service/FuncionalidadeService.java',
    find: 'throw new RuntimeException("Perfil não encontrado");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.USER_PROFILE_NOT_FOUND_GENERIC));',
  },
  {
    file: 'com/aerosuite/service/DossieAuditoriaService.java',
    find: 'throw new BadRequestException("Informe id ou numeroOs");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.DOSSIE_ID_OR_OS_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/SistemaEmpresaConfigService.java',
    find: 'throw new BadRequestException("Corpo obrigatório");',
    replace: 'throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.COMMON_BODY_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/PublicacaoProdutoService.java',
    find: 'throw new IllegalArgumentException("publicacaoId é obrigatório");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_ID_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/PublicacaoProdutoService.java',
    find: 'throw new IllegalArgumentException("fcuId é obrigatório");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_FCU_ID_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/PublicacaoProdutoService.java',
    find: 'throw new RuntimeException("Associação não encontrada");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.ASSOCIACAO_NOT_FOUND));',
  },
  {
    file: 'com/aerosuite/p1/TenantFeatureCatalog.java',
    find: 'throw new IllegalArgumentException("Feature flag desconhecida: " + code);',
    replace:
      'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_FEATURE_UNKNOWN, "code", code));',
  },
  {
    file: 'com/aerosuite/security/JwtTokenService.java',
    find: 'throw new IllegalArgumentException("Usuario inválido para emissão de JWT");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.JWT_INVALID_USER));',
  },
  {
    file: 'com/aerosuite/util/CodigoBarrasUtil.java',
    find: 'throw new IllegalArgumentException("Código deve ter 12 dígitos");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BARCODE_12_DIGITS_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/HttpUpdateService.java',
    find: 'throw new RuntimeException("URL de download não configurada. Configure http.update.download.base.url ou http.update.version.url");',
    replace: 'throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_DOWNLOAD_URL_NOT_CONFIGURED));',
  },
  {
    file: 'com/aerosuite/service/BackupConfigService.java',
    find: 'throw new IOException("Diretório não existe: " + path);',
    replace:
      'throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FOLDER_NOT_FOUND, "path", path));',
  },
  {
    file: 'com/aerosuite/service/BackupConfigService.java',
    find: 'throw new IOException("Caminho não é um diretório: " + path);',
    replace:
      'throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FOLDER_NOT_DIR, "path", path));',
  },
  {
    file: 'com/aerosuite/api/OSFileResource.java',
    find: 'throw new RuntimeException("Erro ao ler arquivo", e);',
    replace:
      'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FILE_READ_FAILED, e.getMessage()), e);',
  },
  {
    file: 'com/aerosuite/service/DocxToPdfConverter.java',
    find: 'throw new FileNotFoundException("Arquivo DOCX não encontrado: " + docxPath);',
    replace:
      'throw new FileNotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_DOCX_NOT_FOUND, "path", docxPath));',
  },
  {
    file: 'com/aerosuite/service/EmpresaAssetService.java',
    find: 'throw new IOException("Arquivo não enviado");',
    replace: 'throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_FILE_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/GoLiveMigracaoService.java',
    find: 'throw new IllegalArgumentException("Itens do checklist obrigatórios");',
    replace: 'throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.GOLIVE_CHECKLIST_REQUIRED));',
  },
  {
    file: 'com/aerosuite/service/GoLiveMigracaoService.java',
    find: 'default -> throw new IllegalArgumentException("Template desconhecido: " + templateId);',
    replace:
      'default -> throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TEMPLATE_INVALID, "id", templateId));',
  },
  {
    file: 'com/aerosuite/service/GoLiveMigracaoService.java',
    find: 'throw new IllegalStateException("Template não encontrado: " + file);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.GOLIVE_TEMPLATE_NOT_FOUND, "file", String.valueOf(file)));',
  },
  {
    file: 'com/aerosuite/service/GoLiveMigracaoService.java',
    find: 'throw new IllegalStateException("Erro ao ler template " + templateId, e);',
    replace:
      'throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.GOLIVE_TEMPLATE_READ_FAILED, templateId), e);',
  },
];

function ensureImport(src) {
  if (src.includes('import com.aerosuite.i18n.ApiI18nMessages;')) return src;
  const pkg = src.match(/^package [\w.]+;/m);
  if (!pkg) return src;
  return src.replace(pkg[0], pkg[0] + '\n\nimport com.aerosuite.i18n.ApiI18nMessages;');
}

let updated = 0;
let skipped = 0;

for (const r of REPLACEMENTS) {
  const filePath = path.join(javaRoot, r.file.replace(/\//g, path.sep));
  if (!fs.existsSync(filePath)) {
    console.warn('missing:', r.file);
    skipped++;
    continue;
  }
  let src = fs.readFileSync(filePath, 'utf8');
  const findStr = typeof r.find === 'string' ? r.find : r.find.source;
  if (!src.includes(findStr) && !(r.find instanceof RegExp && r.find.test(src))) {
    console.warn('not found in', r.file, ':', findStr.slice(0, 60));
    skipped++;
    continue;
  }
  const next =
    typeof r.find === 'string'
      ? src.replaceAll(r.find, r.replace)
      : src.replace(r.find, r.replace);
  if (next === src) {
    skipped++;
    continue;
  }
  fs.writeFileSync(filePath, ensureImport(next));
  console.log('updated:', r.file);
  updated++;
}

// OSFileService has duplicate "Erro ao criar pasta da OS" - handle count
const osFile = path.join(javaRoot, 'com', 'aerosuite', 'service', 'OSFileService.java');
if (fs.existsSync(osFile)) {
  let src = fs.readFileSync(osFile, 'utf8');
  const rep =
    'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FOLDER_CREATE_FAILED, String.valueOf(osId)), e);';
  const old = 'throw new RuntimeException("Erro ao criar pasta da OS: " + osId, e);';
  if (src.includes(old)) {
    src = src.replaceAll(old, rep);
    fs.writeFileSync(osFile, ensureImport(src));
    console.log('updated: OSFileService (all folder create)');
  }
}

// TpFilesService - 3 identical throws
const tpFiles = path.join(javaRoot, 'com', 'aerosuite', 'service', 'TpFilesService.java');
if (fs.existsSync(tpFiles)) {
  let src = fs.readFileSync(tpFiles, 'utf8');
  const old = 'throw new NotFoundException("Arquivo não encontrado com ID: " + id);';
  const rep =
    'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_NOT_FOUND, "id", String.valueOf(id)));';
  if (src.includes(old)) {
    src = src.replaceAll(old, rep);
    fs.writeFileSync(tpFiles, ensureImport(src));
    console.log('updated: TpFilesService (all)');
  }
}

// TemplateProdutoServicoService - 3 identical
const tpl = path.join(javaRoot, 'com', 'aerosuite', 'service', 'TemplateProdutoServicoService.java');
if (fs.existsSync(tpl)) {
  let src = fs.readFileSync(tpl, 'utf8');
  const old = 'throw new NotFoundException("Template não encontrado: " + id);';
  const rep =
    'throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.TEMPLATE_NOT_FOUND, "id", String.valueOf(id)));';
  if (src.includes(old)) {
    src = src.replaceAll(old, rep);
    fs.writeFileSync(tpl, ensureImport(src));
    console.log('updated: TemplateProdutoServicoService (all)');
  }
}

// BlingTenantApiClient - duplicate tenant no token
const blingClient = path.join(javaRoot, 'com', 'aerosuite', 'integration', 'bling', 'BlingTenantApiClient.java');
if (fs.existsSync(blingClient)) {
  let src = fs.readFileSync(blingClient, 'utf8');
  const old = 'throw new IllegalStateException("Tenant " + tenantId + " sem token Bling");';
  const rep =
    'throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_TENANT_NO_TOKEN, "tenantId", String.valueOf(tenantId)));';
  if (src.includes(old)) {
    src = src.replaceAll(old, rep);
    fs.writeFileSync(blingClient, ensureImport(src));
    console.log('updated: BlingTenantApiClient (all tenant token)');
  }
}

// FcuService duplicate dto convert
const fcu = path.join(javaRoot, 'com', 'aerosuite', 'service', 'FcuService.java');
if (fs.existsSync(fcu)) {
  let src = fs.readFileSync(fcu, 'utf8');
  const old = 'throw new RuntimeException("Erro ao converter FCU para DTO: " + e.getMessage(), e);';
  const rep =
    'throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_DTO_CONVERT_FAILED, e.getMessage()), e);';
  if (src.includes(old)) {
    src = src.replaceAll(old, rep);
    fs.writeFileSync(fcu, ensureImport(src));
    console.log('updated: FcuService (all dto convert)');
  }
}

// EmpresaAssetService 2x
const empresa = path.join(javaRoot, 'com', 'aerosuite', 'service', 'EmpresaAssetService.java');
if (fs.existsSync(empresa)) {
  let src = fs.readFileSync(empresa, 'utf8');
  const old = 'throw new IOException("Arquivo não enviado");';
  const rep = 'throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_FILE_REQUIRED));';
  if (src.includes(old)) {
    src = src.replaceAll(old, rep);
    fs.writeFileSync(empresa, ensureImport(src));
    console.log('updated: EmpresaAssetService (all)');
  }
}

console.log(`\nDone: ${updated} replacements, ${skipped} skipped`);
