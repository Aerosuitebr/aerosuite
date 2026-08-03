package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.bling.BlingBootstrapResultDto;
import com.aerosuite.integration.bling.BlingContactDto;
import com.aerosuite.integration.bling.BlingFiscalConfigUpdateDto;
import com.aerosuite.integration.bling.BlingImportClienteResultDto;
import com.aerosuite.integration.bling.BlingScopeProbe;
import com.aerosuite.integration.bling.BlingScopesStatusDto;
import com.aerosuite.integration.bling.BlingTenantApiClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

/**
 * Prepara dados mínimos na Bling para teste E2E (contato homologação + defaults fiscais).
 */
@ApplicationScoped
public class BlingBootstrapService {

    private static final Logger LOG = Logger.getLogger(BlingBootstrapService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static final String HOMOLOG_CONTACT_NAME = "Aero Suite Homologacao Cliente";
    public static final String HOMOLOG_CONTACT_CNPJ = "11695701000109";
    public static final String HOMOLOG_CONTACT_EMAIL = "homologacao@aerosuite.local";
    public static final String HOMOLOG_PRODUCT_CODE = "AERO-HML-SERV-001";

    @Inject
    BlingScopeProbe scopeProbe;

    @Inject
    BlingTenantApiClient tenantApiClient;

    @Inject
    BlingContactSyncService contactSyncService;

    @Inject
    TenantBlingFiscalConfigService fiscalConfigService;

    @Inject
    BlingWebhookHomologationService webhookHomologationService;

    @Transactional
    public BlingBootstrapResultDto runHomologacao(long tenantId, Integer userId) {
        BlingBootstrapResultDto out = new BlingBootstrapResultDto();
        out.scopes = scopeProbe.probe(tenantId);
        if (!out.scopes.allOk) {
            out.success = false;
            out.message = out.scopes.message;
            return out;
        }
        out.steps.add("Escopos OK");

        try {
            ensureFiscalDefaults(tenantId, out);
            BlingContactDto contact = ensureHomologContact(tenantId, out);
            ensureHomologProduct(tenantId, out);

            if (contact != null && contact.id != null) {
                BlingImportClienteResultDto imported =
                        contactSyncService.importContact(tenantId, contact.id, userId);
                out.blingContatoId = contact.id;
                out.blingContatoNome = contact.nome;
                out.contactImported = true;
                if (imported.cliente != null) {
                    out.clientePropostaId = imported.cliente.id;
                }
                out.steps.add("Contato importado como ClienteProposta id="
                        + (out.clientePropostaId != null ? out.clientePropostaId : "?"));
            }

            out.webhookHomologation = webhookHomologationService.run(tenantId);
            if (out.webhookHomologation.steps != null) {
                out.steps.addAll(out.webhookHomologation.steps);
            }
            if (out.webhookHomologation.webhookUrl != null) {
                out.steps.add("Webhook URL: " + out.webhookHomologation.webhookUrl);
            }

            out.success = true;
            out.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_BOOTSTRAP_COMPLETE);
            LOG.infof("Bootstrap Bling tenant %d: contato %s webhookOk=%s",
                    tenantId, out.blingContatoId, out.webhookHomologation.success);
        } catch (Exception e) {
            out.success = false;
            out.message = ApiI18nMessages.withDetail(ApiI18nMessages.BLING_BOOTSTRAP_FAILED, e.getMessage());
            LOG.warnf(e, "Bootstrap Bling tenant %d", tenantId);
        }
        return out;
    }

    private void ensureFiscalDefaults(long tenantId, BlingBootstrapResultDto out) {
        BlingFiscalConfigUpdateDto fiscal = new BlingFiscalConfigUpdateDto();
        fiscal.cfopPadrao = "5102";
        fiscal.serieNfe = "1";
        fiscal.naturezaOperacao = "Venda de mercadoria";
        fiscal.ncmPadrao = "88073000";
        fiscal.autoOsOnPedido = false;
        fiscal.autoEmitirNfe = false;
        fiscalConfigService.update(tenantId, fiscal);
        out.fiscalConfigured = true;
        out.steps.add("Configuração fiscal padrão aplicada (CFOP 5102, NCM 88073000)");
    }

    private BlingContactDto ensureHomologContact(long tenantId, BlingBootstrapResultDto out) throws Exception {
        BlingContactDto existing = findHomologContact(tenantId);
        if (existing != null) {
            ensureHomologContactCreditLimit(tenantId, existing.id, out);
            out.blingContatoId = existing.id;
            out.blingContatoNome = existing.nome;
            out.contactCreated = false;
            out.steps.add("Contato homologação já existe id=" + existing.id);
            return existing;
        }
        try {
            String json = buildHomologContactJson();
            BlingContactDto created = tenantApiClient.createContact(tenantId, json);
            out.blingContatoId = created.id;
            out.blingContatoNome = created.nome;
            out.contactCreated = true;
            out.steps.add("Contato homologação criado id=" + created.id);
            return created;
        } catch (IllegalStateException e) {
            if (e.getMessage() != null && e.getMessage().contains("cadastrado")) {
                BlingContactDto dup = findHomologContact(tenantId);
                if (dup != null) {
                    out.blingContatoId = dup.id;
                    out.blingContatoNome = dup.nome;
                    out.contactCreated = false;
                    out.steps.add("Contato homologação reutilizado (CNPJ já cadastrado) id=" + dup.id);
                    return dup;
                }
            }
            throw e;
        }
    }

    private BlingContactDto findHomologContact(long tenantId) {
        String cnpjDigits = HOMOLOG_CONTACT_CNPJ.replaceAll("\\D", "");
        for (String term : new String[] { cnpjDigits, "Homologacao", "HML" }) {
            java.util.List<BlingContactDto> found = tenantApiClient.searchContacts(tenantId, term, 20);
            for (BlingContactDto c : found) {
                if (matchesHomologContact(c)) {
                    return c;
                }
            }
        }
        return null;
    }

    private void ensureHomologContactCreditLimit(long tenantId, long blingContatoId, BlingBootstrapResultDto out) {
        try {
            ObjectNode patch = MAPPER.createObjectNode();
            patch.put("limiteCredito", 100000);
            tenantApiClient.updateContact(tenantId, blingContatoId, MAPPER.writeValueAsString(patch));
            out.steps.add("Limite de crédito homologação ajustado para 100000");
        } catch (Exception e) {
            out.steps.add("Limite de crédito não atualizado (opcional): " + e.getMessage());
        }
    }

    private static boolean matchesHomologContact(BlingContactDto c) {
        if (c == null) {
            return false;
        }
        if (c.nome != null) {
            String nome = c.nome.toLowerCase();
            if (nome.contains("homologacao") || nome.contains("hml test") || nome.contains("aero suite homolog")) {
                return true;
            }
        }
        if (c.cnpjCpf != null) {
            String doc = c.cnpjCpf.replaceAll("\\D", "");
            if (HOMOLOG_CONTACT_CNPJ.equals(doc)) {
                return true;
            }
        }
        return false;
    }

    private void ensureHomologProduct(long tenantId, BlingBootstrapResultDto out) {
        try {
            tenantApiClient.probeGet(tenantId, "/produtos?codigo=" + HOMOLOG_PRODUCT_CODE + "&limite=1");
        } catch (Exception e) {
            out.steps.add("Produtos: sem permissão ou indisponível — pedido usará item avulso");
            return;
        }
        try {
            ObjectNode root = MAPPER.createObjectNode();
            root.put("nome", "Servico Aeronautico Homologacao Aero Suite");
            root.put("codigo", HOMOLOG_PRODUCT_CODE);
            root.put("preco", 1500.00);
            root.put("tipo", "S");
            root.put("formato", "S");
            root.put("situacao", "A");
            Long id = tenantApiClient.createProduct(tenantId, MAPPER.writeValueAsString(root));
            out.blingProdutoId = id;
            out.steps.add("Produto homologação criado id=" + id);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("HTTP 400")) {
                out.steps.add("Produto homologação já existe ou código duplicado — OK");
            } else {
                out.steps.add("Produto opcional não criado: " + e.getMessage());
            }
        }
    }

    static String buildHomologContactJson() throws Exception {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("nome", HOMOLOG_CONTACT_NAME);
        root.put("tipo", "J");
        root.put("situacao", "A");
        root.put("limiteCredito", 100000);
        root.put("numeroDocumento", HOMOLOG_CONTACT_CNPJ);
        root.put("email", HOMOLOG_CONTACT_EMAIL);
        root.put("telefone", "21999990000");
        ObjectNode endereco = root.putObject("endereco");
        endereco.put("endereco", "Rua Teste Homologacao");
        endereco.put("numero", "100");
        endereco.put("bairro", "Centro");
        endereco.put("municipio", "Rio de Janeiro");
        endereco.put("uf", "RJ");
        endereco.put("cep", "20040020");
        return MAPPER.writeValueAsString(root);
    }
}
