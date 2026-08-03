package com.aerosuite.service;

import com.aerosuite.domain.TenantConstants;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.ClienteProposta;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.PropostaComercialItem;
import com.aerosuite.domain.PropostaComercialEnvio;
import com.aerosuite.domain.TipoServico;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.PropostaComercialMessages;
import com.aerosuite.i18n.TransactionalEmailMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.dto.PropostaCamposExtrasRegrasDto;
import com.aerosuite.dto.PropostaComercialDto;
import com.aerosuite.dto.EnviarPropostaEmailDto;
import com.aerosuite.mapping.PropostaComercialMapper;
import com.aerosuite.p1.TenantFeatureCodes;
import com.aerosuite.security.NativeQueryTenant;
import com.aerosuite.security.TenantDataAccess;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

/**
 * Service para Proposta Comercial
 */
@ApplicationScoped
public class PropostaComercialService {

    private static final Logger LOGGER = Logger.getLogger(PropostaComercialService.class.getName());

    /** Textos da seção CONDIÇÕES GERAIS usam {@link CommercialBrandingService#nameNormal()} / {@link CommercialBrandingService#nameUpper()} conforme o caso. */

    @Inject
    PropostaComercialMapper mapper;

    @Inject
    EmailService emailService;

    @Inject
    CommercialBrandingService commercialBranding;

    @Inject
    SistemaEmpresaConfigService sistemaEmpresaConfigService;

    @Inject
    EmpresaAssetService empresaAssetService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    NativeQueryTenant nativeQueryTenant;

    @Inject
    PropostaPortalV11Service propostaPortalV11Service;

    @Inject
    TenantFeatureService tenantFeatureService;
    
    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "frontend.url", defaultValue = "https://api.aerosuite.app")
    String baseApiUrl;

    public PropostaCamposExtrasRegrasDto camposExtrasRegras() {
        boolean on =
                tenantFeatureService.isEnabled(
                        currentTenantId(), TenantFeatureCodes.COMERCIAL_PROPOSTA_CAMPOS_EXTRAS);
        return new PropostaCamposExtrasRegrasDto(on);
    }

    private void applyCamposExtrasPolicy(PropostaComercialDto dto) {
        if (camposExtrasRegras().camposExtras()) {
            return;
        }
        dto.referenciaCliente = null;
        dto.contatoTecnico = null;
        dto.centroCusto = null;
    }

    private void persistCamposExtras(PropostaComercial entity, PropostaComercialDto dto) {
        if (!camposExtrasRegras().camposExtras()) {
            entity.referenciaCliente = null;
            entity.contatoTecnico = null;
            entity.centroCusto = null;
            return;
        }
        entity.referenciaCliente = trimOrNull(dto.referenciaCliente, 120);
        entity.contatoTecnico = trimOrNull(dto.contatoTecnico, 150);
        entity.centroCusto = trimOrNull(dto.centroCusto, 80);
    }

    private static String trimOrNull(String value, int maxLen) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() > maxLen ? t.substring(0, maxLen) : t;
    }

    private long currentTenantId() {
        return tenantDataAccess.currentTenantId();
    }

    private PropostaComercial requireProposta(Long id) {
        PropostaComercial entity = PropostaComercial
                .find("id = ?1", id)
                .firstResult();
        if (entity == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_NOT_FOUND, "id", String.valueOf(id)));
        }
        return entity;
    }

    private PropostaComercialMessages.Labels propostaLabels(String locale) {
        return PropostaComercialMessages.labels(PropostaComercialMessages.toLang(locale));
    }

    private List<String> condicoesGeraisFixas(String locale) {
        PropostaComercialMessages.Lang lang = PropostaComercialMessages.toLang(locale);
        return PropostaComercialMessages.condicoesGeraisFixas(
                lang, commercialBranding.nameNormal(), commercialBranding.nameUpper());
    }

    private String commercialAltText() {
        return escapeHtml(commercialBranding.nameNormal());
    }

    /**
     * Classe interna para resultado de busca paginada
     */
    public static class SearchResult {
        public List<PropostaComercialDto> content;
        public long totalElements;
        public int totalPages;
        public int page;
        public int size;
    }

    /**
     * Busca propostas com filtros e paginação
     */
    public SearchResult search(Integer page, Integer size, String sort, String q, String status) {
        int pageNum = page != null ? page : 0;
        int pageSize = size != null ? size : 10;

        // Construir query base
        StringBuilder jpql = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();


        // Filtro de busca geral
        if (q != null && !q.isBlank()) {
            conditions.add("(LOWER(numeroProposta) LIKE :q OR LOWER(clienteNome) LIKE :q OR LOWER(produtoNome) LIKE :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        // Filtro de status
        if (status != null && !status.isBlank()) {
            conditions.add("status = :status");
            params.put("status", status);
        }

        // Construir JPQL completo
        if (!conditions.isEmpty()) {
            jpql.append(String.join(" AND ", conditions));
        }

        // Sorting - sempre ordenar por data de criação descendente (mais recentes primeiro)
        Sort sortObj = Sort.by("createdAt").descending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0];
            boolean desc = parts.length > 1 && parts[1].equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        PanacheQuery<PropostaComercial> query;
        String queryString = jpql.toString();

        LOGGER.fine("Buscando propostas - JPQL: " + queryString + ", Params: " + params);

        query = PropostaComercial.find(queryString, sortObj, params);
        
        long total = query.count();
        
        List<PropostaComercial> entities = query.page(Page.of(pageNum, pageSize)).list();

        SearchResult result = new SearchResult();
        result.content = entities.stream()
                .map(entity -> {
                    PropostaComercialDto dto = mapper.toListDto(entity);
                    enrichOsVinculoForList(dto, entity);
                    return dto;
                })
                .collect(Collectors.toList());
        
        result.totalElements = total;
        result.totalPages = (int) Math.ceil((double) total / pageSize);
        result.page = pageNum;
        result.size = pageSize;
        
        LOGGER.fine("Propostas search: total=" + result.totalElements + ", page=" + pageNum + ", size=" + result.content.size());

        return result;
    }

    /**
     * Busca proposta por ID com todos os relacionamentos carregados
     * IMPORTANTE: Sempre carrega os itens da tabela proposta_comercial_item
     */
    public PropostaComercialDto findById(Long id) {
        LOGGER.info("Buscando proposta por ID: " + id);
        
        PropostaComercial entity = requireProposta(id);

        LOGGER.info("Proposta encontrada - ID: " + entity.id + ", Numero: " + entity.numeroProposta + ", Cliente: " + entity.clienteNome);
        
        // Mapear entidade para DTO
        PropostaComercialDto dto;
        try {
            dto = mapper.toDto(entity);
            // Garantir campos críticos
            if (dto == null) {
                LOGGER.warning("Mapper retornou null, criando DTO manualmente");
                dto = criarDtoManual(entity);
            } else {
                // Garantir campos críticos mesmo se mapper falhar parcialmente
                if (dto.id == null) dto.id = entity.id;
                if (dto.numeroProposta == null) dto.numeroProposta = entity.numeroProposta;
                if (dto.clienteNome == null) dto.clienteNome = entity.clienteNome;
                if (dto.produtoNome == null) dto.produtoNome = entity.produtoNome;
                if (dto.status == null) dto.status = entity.status;
            }
        } catch (Exception e) {
            LOGGER.severe("Erro ao mapear proposta ID: " + id + " - " + e.getMessage());
            LOGGER.log(Level.WARNING, "Erro inesperado", e);
            dto = criarDtoManual(entity);
        }
        
        // CRÍTICO: Sempre carregar itens da tabela proposta_comercial_item
        // O relacionamento é LAZY, então precisamos carregar explicitamente
        LOGGER.info("Carregando itens da proposta ID: " + id + " da tabela proposta_comercial_item");
        dto.itens = carregarItensParaDto(entity.id);
        LOGGER.info("Total de itens carregados no DTO: " + (dto.itens != null ? dto.itens.size() : 0));
        
        // Log detalhado dos itens carregados para debug
        if (dto.itens != null && !dto.itens.isEmpty()) {
            LOGGER.info("=== ITENS CARREGADOS ===");
            for (PropostaComercialDto.PropostaItemDto item : dto.itens) {
                LOGGER.info("  Item ID: " + item.id + 
                    " | Nome: " + item.produtoNome + 
                    " | P/N: " + (item.produtoPn != null ? item.produtoPn : "N/A") +
                    " | Qtd: " + item.quantidade + 
                    " | Valor Unit: " + item.valorUnitario + 
                    " | Total: " + item.valorTotal);
            }
        } else {
            LOGGER.warning("⚠️ NENHUM ITEM ENCONTRADO para a proposta ID: " + id + 
                " - Verifique se os itens foram salvos na tabela proposta_comercial_item");
        }

        enrichOsVinculo(dto, entity);
        dto.clienteDecisaoEm = entity.clienteDecisaoEm;
        dto.clienteDecisaoMotivo = entity.clienteDecisaoMotivo;
        dto.aditivos = propostaPortalV11Service.listarAditivosInterno(entity.id);
        dto.anexos = propostaPortalV11Service.listarAnexosInterno(entity.id);
        return dto;
    }

    /**
     * Itens da proposta para preview na listagem — sem aditivos, anexos ou consulta à OS.
     */
    public List<PropostaComercialDto.PropostaItemDto> listItens(Long id) {
        requireProposta(id);
        return carregarItensParaDto(id);
    }

    /**
     * Preenche campos de vínculo OS no DTO para listagem (sem consulta extra à OS).
     */
    void enrichOsVinculoForList(PropostaComercialDto dto, PropostaComercial entity) {
        if (dto == null || entity == null) {
            return;
        }
        dto.osId = entity.osId;
        dto.osGeradaEm = entity.osGeradaEm;
        dto.osGeradaPor = entity.osGeradaPor;
    }

    /**
     * Preenche campos de vínculo OS no DTO (P4.1), incluindo resumo da OS.
     */
    void enrichOsVinculo(PropostaComercialDto dto, PropostaComercial entity) {
        if (dto == null || entity == null) {
            return;
        }
        dto.osId = entity.osId;
        dto.osGeradaEm = entity.osGeradaEm;
        dto.osGeradaPor = entity.osGeradaPor;
        if (entity.osId == null) {
            dto.osResumoDtAbertura = null;
            dto.osResumoAtiva = null;
            dto.osResumoNumOsOriginal = null;
            return;
        }
        OS os = OS.findById(entity.osId);
        if (os != null) {
            dto.osResumoDtAbertura = os.dtAbertura;
            dto.osResumoAtiva = os.isActive;
            dto.osResumoNumOsOriginal = os.numOsOriginal;
        }
    }

    /**
     * Gera o próximo número de proposta único para o dia (formato PROP-YYYYMMDD-XXXX).
     * Usa o maior sufixo já existente no dia + 1, evitando duplicate key.
     */
    private String gerarProximoNumeroPropostaUnico() {
        String prefixo = "PROP-" + LocalDate.now().toString().replace("-", "");
        String likePrefix = prefixo + "-%";
        // Sufixo numérico começa na posição 15 (1-based): "PROP-20260225-" = 14 chars, então pos 15 = "0034"
        Object result = nativeQueryTenant.bindFilterTid(PropostaComercial.getEntityManager()
            .createNativeQuery(
                "SELECT COALESCE(MAX(CAST(SUBSTRING(numero_proposta, 15) AS UNSIGNED)), 0) + 1 "
                        + "FROM proposta_comercial WHERE numero_proposta LIKE ?1 AND tenant_id = :filterTid"))
            .setParameter(1, likePrefix)
            .getSingleResult();
        long proximo = ((Number) result).longValue();
        return prefixo + "-" + String.format("%04d", proximo);
    }

    /**
     * Cria nova proposta
     */
    @Transactional
    public PropostaComercialDto create(PropostaComercialDto dto) {
        applyCamposExtrasPolicy(dto);
        LOGGER.info("=== CRIANDO NOVA PROPOSTA ===");
        LOGGER.info("Cliente: " + dto.clienteNome + ", Produto: " + dto.produtoNome);
        LOGGER.info("Itens recebidos no DTO: " + (dto.itens != null ? dto.itens.size() : 0));
        
        // Log detalhado dos dados do cliente recebidos
        LOGGER.info("📋 DADOS DO CLIENTE RECEBIDOS:");
        LOGGER.info("  clienteNome: " + dto.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + dto.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + dto.clienteEmail);
        LOGGER.info("  clienteTelefone: " + dto.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + dto.clienteEndereco);
        LOGGER.info("  clienteBairro: " + dto.clienteBairro);
        LOGGER.info("  clienteCidade: " + dto.clienteCidade);
        LOGGER.info("  clienteEstado: " + dto.clienteEstado);
        LOGGER.info("  clienteCep: " + dto.clienteCep);
        LOGGER.info("  clienteContato: " + dto.clienteContato);
        
        // Log detalhado dos itens recebidos
        if (dto.itens != null && !dto.itens.isEmpty()) {
            LOGGER.info("📦 DETALHES DOS ITENS RECEBIDOS:");
            for (int i = 0; i < dto.itens.size(); i++) {
                PropostaComercialDto.PropostaItemDto item = dto.itens.get(i);
                LOGGER.info("  Item " + (i + 1) + ": Nome=" + item.produtoNome + 
                    ", P/N=" + item.produtoPn + 
                    ", Qtd=" + item.quantidade + 
                    ", Valor=" + item.valorTotal);
            }
        } else {
            LOGGER.warning("⚠️ ATENÇÃO: Nenhum item recebido no DTO! dto.itens é " + (dto.itens == null ? "null" : "vazio"));
        }
        
        PropostaComercial entity = mapper.toEntity(dto);
        persistCamposExtras(entity, dto);
        
        // CRÍTICO: Log dos dados do cliente APÓS mapeamento MapStruct (antes de qualquer modificação)
        LOGGER.info("📋 DADOS DO CLIENTE NA ENTIDADE (IMEDIATAMENTE APÓS MAPEAMENTO MAPSTRUCT):");
        LOGGER.info("  clienteNome: " + entity.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + entity.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + entity.clienteEmail);
        LOGGER.info("  clienteTelefone: " + entity.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + entity.clienteEndereco);
        LOGGER.info("  clienteBairro: " + entity.clienteBairro);
        LOGGER.info("  clienteCidade: " + entity.clienteCidade);
        LOGGER.info("  clienteEstado: " + entity.clienteEstado);
        LOGGER.info("  clienteCep: " + entity.clienteCep);
        LOGGER.info("  clienteContato: " + entity.clienteContato);
        
        // CRÍTICO: Garantir que a lista de itens está null/vazia para evitar cascade automático
        // Os itens serão salvos manualmente depois que a proposta for persistida
        if (entity.itens != null) {
            LOGGER.warning("⚠️ ATENÇÃO: Lista de itens não está vazia após mapeamento! Limpando...");
            entity.itens = null; // Limpar para evitar cascade automático
        }
        
        entity.tenantId = TenantConstants.tenantIdOf(currentTenantId());

        // Em create() SEMPRE gerar número novo e único: não usar DTO nem @PrePersist (evita duplicate key)
        entity.numeroProposta = gerarProximoNumeroPropostaUnico();
        
        // Buscar nome do tipo de serviço se id foi informado
        if (dto.idTipoServico != null) {
            TipoServico tipoServico = TipoServico.findById(dto.idTipoServico.longValue());
            if (tipoServico != null) {
                entity.tipoServicoNome = tipoServico.nome;
            }
        }
        
        // CRÍTICO: Garantir que os campos do cliente sejam SEMPRE definidos explicitamente
        // Não confiar apenas no MapStruct - sempre definir manualmente para garantir persistência
        // Convertendo strings vazias para null (padrão do sistema)
        entity.clienteNome = (dto.clienteNome != null && !dto.clienteNome.trim().isEmpty()) ? dto.clienteNome.trim() : null;
        entity.clienteCnpjCpf = (dto.clienteCnpjCpf != null && !dto.clienteCnpjCpf.trim().isEmpty()) ? dto.clienteCnpjCpf.trim() : null;
        entity.clienteEmail = (dto.clienteEmail != null && !dto.clienteEmail.trim().isEmpty()) ? dto.clienteEmail.trim() : null;
        entity.clienteTelefone = (dto.clienteTelefone != null && !dto.clienteTelefone.trim().isEmpty()) ? dto.clienteTelefone.trim() : null;
        entity.clienteEndereco = (dto.clienteEndereco != null && !dto.clienteEndereco.trim().isEmpty()) ? dto.clienteEndereco.trim() : null;
        entity.clienteBairro = (dto.clienteBairro != null && !dto.clienteBairro.trim().isEmpty()) ? dto.clienteBairro.trim() : null;
        entity.clienteCidade = (dto.clienteCidade != null && !dto.clienteCidade.trim().isEmpty()) ? dto.clienteCidade.trim() : null;
        entity.clienteEstado = (dto.clienteEstado != null && !dto.clienteEstado.trim().isEmpty()) ? dto.clienteEstado.trim() : null;
        entity.clienteCep = (dto.clienteCep != null && !dto.clienteCep.trim().isEmpty()) ? dto.clienteCep.trim() : null;
        entity.clienteContato = (dto.clienteContato != null && !dto.clienteContato.trim().isEmpty()) ? dto.clienteContato.trim() : null;
        entity.clienteObservacao = (dto.clienteObservacao != null && !dto.clienteObservacao.trim().isEmpty()) ? dto.clienteObservacao.trim() : null;
        entity.clientePropostaId = dto.clientePropostaId;
        entity.moedaProposta = normalizeMoedaProposta(dto.moedaProposta);
        entity.totalGeralBrl = dto.totalGeralBrl;
        entity.totalGeralEur = dto.totalGeralEur;
        
        // Log dos dados do cliente na entidade ANTES de persistir
        LOGGER.info("📋 DADOS DO CLIENTE NA ENTIDADE (após garantias explícitas, antes de persistir):");
        LOGGER.info("  clienteNome: " + entity.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + entity.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + entity.clienteEmail);
        LOGGER.info("  clienteTelefone: " + entity.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + entity.clienteEndereco);
        LOGGER.info("  clienteBairro: " + entity.clienteBairro);
        LOGGER.info("  clienteCidade: " + entity.clienteCidade);
        LOGGER.info("  clienteEstado: " + entity.clienteEstado);
        LOGGER.info("  clienteCep: " + entity.clienteCep);
        LOGGER.info("  clienteContato: " + entity.clienteContato);
        
        entity.persist();
        PropostaComercial.getEntityManager().flush(); // Forçar flush para garantir que foi persistido no banco
        
        LOGGER.info("✅ Proposta persistida - ID: " + entity.id + ", Numero: " + entity.numeroProposta + ", CreatedAt: " + entity.createdAt + ", Cliente: " + entity.clienteNome);
        
        // CRÍTICO: Consultar o banco diretamente para verificar se os dados foram realmente salvos
        PropostaComercial verificacao = requireProposta(entity.id);
        if (verificacao != null) {
            LOGGER.info("📋 DADOS DO CLIENTE APÓS PERSISTÊNCIA (verificação direta do banco):");
            LOGGER.info("  clienteNome: " + verificacao.clienteNome);
            LOGGER.info("  clienteCnpjCpf: " + verificacao.clienteCnpjCpf);
            LOGGER.info("  clienteEmail: " + verificacao.clienteEmail);
            LOGGER.info("  clienteTelefone: " + verificacao.clienteTelefone);
            LOGGER.info("  clienteEndereco: " + verificacao.clienteEndereco);
            LOGGER.info("  clienteBairro: " + verificacao.clienteBairro);
            LOGGER.info("  clienteCidade: " + verificacao.clienteCidade);
            LOGGER.info("  clienteEstado: " + verificacao.clienteEstado);
            LOGGER.info("  clienteCep: " + verificacao.clienteCep);
            LOGGER.info("  clienteContato: " + verificacao.clienteContato);
        } else {
            LOGGER.severe("❌ ERRO: Não foi possível encontrar a proposta ID: " + entity.id + " no banco após persistência!");
        }
        
        // CRÍTICO: Salvar itens se houver
        if (dto.itens != null && !dto.itens.isEmpty()) {
            LOGGER.info("💾 Iniciando salvamento de " + dto.itens.size() + " itens na tabela proposta_comercial_item");
            salvarItensDaProposta(entity, dto.itens);
        } else {
            LOGGER.warning("⚠️ Nenhum item para salvar na proposta ID: " + entity.id);
        }
        
        // CRÍTICO: Recarregar do banco novamente para garantir que temos os dados mais recentes
        PropostaComercial entityFinal = requireProposta(entity.id);
        
        // Log dos dados do cliente na entidade final antes de converter para DTO
        if (entityFinal != null) {
            LOGGER.info("📋 DADOS DO CLIENTE NA ENTIDADE FINAL (recarregada do banco antes de converter para DTO):");
            LOGGER.info("  clienteNome: " + entityFinal.clienteNome);
            LOGGER.info("  clienteCnpjCpf: " + entityFinal.clienteCnpjCpf);
            LOGGER.info("  clienteEmail: " + entityFinal.clienteEmail);
            LOGGER.info("  clienteTelefone: " + entityFinal.clienteTelefone);
            LOGGER.info("  clienteEndereco: " + entityFinal.clienteEndereco);
            LOGGER.info("  clienteBairro: " + entityFinal.clienteBairro);
            LOGGER.info("  clienteCidade: " + entityFinal.clienteCidade);
            LOGGER.info("  clienteEstado: " + entityFinal.clienteEstado);
            LOGGER.info("  clienteCep: " + entityFinal.clienteCep);
            LOGGER.info("  clienteContato: " + entityFinal.clienteContato);
        }
        
        // Converter para DTO
        PropostaComercialDto result = mapper.toDto(entityFinal != null ? entityFinal : entity);
        PropostaComercial propostaItens = entityFinal != null ? entityFinal : entity;
        result.itens = carregarItensParaDto(propostaItens.id);
        
        // Log dos dados do cliente no DTO de retorno
        LOGGER.info("📋 DADOS DO CLIENTE NO DTO DE RETORNO (após converter para DTO):");
        LOGGER.info("  clienteNome: " + result.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + result.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + result.clienteEmail);
        LOGGER.info("  clienteTelefone: " + result.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + result.clienteEndereco);
        LOGGER.info("  clienteBairro: " + result.clienteBairro);
        LOGGER.info("  clienteCidade: " + result.clienteCidade);
        LOGGER.info("  clienteEstado: " + result.clienteEstado);
        LOGGER.info("  clienteCep: " + result.clienteCep);
        LOGGER.info("  clienteContato: " + result.clienteContato);
        
        // CRÍTICO: Sempre garantir que os campos do cliente sejam copiados da entidade para o DTO
        // O MapStruct pode não mapear corretamente em alguns casos
        if (entityFinal != null) {
            boolean precisaCorrigir = false;
            if (result.clienteNome == null && entityFinal.clienteNome != null) {
                precisaCorrigir = true;
            } else if (result.clienteNome != null && !result.clienteNome.equals(entityFinal.clienteNome)) {
                precisaCorrigir = true;
            }
            
            if (precisaCorrigir) {
                LOGGER.warning("⚠️ CORREÇÃO: Campos do cliente não foram mapeados corretamente pelo MapStruct, corrigindo manualmente");
                result.clienteNome = entityFinal.clienteNome;
                result.clienteCnpjCpf = entityFinal.clienteCnpjCpf;
                result.clienteEmail = entityFinal.clienteEmail;
                result.clienteTelefone = entityFinal.clienteTelefone;
                result.clienteEndereco = entityFinal.clienteEndereco;
                result.clienteBairro = entityFinal.clienteBairro;
                result.clienteCidade = entityFinal.clienteCidade;
                result.clienteEstado = entityFinal.clienteEstado;
                result.clienteCep = entityFinal.clienteCep;
                result.clienteContato = entityFinal.clienteContato;
                result.clienteObservacao = entityFinal.clienteObservacao;
            }
        }
        
        LOGGER.info("✅ Proposta criada com sucesso - ID: " + result.id + ", Total de itens salvos: " + (result.itens != null ? result.itens.size() : 0));
        return result;
    }

    /**
     * Atualiza proposta existente
     */
    @Transactional
    public PropostaComercialDto update(Long id, PropostaComercialDto dto) {
        applyCamposExtrasPolicy(dto);
        PropostaComercial entity = requireProposta(id);

        // Log dos dados recebidos antes do mapeamento
        LOGGER.info("=== ATUALIZANDO PROPOSTA ID: " + id + " ===");
        LOGGER.info("Dados do cliente recebidos:");
        LOGGER.info("  clienteNome: " + dto.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + dto.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + dto.clienteEmail);
        LOGGER.info("  clienteTelefone: " + dto.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + dto.clienteEndereco);
        LOGGER.info("  clienteCidade: " + dto.clienteCidade);
        LOGGER.info("  clienteEstado: " + dto.clienteEstado);
        LOGGER.info("  clienteCep: " + dto.clienteCep);
        LOGGER.info("  clienteContato: " + dto.clienteContato);
        
        // Log dos dados atuais antes da atualização
        LOGGER.info("Dados do cliente atuais (antes do update):");
        LOGGER.info("  clienteNome: " + entity.clienteNome);
        LOGGER.info("  clienteEmail: " + entity.clienteEmail);
        
        mapper.updateEntityFromDto(dto, entity);
        
        // CRÍTICO: Forçar atualização dos campos do cliente SEMPRE, independente do MapStruct
        // Sempre definir explicitamente para garantir que sejam persistidos
        // Convertendo strings vazias para null (padrão do sistema)
        entity.clienteNome = (dto.clienteNome != null && !dto.clienteNome.trim().isEmpty()) ? dto.clienteNome.trim() : null;
        entity.clienteCnpjCpf = (dto.clienteCnpjCpf != null && !dto.clienteCnpjCpf.trim().isEmpty()) ? dto.clienteCnpjCpf.trim() : null;
        entity.clienteEmail = (dto.clienteEmail != null && !dto.clienteEmail.trim().isEmpty()) ? dto.clienteEmail.trim() : null;
        entity.clienteTelefone = (dto.clienteTelefone != null && !dto.clienteTelefone.trim().isEmpty()) ? dto.clienteTelefone.trim() : null;
        entity.clienteEndereco = (dto.clienteEndereco != null && !dto.clienteEndereco.trim().isEmpty()) ? dto.clienteEndereco.trim() : null;
        entity.clienteBairro = (dto.clienteBairro != null && !dto.clienteBairro.trim().isEmpty()) ? dto.clienteBairro.trim() : null;
        entity.clienteCidade = (dto.clienteCidade != null && !dto.clienteCidade.trim().isEmpty()) ? dto.clienteCidade.trim() : null;
        entity.clienteEstado = (dto.clienteEstado != null && !dto.clienteEstado.trim().isEmpty()) ? dto.clienteEstado.trim() : null;
        entity.clienteCep = (dto.clienteCep != null && !dto.clienteCep.trim().isEmpty()) ? dto.clienteCep.trim() : null;
        entity.clienteContato = (dto.clienteContato != null && !dto.clienteContato.trim().isEmpty()) ? dto.clienteContato.trim() : null;
        entity.clienteObservacao = (dto.clienteObservacao != null && !dto.clienteObservacao.trim().isEmpty()) ? dto.clienteObservacao.trim() : null;
        entity.clientePropostaId = dto.clientePropostaId;
        persistCamposExtras(entity, dto);

        // CRÍTICO: Atualizar explicitamente custos adicionais e cotação para permitir
        // tanto alteração quanto zeragem (frontend envia "undefined" quando valor = 0,
        // e o MapStruct está configurado para IGNORE em null).
        entity.freteBrl = dto.freteBrl;
        entity.maoDeObraBrl = dto.maoDeObraBrl;
        entity.freteUsd = dto.freteUsd;
        entity.maoDeObraUsd = dto.maoDeObraUsd;
        entity.cotacaoDolar = dto.cotacaoDolar;
        entity.dataCotacao = dto.dataCotacao;
        entity.subtotalProdutosUsd = dto.subtotalProdutosUsd;
        entity.totalGeralUsd = dto.totalGeralUsd;
        entity.moedaProposta = normalizeMoedaProposta(dto.moedaProposta);
        entity.totalGeralBrl = dto.totalGeralBrl;
        entity.totalGeralEur = dto.totalGeralEur;

        LOGGER.info("💰 CUSTOS ADICIONAIS / COTAÇÃO (após atualização explícita):");
        LOGGER.info("  freteBrl: " + entity.freteBrl + " | maoDeObraBrl: " + entity.maoDeObraBrl);
        LOGGER.info("  freteUsd: " + entity.freteUsd + " | maoDeObraUsd: " + entity.maoDeObraUsd);
        LOGGER.info("  cotacaoDolar: " + entity.cotacaoDolar + " | dataCotacao: " + entity.dataCotacao);
        LOGGER.info("  subtotalProdutosUsd: " + entity.subtotalProdutosUsd + " | totalGeralUsd: " + entity.totalGeralUsd);
        LOGGER.info("  moedaProposta: " + entity.moedaProposta + " | totalGeralBrl: " + entity.totalGeralBrl);

        // Assinatura: atualizar quando enviada no DTO; preservar quando omitida (null)
        if (dto.assinaturaNome != null) {
            entity.assinaturaNome = dto.assinaturaNome.isBlank() ? null : dto.assinaturaNome.trim();
        }
        if (dto.assinaturaEstilo != null) {
            entity.assinaturaEstilo = dto.assinaturaEstilo.isBlank() ? null : dto.assinaturaEstilo.trim();
        }
        if (dto.assinaturaFontFamily != null) {
            entity.assinaturaFontFamily =
                    dto.assinaturaFontFamily.isBlank() ? null : dto.assinaturaFontFamily.trim();
        }
        if (dto.assinaturaColor != null) {
            entity.assinaturaColor = dto.assinaturaColor.isBlank() ? null : dto.assinaturaColor.trim();
        }

        // Log dos dados após o mapeamento e atualização explícita
        LOGGER.info("Dados do cliente após mapeamento e atualização explícita:");
        LOGGER.info("  clienteNome: " + entity.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + entity.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + entity.clienteEmail);
        LOGGER.info("  clienteTelefone: " + entity.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + entity.clienteEndereco);
        LOGGER.info("  clienteBairro: " + entity.clienteBairro);
        LOGGER.info("  clienteCidade: " + entity.clienteCidade);
        LOGGER.info("  clienteEstado: " + entity.clienteEstado);
        LOGGER.info("  clienteCep: " + entity.clienteCep);
        LOGGER.info("  clienteContato: " + entity.clienteContato);
        
        // Atualizar nome do tipo de serviço se id foi alterado
        if (dto.idTipoServico != null) {
            TipoServico tipoServico = TipoServico.findById(dto.idTipoServico.longValue());
            if (tipoServico != null) {
                entity.tipoServicoNome = tipoServico.nome;
            }
        }
        
        // Atualizar itens
        if (dto.itens != null) {
            // CRÍTICO: Para evitar erro com orphanRemoval, precisamos:
            // 1. Carregar a lista de itens primeiro (se ainda não estiver carregada)
            if (entity.itens == null) {
                entity.itens = PropostaComercialItem.find("propostaComercial = ?1", entity).list();
            }
            // 2. Limpar a lista (isso aciona o orphanRemoval corretamente)
            if (entity.itens != null && !entity.itens.isEmpty()) {
                entity.itens.clear();
            }
            // 3. Salvar novos itens
            salvarItensDaProposta(entity, dto.itens);
        }
        
        entity.persist();
        PropostaComercial.getEntityManager().flush(); // Forçar flush para garantir que foi persistido no banco
        
        // CRÍTICO: Consultar o banco diretamente para verificar se os dados foram realmente salvos
        PropostaComercial verificacao = requireProposta(entity.id);
        if (verificacao != null) {
            LOGGER.info("📋 DADOS DO CLIENTE APÓS ATUALIZAÇÃO E PERSISTÊNCIA (verificação direta do banco):");
            LOGGER.info("  clienteNome: " + verificacao.clienteNome);
            LOGGER.info("  clienteCnpjCpf: " + verificacao.clienteCnpjCpf);
            LOGGER.info("  clienteEmail: " + verificacao.clienteEmail);
            LOGGER.info("  clienteTelefone: " + verificacao.clienteTelefone);
            LOGGER.info("  clienteEndereco: " + verificacao.clienteEndereco);
            LOGGER.info("  clienteBairro: " + verificacao.clienteBairro);
            LOGGER.info("  clienteCidade: " + verificacao.clienteCidade);
            LOGGER.info("  clienteEstado: " + verificacao.clienteEstado);
            LOGGER.info("  clienteCep: " + verificacao.clienteCep);
            LOGGER.info("  clienteContato: " + verificacao.clienteContato);
        } else {
            LOGGER.severe("❌ ERRO: Não foi possível encontrar a proposta ID: " + entity.id + " no banco após atualização!");
        }
        
        // Log dos dados do cliente na entidade antes de converter para DTO
        LOGGER.info("📋 DADOS DO CLIENTE NA ENTIDADE (antes de converter para DTO no update):");
        LOGGER.info("  clienteNome: " + entity.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + entity.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + entity.clienteEmail);
        LOGGER.info("  clienteTelefone: " + entity.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + entity.clienteEndereco);
        LOGGER.info("  clienteBairro: " + entity.clienteBairro);
        LOGGER.info("  clienteCidade: " + entity.clienteCidade);
        LOGGER.info("  clienteEstado: " + entity.clienteEstado);
        LOGGER.info("  clienteCep: " + entity.clienteCep);
        LOGGER.info("  clienteContato: " + entity.clienteContato);
        
        PropostaComercialDto result = mapper.toDto(entity);
        result.itens = carregarItensParaDto(entity.id);
        
        // Log dos dados do cliente no DTO de retorno
        LOGGER.info("📋 DADOS DO CLIENTE NO DTO DE RETORNO (após converter para DTO no update):");
        LOGGER.info("  clienteNome: " + result.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + result.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + result.clienteEmail);
        LOGGER.info("  clienteTelefone: " + result.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + result.clienteEndereco);
        LOGGER.info("  clienteBairro: " + result.clienteBairro);
        LOGGER.info("  clienteCidade: " + result.clienteCidade);
        LOGGER.info("  clienteEstado: " + result.clienteEstado);
        LOGGER.info("  clienteCep: " + result.clienteCep);
        LOGGER.info("  clienteContato: " + result.clienteContato);
        
        // CRÍTICO: Sempre garantir que os campos do cliente sejam copiados da entidade para o DTO
        // O MapStruct pode não mapear corretamente em alguns casos
        boolean precisaCorrigir = false;
        if (result.clienteNome == null && entity.clienteNome != null) {
            precisaCorrigir = true;
        } else if (result.clienteNome != null && !result.clienteNome.equals(entity.clienteNome)) {
            precisaCorrigir = true;
        }
        
        if (precisaCorrigir) {
            LOGGER.warning("⚠️ CORREÇÃO: Campos do cliente não foram mapeados corretamente pelo MapStruct no update, corrigindo manualmente");
            result.clienteNome = entity.clienteNome;
            result.clienteCnpjCpf = entity.clienteCnpjCpf;
            result.clienteEmail = entity.clienteEmail;
            result.clienteTelefone = entity.clienteTelefone;
            result.clienteEndereco = entity.clienteEndereco;
            result.clienteBairro = entity.clienteBairro;
            result.clienteCidade = entity.clienteCidade;
            result.clienteEstado = entity.clienteEstado;
            result.clienteCep = entity.clienteCep;
            result.clienteContato = entity.clienteContato;
            result.clienteObservacao = entity.clienteObservacao;
        }
        
        return result;
    }

    /**
     * Exclui proposta
     */
    @Transactional
    public void delete(Long id) {
        requireProposta(id).delete();
    }

    /**
     * Altera status da proposta
     */
    @Transactional
    public PropostaComercialDto changeStatus(Long id, String newStatus) {
        PropostaComercial entity = requireProposta(id);
        entity.status = newStatus;
        entity.persist();
        return mapper.toDto(entity);
    }

    /**
     * Duplica uma proposta existente
     */
    @Transactional
    public PropostaComercialDto duplicate(Long id) {
        PropostaComercial original = requireProposta(id);

        PropostaComercial nova = new PropostaComercial();
        nova.tenantId = TenantConstants.tenantIdOf(currentTenantId());
        nova.numeroProposta = gerarProximoNumeroPropostaUnico();
        // Copiar dados do produto
        nova.produtoNome = original.produtoNome;
        nova.produtoPn = original.produtoPn;
        nova.produtoSn = original.produtoSn;
        nova.produtoManual = original.produtoManual;
        nova.produtoValor = original.produtoValor;
        nova.aplicacaoMotor = original.aplicacaoMotor;
        nova.aeronavePrefixo = original.aeronavePrefixo;
        nova.servicoExecutado = original.servicoExecutado;
        nova.idTipoServico = original.idTipoServico;
        nova.tipoServicoNome = original.tipoServicoNome;

        // Copiar dados do cliente
        nova.clienteNome = original.clienteNome;
        nova.clienteCnpjCpf = original.clienteCnpjCpf;
        nova.clienteEmail = original.clienteEmail;
        nova.clienteTelefone = original.clienteTelefone;
        nova.clienteEndereco = original.clienteEndereco;
        nova.clienteCidade = original.clienteCidade;
        nova.clienteEstado = original.clienteEstado;
        nova.clienteCep = original.clienteCep;
        nova.clienteContato = original.clienteContato;
        nova.clienteObservacao = original.clienteObservacao;

        // Dados da proposta
        nova.prazoEntrega = original.prazoEntrega;
        nova.formaPagamento = original.formaPagamento;
        nova.observacoes = original.observacoes;
        nova.condicoesGerais = original.condicoesGerais;
        nova.referenciaCliente = original.referenciaCliente;
        nova.contatoTecnico = original.contatoTecnico;
        nova.centroCusto = original.centroCusto;
        nova.validadeProposta = original.validadeProposta;
        
        // Dados de desconto
        nova.descontoTipo = original.descontoTipo;
        nova.descontoPercentual = original.descontoPercentual;
        nova.descontoValorFixo = original.descontoValorFixo;
        nova.descontoValorCalculado = original.descontoValorCalculado;
        nova.valorTotalFinal = original.valorTotalFinal;
        
        // Dados da assinatura (não copia - será nova assinatura)
        
        // Status sempre RASCUNHO para proposta duplicada
        nova.status = "RASCUNHO";

        nova.persist();
        
        // Copiar itens da proposta original
        List<PropostaComercialItem> itensOriginais = PropostaComercialItem.find("propostaComercial = ?1", Sort.by("ordem").ascending(), original)
            .list();
        
        if (itensOriginais != null && !itensOriginais.isEmpty()) {
            List<PropostaComercialDto.PropostaItemDto> itensDto = new ArrayList<>();
            for (PropostaComercialItem item : itensOriginais) {
                PropostaComercialDto.PropostaItemDto itemDto = new PropostaComercialDto.PropostaItemDto();
                itemDto.produtoNome = item.produtoNome;
                itemDto.produtoDescricao = item.produtoDescricao;
                itemDto.produtoPn = item.produtoPn;
                itemDto.produtoSn = item.produtoSn;
                itemDto.quantidade = item.quantidade;
                itemDto.valorUnitario = item.valorUnitario;
                itemDto.valorTotal = item.valorTotal;
                itemDto.ordem = item.ordem;
                itensDto.add(itemDto);
            }
            salvarItensDaProposta(nova, itensDto);
        }
        
        PropostaComercialDto result = mapper.toDto(nova);
        result.itens = carregarItensParaDto(nova.id);
        return result;
    }

    /**
     * Salva assinatura na proposta
     */
    @Transactional
    public PropostaComercialDto salvarAssinatura(Long id, EnviarPropostaEmailDto.SignatureDto signature) {
        PropostaComercial entity = requireProposta(id);

        entity.assinaturaNome = signature.name;
        entity.assinaturaEstilo = signature.styleId;
        entity.assinaturaFontFamily = signature.fontFamily;
        entity.assinaturaColor = signature.color;
        entity.assinaturaTimestamp = LocalDateTime.now();

        entity.persist();
        return mapper.toDto(entity);
    }

    private static String normalizeMoedaProposta(String moeda) {
        if (moeda == null || moeda.isBlank()) {
            return "USD";
        }
        String m = moeda.trim().toUpperCase(java.util.Locale.ROOT);
        if ("BRL".equals(m) || "EUR".equals(m)) {
            return m;
        }
        return "USD";
    }

    /**
     * Persiste no banco o snapshot enviado pelo cliente (datas, moeda, totais, itens, assinatura).
     */
    private void aplicarSnapshotEnvio(PropostaComercial proposta, EnviarPropostaEmailDto dto) {
        if (proposta == null || dto == null) {
            return;
        }
        if (dto.dataProposta != null) {
            proposta.dataProposta = dto.dataProposta;
        }
        if (dto.validadeProposta != null) {
            proposta.validadeProposta = dto.validadeProposta;
        }
        if (dto.moedaProposta != null && !dto.moedaProposta.isBlank()) {
            proposta.moedaProposta = normalizeMoedaProposta(dto.moedaProposta);
        }
        if (dto.valorTotalFinal != null) {
            proposta.valorTotalFinal = dto.valorTotalFinal;
        }
        if (dto.totalGeralBrl != null) {
            proposta.totalGeralBrl = dto.totalGeralBrl;
        }
        if (dto.totalGeralEur != null) {
            proposta.totalGeralEur = dto.totalGeralEur;
        }
        if (dto.totalGeralUsd != null) {
            proposta.totalGeralUsd = dto.totalGeralUsd;
        }
        if (dto.freteBrl != null) {
            proposta.freteBrl = dto.freteBrl;
        }
        if (dto.maoDeObraBrl != null) {
            proposta.maoDeObraBrl = dto.maoDeObraBrl;
        }
        if (dto.freteUsd != null) {
            proposta.freteUsd = dto.freteUsd;
        }
        if (dto.maoDeObraUsd != null) {
            proposta.maoDeObraUsd = dto.maoDeObraUsd;
        }
        if (dto.cotacaoDolar != null) {
            proposta.cotacaoDolar = dto.cotacaoDolar;
        }
        if (dto.dataCotacao != null) {
            proposta.dataCotacao = dto.dataCotacao;
        }
        if (dto.descontoTipo != null) {
            proposta.descontoTipo = dto.descontoTipo.isBlank() ? null : dto.descontoTipo.trim();
        }
        if (dto.descontoPercentual != null) {
            proposta.descontoPercentual = dto.descontoPercentual;
        }
        if (dto.descontoValorFixo != null) {
            proposta.descontoValorFixo = dto.descontoValorFixo;
        }
        if (dto.descontoValorCalculado != null) {
            proposta.descontoValorCalculado = dto.descontoValorCalculado;
        }

        if (dto.signature != null && dto.signature.name != null && !dto.signature.name.isBlank()) {
            proposta.assinaturaNome = dto.signature.name.trim();
            proposta.assinaturaEstilo = dto.signature.styleId;
            proposta.assinaturaFontFamily = dto.signature.fontFamily;
            proposta.assinaturaColor = dto.signature.color;
            proposta.assinaturaTimestamp = LocalDateTime.now();
        }

        if (dto.items != null && !dto.items.isEmpty()) {
            List<PropostaComercialDto.PropostaItemDto> itensDto = new ArrayList<>();
            int ordem = 0;
            for (EnviarPropostaEmailDto.PropostaItemDto item : dto.items) {
                PropostaComercialDto.PropostaItemDto itemDto = new PropostaComercialDto.PropostaItemDto();
                itemDto.produtoNome = item.produtoNome;
                itemDto.produtoDescricao = item.produtoDescricao;
                itemDto.produtoPn = item.produtoPn;
                itemDto.produtoSn = item.produtoSn;
                itemDto.quantidade = item.quantidade;
                itemDto.valorUnitario = item.valorUnitario;
                itemDto.valorTotal = item.valorTotal;
                itemDto.ordem = ordem++;
                itensDto.add(itemDto);
            }
            salvarItensDaProposta(proposta, itensDto);
        }

        proposta.persist();
        PropostaComercial.getEntityManager().flush();
        LOGGER.info(
                "Snapshot de envio persistido — proposta "
                        + proposta.id
                        + " moeda="
                        + proposta.moedaProposta
                        + " data="
                        + proposta.dataProposta
                        + " assinatura="
                        + (proposta.assinaturaNome != null ? "sim" : "nao"));
    }

    /**
     * Envia proposta por email
     */
    @Transactional
    public Map<String, Object> enviarPorEmail(EnviarPropostaEmailDto dto) {
        Map<String, Object> result = new HashMap<>();

        try {
            LOGGER.info("Iniciando envio de email para proposta ID: " + dto.propostaId);

            // Buscar a proposta
            PropostaComercial proposta = requireProposta(dto.propostaId);

            // Persistir snapshot completo (valores, datas, moeda, itens, assinatura) antes do e-mail
            aplicarSnapshotEnvio(proposta, dto);
            proposta = requireProposta(dto.propostaId);

            // Determinar email de destino
            String emailDestino = dto.emailDestino != null && !dto.emailDestino.isBlank()
                ? dto.emailDestino
                : proposta.clienteEmail;

            if (emailDestino == null || emailDestino.isBlank()) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_EMAIL_DESTINO_REQUIRED));
            }

            String emailLocale = resolveClienteEmailLocale(proposta);

            // Montar assunto
            String assunto = dto.assunto != null && !dto.assunto.isBlank()
                ? dto.assunto
                : TransactionalEmailMessages.propostaComercialEmailSubject(
                        emailLocale, proposta.numeroProposta, commercialBranding.emailSubjectSuffix());

            // Verificar tipo de envio
            String tipoEnvio = dto.tipoEnvio != null && !dto.tipoEnvio.isBlank() 
                ? dto.tipoEnvio 
                : "corpo";
            
            // Carregar itens salvos se não houver itens no DTO
            List<EnviarPropostaEmailDto.PropostaItemDto> itensParaEnvio = dto.items;
            if (itensParaEnvio == null || itensParaEnvio.isEmpty()) {
                // Converter itens salvos para o formato do DTO de envio
                List<PropostaComercialItem> itensSalvos = PropostaComercialItem.find("propostaComercial = ?1", Sort.by("ordem").ascending(), proposta)
                    .list();
                itensParaEnvio = new ArrayList<>();
                for (PropostaComercialItem item : itensSalvos) {
                    EnviarPropostaEmailDto.PropostaItemDto itemDto = new EnviarPropostaEmailDto.PropostaItemDto();
                    itemDto.produtoNome = item.produtoNome;
                    itemDto.produtoDescricao = item.produtoDescricao;
                    itemDto.produtoPn = item.produtoPn;
                    itemDto.produtoSn = item.produtoSn;
                    itemDto.quantidade = item.quantidade;
                    itemDto.valorUnitario = item.valorUnitario;
                    itemDto.valorTotal = item.valorTotal;
                    itensParaEnvio.add(itemDto);
                }
            }
            
            String htmlBody;
            String textBody;
            byte[] pdfAnexo = null;
            String nomeAnexo = null;

            if ("anexo".equalsIgnoreCase(tipoEnvio)) {
                // Quando for anexo, usar apenas a mensagem personalizada (sem HTML completo da proposta)
                htmlBody = buildMensagemSimplesHtml(emailLocale, dto.mensagemAdicional, dto.signature);
                textBody = dto.mensagemAdicional != null && !dto.mensagemAdicional.isBlank() 
                    ? dto.mensagemAdicional 
                    : buildMensagemSimplesText(emailLocale, dto.signature);
                
                // Gerar PDF da proposta para anexar
                LOGGER.info("Gerando PDF da proposta para anexo...");
                pdfAnexo = generatePropostaPdf(proposta, itensParaEnvio, dto.signature, emailLocale);
                nomeAnexo = TransactionalEmailMessages.propostaComercialPdfFilename(
                        emailLocale, proposta.numeroProposta);
                LOGGER.info("PDF gerado com sucesso. Tamanho: " + (pdfAnexo != null ? pdfAnexo.length : 0) + " bytes");
            } else {
                // Quando for no corpo, usar HTML completo da proposta
                htmlBody = buildPropostaEmailHtml(
                        proposta,
                        dto.mensagemAdicional,
                        dto.signature,
                        itensParaEnvio,
                        dto.telefoneRemetente,
                        dto.emailRemetente,
                        emailLocale);
                textBody = buildPropostaEmailText(
                        proposta,
                        dto.mensagemAdicional,
                        itensParaEnvio,
                        dto.telefoneRemetente,
                        dto.emailRemetente,
                        emailLocale);
            }

            // Enviar email
            LOGGER.info("Enviando email para: " + emailDestino + " (tipo: " + tipoEnvio + ")");
            boolean enviado = emailService.sendEmail(emailDestino, assunto, htmlBody, textBody, pdfAnexo, nomeAnexo);

            if (enviado) {
                // Atualizar status da proposta
                proposta.status = "ENVIADA";
                proposta.persist();

                // Salvar dados de envio
                PropostaComercialEnvio envio = new PropostaComercialEnvio();
                envio.propostaComercial = proposta;
                envio.tipoEnvio = "EMAIL";
                envio.canal = tipoEnvio;
                envio.destinatarioEmail = emailDestino;
                envio.destinatarioNome = proposta.clienteNome;
                envio.remetenteEmail = dto.emailRemetente;
                envio.remetenteTelefone = dto.telefoneRemetente;
                envio.assunto = assunto;
                envio.mensagemAdicional = dto.mensagemAdicional;
                envio.status = "ENVIADO";
                envio.dataEnvio = LocalDateTime.now();
                envio.persist();

                result.put("success", true);
                result.put(
                        "message",
                        ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_EMAIL_SENT, "email", emailDestino));
                LOGGER.info("Email enviado com sucesso para: " + emailDestino);
            } else {
                // Salvar tentativa de envio com falha
                PropostaComercialEnvio envio = new PropostaComercialEnvio();
                envio.propostaComercial = proposta;
                envio.tipoEnvio = "EMAIL";
                envio.canal = tipoEnvio;
                envio.destinatarioEmail = emailDestino;
                envio.destinatarioNome = proposta.clienteNome;
                envio.remetenteEmail = dto.emailRemetente;
                envio.remetenteTelefone = dto.telefoneRemetente;
                envio.assunto = assunto;
                envio.mensagemAdicional = dto.mensagemAdicional;
                envio.status = "FALHA";
                envio.mensagemErro = ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_EMAIL_SEND_FAILED);
                envio.dataEnvio = LocalDateTime.now();
                envio.persist();

                result.put("success", false);
                result.put("message", ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_EMAIL_SEND_FAILED));
                LOGGER.warning("Falha ao enviar email para: " + emailDestino);
            }

        } catch (Exception e) {
            LOGGER.severe("Erro ao enviar email da proposta: " + e.getMessage());
            LOGGER.log(Level.WARNING, "Erro inesperado", e);
            result.put("success", false);
            result.put(
                    "message",
                    ApiI18nMessages.withDetail(ApiI18nMessages.PROPOSTA_EMAIL_SEND_ERROR, e.getMessage()));
        }

        return result;
    }

    /**
     * Constrói o HTML do email da proposta
     */
    private String buildPropostaEmailHtml(
            PropostaComercial proposta,
            String mensagemAdicional,
            EnviarPropostaEmailDto.SignatureDto signature,
            List<EnviarPropostaEmailDto.PropostaItemDto> items,
            String telefoneRemetente,
            String emailRemetente,
            String locale) {
        PropostaComercialMessages.Lang lang = PropostaComercialMessages.toLang(locale);
        PropostaComercialMessages.Labels m = propostaLabels(locale);
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html lang=\"").append(PropostaComercialMessages.htmlLang(lang)).append("\">");
        html.append("<head>");
        html.append("<meta charset=\"UTF-8\">");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        html.append("<title>").append(m.docTitulo()).append("</title>");
        html.append("<style>");
        html.append("@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Tangerine:wght@400;700&family=Pacifico&family=Kaushan+Script&family=Pinyon+Script&family=Caveat:wght@400;600;700&family=Dancing+Script:wght@400;700&family=Sacramento&family=Alex+Brush&display=swap');");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }");
        html.append(".email-container { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; position: relative; }");
        html.append(".header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; }");
        html.append(".header-top { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }");
        html.append(".logo-box { width: 90px; height: 90px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }");
        html.append(".company-info { flex: 1; }");
        html.append(".company-name { font-size: 24px; font-weight: 700; color: white; margin: 0; }");
        html.append(".company-specialty { font-size: 14px; color: rgba(255,255,255,0.9); margin-top: 5px; }");
        html.append(".header-title { text-align: center; margin-top: 20px; }");
        html.append(".header h1 { margin: 0; font-size: 28px; font-weight: 700; }");
        html.append(".header .proposta-num { font-size: 16px; opacity: 0.9; margin-top: 8px; }");
        html.append("@media print { .header { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .logo-box { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }");
        html.append(".content { padding: 30px; padding-bottom: 100px; min-height: 0; overflow: visible; position: relative; }");
        html.append(".section { margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid; }");
        html.append(".produto-table { page-break-inside: avoid; break-inside: avoid; }");
        html.append(".section-title { font-size: 16px; font-weight: 700; color: #0ea5e9; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }");
        html.append(".info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }");
        html.append(".info-item { padding: 8px 0; }");
        html.append(".info-label { font-size: 12px; color: #64748b; text-transform: uppercase; }");
        html.append(".info-value { font-size: 14px; color: #1e293b; font-weight: 500; }");
        html.append(".produto-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }");
        html.append(".produto-table th, .produto-table td { border: 1px solid #e2e8f0; padding: 10px 8px; }");
        html.append(".produto-table th { background: #f8fafc; font-weight: 600; color: #334155; }");
        html.append(".produto-table .valor { text-align: right !important; font-weight: 700; color: #0ea5e9; }");
        html.append(".produto-table .totais-row { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; font-weight: 700; }");
        html.append(".produto-table .totais-row td { color: white !important; border-color: rgba(255,255,255,0.2); }");
        html.append(".produto-table .totais-row td:first-child { text-align: left !important; }");
        html.append(".produto-table tbody tr:nth-child(even) { background-color: #fafbfc; }");
        html.append(".produto-table tbody tr:hover { background-color: #f8fafc; }");
        html.append(".condicoes-box { background: #f8fafc; padding: 15px; border-radius: 8px; }");
        html.append(".observacoes-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; }");
        html.append(".observacoes-gerais-section { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px; }");
        html.append(".informacoes-gerais-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size: 11px; line-height: 1.5; color: #475569; }");
        html.append(".info-geral-item { display: flex; gap: 6px; align-items: flex-start; page-break-inside: avoid; }");
        html.append(".info-geral-item .num { flex-shrink: 0; font-weight: 700; color: #0ea5e9; }");
        html.append(".footer { background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; }");
        html.append(".assinatura { margin: 30px 0; text-align: center; }");
        html.append(".linha-assinatura { width: 250px; border-bottom: 2px solid #1e293b; margin: 0 auto 10px; padding-top: 20px; }");
        html.append(".signature-name { margin: 0; padding-top: 8px; }");
        html.append(".assinatura-label { font-size: 12px; color: #64748b; margin-top: 5px; }");
        html.append(".mensagem-adicional { background: #e0f2fe; border-radius: 8px; padding: 15px; margin-bottom: 25px; }");
        html.append(".mensagem-adicional p { margin: 0; color: #0c4a6e; }");
        html.append(".proposta-observacao-destaque { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px solid #ea580c; border-radius: 10px; padding: 18px 20px; margin-bottom: 22px; box-shadow: 0 2px 10px rgba(234,88,12,0.18); page-break-inside: auto; }");
        html.append(".proposta-observacao-destaque .obs-titulo { font-size: 11px; font-weight: 800; color: #c2410c; letter-spacing: 0.1em; margin-bottom: 10px; text-transform: uppercase; }");
        html.append(".proposta-observacao-destaque .obs-texto { font-size: 14px; color: #1c1917; line-height: 1.65; white-space: pre-wrap; word-wrap: break-word; }");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        html.append("<div class=\"email-container\">");

        // Header com Logo
        html.append("<div class=\"header\">");
        
        // Top section com logo e empresa
        html.append("<div class=\"header-top\">");
        
        // Logo lado esquerdo - usar imagem real via base64 inline (compatível com email)
        try {
            String logoBase64 = getLogoBase64Inline();
            html.append("<div class=\"logo-box\" style=\"width: 90px; height: 90px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 5px;\">");
            html.append("<img src=\"").append(logoBase64 != null ? logoBase64 : "").append("\" alt=\"").append(commercialAltText()).append("\" style=\"max-width: 80px; max-height: 80px; width: auto; height: auto;\">");
            html.append("</div>");
        } catch (Exception e) {
            LOGGER.warning("Erro ao adicionar logo no header: " + e.getMessage());
            // Continuar sem logo se houver erro
            html.append("<div class=\"logo-box\" style=\"width: 90px; height: 90px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 5px;\">");
            html.append("</div>");
        }
        
        // Informações da empresa (ao lado da logo)
        html.append("<div class=\"company-info\">");
        html.append("<div class=\"company-name\">").append(escapeHtml(commercialBranding.nameNormal())).append("</div>");
        html.append("<div class=\"company-specialty\">").append(escapeHtml(commercialBranding.taglineTrimmed())).append("</div>");
        String emitEmail = sistemaEmpresaConfigService.htmlEmitenteFiscalForEmailHeader();
        if (emitEmail != null && !emitEmail.isBlank()) {
            html.append(emitEmail);
        }
        html.append("</div>");
        html.append("</div>");
        
        // Linha divisória
        html.append("<div style=\"width: 100%; height: 2px; background: rgba(255,255,255,0.3); margin: 20px 0;\"></div>");
        
        // Título da proposta
        html.append("<div class=\"header-title\">");
        html.append("<h1>").append(m.docTitulo()).append("</h1>");
        html.append("<div class=\"proposta-num\">").append(proposta.numeroProposta).append("</div>");
        if (proposta.dataProposta != null) {
            html.append("<div style=\"font-size: 14px; opacity: 0.9; margin-top: 5px;\">")
                    .append(m.dataPrefix())
                    .append(" ")
                    .append(proposta.dataProposta.format(dateFormatter))
                    .append("</div>");
        }
        html.append("</div>");
        html.append("</div>");

        // Content
        html.append("<div class=\"content\">");

        // Mensagem adicional
        if (mensagemAdicional != null && !mensagemAdicional.isBlank()) {
            html.append("<div class=\"mensagem-adicional\">");
            html.append("<p>").append(mensagemAdicional.replace("\n", "<br>")).append("</p>");
            html.append("</div>");
        }

        // Dados do Cliente
        html.append("<div class=\"section\">");
        html.append("<div class=\"section-title\">").append(m.secDadosCliente()).append("</div>");
        html.append("<div class=\"info-grid\">");
        html.append("<div class=\"info-item\"><div class=\"info-label\">").append(m.lblNome()).append("</div><div class=\"info-value\">").append(nullSafe(proposta.clienteNome)).append("</div></div>");
        html.append("<div class=\"info-item\"><div class=\"info-label\">").append(m.lblCnpjCpf()).append("</div><div class=\"info-value\">").append(nullSafe(proposta.clienteCnpjCpf)).append("</div></div>");
        html.append("<div class=\"info-item\"><div class=\"info-label\">").append(m.lblContato()).append("</div><div class=\"info-value\">").append(nullSafe(proposta.clienteContato)).append("</div></div>");
        html.append("<div class=\"info-item\"><div class=\"info-label\">").append(m.lblTelefone()).append("</div><div class=\"info-value\">").append(nullSafe(proposta.clienteTelefone)).append("</div></div>");
        html.append("</div>");
        html.append("</div>");

        // Produto/Serviço
        html.append("<div class=\"section\">");
        html.append("<div class=\"section-title\">").append(m.secProdutos()).append("</div>");
        
        // Se houver itens enviados, usar eles (múltiplos produtos)
        if (items != null && !items.isEmpty()) {
            html.append("<table class=\"produto-table\">");
            html.append("<tr><th style=\"text-align: left;\">#</th><th style=\"text-align: left;\">")
                    .append(m.colDesc())
                    .append("</th><th style=\"text-align: left;\">")
                    .append(m.colPn())
                    .append("</th><th style=\"text-align: left;\">")
                    .append(m.colSn())
                    .append("</th><th style=\"text-align: center;\">")
                    .append(m.colQtd())
                    .append("</th><th style=\"text-align: right;\">")
                    .append(m.colValorUnitUsd())
                    .append("</th><th style=\"text-align: right;\">")
                    .append(m.colTotalUsd())
                    .append("</th></tr>");
            
            int totalQtd = 0;
            java.math.BigDecimal totalValor = java.math.BigDecimal.ZERO;
            
            for (int i = 0; i < items.size(); i++) {
                EnviarPropostaEmailDto.PropostaItemDto item = items.get(i);
                html.append("<tr>");
                html.append("<td style=\"text-align: left;\">").append(i + 1).append("</td>");
                html.append("<td style=\"text-align: left;\"><strong>").append(nullSafe(item.produtoNome)).append("</strong>");
                if (item.produtoDescricao != null && !item.produtoDescricao.isBlank()) {
                    html.append("<br><small>").append(item.produtoDescricao.length() > 80 ? item.produtoDescricao.substring(0, 80) + "..." : item.produtoDescricao).append("</small>");
                }
                html.append("</td>");
                html.append("<td style=\"text-align: left;\">").append(nullSafe(item.produtoPn)).append("</td>");
                html.append("<td style=\"text-align: left;\">").append(nullSafe(item.produtoSn)).append("</td>");
                html.append("<td style=\"text-align: center;\">").append(item.quantidade != null ? item.quantidade : 0).append("</td>");
                html.append("<td style=\"text-align: right;\">").append(item.valorUnitario != null ? formatCurrencyUsd(item.valorUnitario) : "$0.00").append("</td>");
                html.append("<td class=\"valor\" style=\"text-align: right;\">").append(item.valorTotal != null ? formatCurrencyUsd(item.valorTotal) : "$0.00").append("</td>");
                html.append("</tr>");
                
                if (item.quantidade != null) totalQtd += item.quantidade;
                if (item.valorTotal != null) totalValor = totalValor.add(item.valorTotal);
            }
            
            // Linha de Subtotal Produtos (USD)
            html.append("<tr class=\"totais-row\" style=\"background: #f8fafc;\">");
            html.append("<td colspan=\"5\" style=\"text-align: right; font-weight: 500; color: #64748b; padding: 12px 8px;\">")
                    .append(m.subtotalProdutosUsd())
                    .append("</td>");
            html.append("<td colspan=\"2\" style=\"text-align: right; font-weight: 600; color: #334155; padding: 12px 8px;\">").append(formatCurrencyUsd(totalValor)).append("</td>");
            html.append("</tr>");
            
            // Custos Adicionais (se existirem)
            if (proposta.freteBrl != null && proposta.freteBrl.compareTo(java.math.BigDecimal.ZERO) > 0 && proposta.freteUsd != null) {
                html.append("<tr style=\"background: #f0fdf4;\">");
                html.append("<td colspan=\"5\" style=\"text-align: right; font-weight: 500; color: #64748b; padding: 10px 8px;\">")
                        .append(String.format(m.freteUsd(), formatCurrency(proposta.freteBrl)))
                        .append("</td>");
                html.append("<td colspan=\"2\" style=\"text-align: right; font-weight: 600; color: #16a34a; padding: 10px 8px;\">").append(formatCurrencyUsd(proposta.freteUsd)).append("</td>");
                html.append("</tr>");
            }
            if (proposta.maoDeObraBrl != null && proposta.maoDeObraBrl.compareTo(java.math.BigDecimal.ZERO) > 0 && proposta.maoDeObraUsd != null) {
                html.append("<tr style=\"background: #f0fdf4;\">");
                html.append("<td colspan=\"5\" style=\"text-align: right; font-weight: 500; color: #64748b; padding: 10px 8px;\">")
                        .append(String.format(m.maoDeObraUsd(), formatCurrency(proposta.maoDeObraBrl)))
                        .append("</td>");
                html.append("<td colspan=\"2\" style=\"text-align: right; font-weight: 600; color: #16a34a; padding: 10px 8px;\">").append(formatCurrencyUsd(proposta.maoDeObraUsd)).append("</td>");
                html.append("</tr>");
            }
            
            // Total Geral (USD)
            java.math.BigDecimal totalGeral = proposta.totalGeralUsd != null ? proposta.totalGeralUsd : totalValor;
            html.append("<tr style=\"background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);\">");
            html.append("<td colspan=\"5\" style=\"text-align: right; font-weight: 700; color: white; padding: 14px 8px; font-size: 15px;\">")
                    .append(m.totalGeralUsd())
                    .append("</td>");
            html.append("<td colspan=\"2\" style=\"text-align: right; font-weight: 700; color: white; padding: 14px 8px; font-size: 18px;\">").append(formatCurrencyUsd(totalGeral)).append("</td>");
            html.append("</tr>");
            html.append("</table>");
        } else {
            // Fallback: usar campos da entidade (um produto só)
            html.append("<table class=\"produto-table\">");
            html.append("<tr><th style=\"text-align: left;\">")
                    .append(m.colDesc())
                    .append("</th><th style=\"text-align: left;\">")
                    .append(m.colPn())
                    .append("</th><th style=\"text-align: left;\">")
                    .append(m.colSn())
                    .append("</th><th style=\"text-align: right;\">")
                    .append(m.colValor())
                    .append("</th></tr>");
            html.append("<tr>");
            html.append("<td style=\"text-align: left;\"><strong>").append(nullSafe(proposta.produtoNome)).append("</strong>");
            if (proposta.tipoServicoNome != null) {
                html.append("<br><small>").append(proposta.tipoServicoNome).append("</small>");
            }
            html.append("</td>");
            html.append("<td style=\"text-align: left;\">").append(nullSafe(proposta.produtoPn)).append("</td>");
            html.append("<td style=\"text-align: left;\">").append(nullSafe(proposta.produtoSn)).append("</td>");
            html.append("<td class=\"valor\" style=\"text-align: right;\">").append(proposta.produtoValor != null ? formatCurrency(proposta.produtoValor) : m.aOrcar()).append("</td>");
            html.append("</tr>");
            // Linha de TOTAIS alinhada à esquerda
            html.append("<tr class=\"totais-row\">");
            html.append("<td style=\"text-align: left;\"><strong>").append(m.totais()).append("</strong></td>");
            html.append("<td style=\"text-align: left;\"></td>");
            html.append("<td style=\"text-align: left;\"></td>");
            html.append("<td style=\"text-align: right;\"><strong>").append(proposta.produtoValor != null ? formatCurrency(proposta.produtoValor) : m.aOrcar()).append("</strong></td>");
            html.append("</tr>");
            html.append("</table>");
        }
        
        if (proposta.servicoExecutado != null && !proposta.servicoExecutado.isBlank()) {
            html.append("<div class=\"observacoes-box\">");
            html.append("<strong>").append(m.servicoExecutado()).append("</strong><br>");
            html.append(proposta.servicoExecutado.replace("\n", "<br>"));
            html.append("</div>");
        }
        html.append("</div>");

        // Condições Comerciais
        html.append("<div class=\"section\">");
        html.append("<div class=\"section-title\">").append(m.secCondCom()).append("</div>");
        html.append("<div class=\"condicoes-box\">");
        html.append("<div class=\"info-grid\">");
        html.append("<div class=\"info-item\"><div class=\"info-label\">").append(m.lblDataProposta()).append("</div><div class=\"info-value\">").append(proposta.dataProposta != null ? proposta.dataProposta.format(dateFormatter) : "-").append("</div></div>");
        html.append("<div class=\"info-item\"><div class=\"info-label\">").append(m.lblValidade()).append("</div><div class=\"info-value\">").append(proposta.validadeProposta != null ? proposta.validadeProposta.format(dateFormatter) : "-").append("</div></div>");
        html.append("<div class=\"info-item\"><div class=\"info-label\">").append(m.lblPrazoEntrega()).append("</div><div class=\"info-value\">").append(nullSafe(proposta.prazoEntrega)).append("</div></div>");
        html.append("<div class=\"info-item\"><div class=\"info-label\">").append(m.lblFormaPagamento()).append("</div><div class=\"info-value\">").append(nullSafe(proposta.formaPagamento)).append("</div></div>");
        html.append("</div>");
        html.append("</div>");
        html.append("</div>");

        // Observações Gerais (texto fixo, layout em colunas)
        appendCondicoesGeraisFixasHtml(html, locale);

        if (proposta.observacoes != null && !proposta.observacoes.trim().isEmpty()) {
            html.append("<div class=\"section\">");
            html.append("<div class=\"proposta-observacao-destaque\">");
            html.append("<div class=\"obs-titulo\">").append(m.observacao()).append("</div>");
            html.append("<div class=\"obs-texto\">").append(escapeHtml(proposta.observacoes.trim()).replace("\n", "<br>")).append("</div>");
            html.append("</div></div>");
        }

        html.append("</div>"); // end content

        // Footer da Proposta
        html.append("<div class=\"footer\" style=\"margin-bottom: 50px; clear: both;\">");
        html.append("<p style=\"font-size: 14px; color: #64748b; margin: 0;\">").append(escapeHtml(commercialBranding.bannerLine())).append("</p>");
        html.append("</div>");

        // Espaçador para garantir que a assinatura não seja sobreposta
        html.append("<div style=\"min-height: 100px; clear: both; page-break-inside: avoid; break-inside: avoid;\"></div>");

        // ========== ASSINATURA DE EMAIL PROFISSIONAL ==========
        String signerName = "";
        String fontFamily = "'Dancing Script', cursive";
        String color = "#0ea5e9";
        
        if (signature != null && signature.name != null && !signature.name.isBlank()) {
            signerName = signature.name;
            fontFamily = signature.fontFamily != null ? signature.fontFamily : fontFamily;
            color = signature.color != null ? signature.color : color;
        } else if (proposta.assinaturaNome != null && !proposta.assinaturaNome.isBlank()) {
            signerName = proposta.assinaturaNome;
            fontFamily = proposta.assinaturaFontFamily != null ? proposta.assinaturaFontFamily : fontFamily;
            color = proposta.assinaturaColor != null ? proposta.assinaturaColor : color;
        }

        // Assinatura de Email Profissional - Layout similar à proposta
        html.append("<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin-top: 40px; font-family: Arial, sans-serif; max-width: 450px;\">");
        html.append("<tr>");
        
        // Logo lado esquerdo - usar imagem real via base64 inline (compatível com email)
        try {
            String logoBase64Sig = getLogoBase64Inline();
            html.append("<td style=\"vertical-align: top; padding-right: 15px; width: 90px;\">");
            html.append("<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\">");
            html.append("<tr><td style=\"text-align: center;\">");
            // Logo comercial (base64 inline para compatibilidade com clientes de e-mail)
            html.append("<img src=\"").append(logoBase64Sig != null ? logoBase64Sig : "").append("\" alt=\"").append(commercialAltText()).append("\" style=\"max-width: 70px; max-height: 70px; width: auto; height: auto; display: block; margin: 0 auto;\">");
            html.append("</td></tr>");
            html.append("</table>");
            html.append("</td>");
        } catch (Exception e) {
            LOGGER.warning("Erro ao adicionar logo na assinatura: " + e.getMessage());
            // Continuar sem logo se houver erro
            html.append("<td style=\"vertical-align: top; padding-right: 15px; width: 90px;\">");
            html.append("</td>");
        }
        
        // Linha divisória vertical
        html.append("<td style=\"width: 3px; background: linear-gradient(180deg, #0ea5e9 0%, #60a5fa 100%); padding: 0;\"></td>");
        
        // Informações lado direito
        html.append("<td style=\"vertical-align: top; padding-left: 15px;\">");
        
        // Nome com estilo de assinatura elegante
        if (!signerName.isBlank()) {
            html.append("<p style=\"margin: 0 0 2px 0; font-family: ").append(fontFamily)
                .append("; font-size: 24px; color: ").append(color).append("; line-height: 1.2;\">")
                .append(signerName).append("</p>");
        }
        
        // Cargo
        html.append("<p style=\"margin: 0 0 2px 0; font-size: 13px; font-weight: 600; color: #374151;\">")
                .append(m.vendedorTecnico())
                .append("</p>");
        
        // Empresa
        html.append("<p style=\"margin: 0 0 10px 0; font-size: 12px; color: #0ea5e9; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;\">").append(escapeHtml(commercialBranding.bannerLine().toUpperCase(Locale.ROOT))).append("</p>");
        
        // Informações de contato
        html.append("<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"font-size: 12px; color: #475569;\">");
        
        // Telefone (usar valor informado ou padrão)
        String telefone = resolveTelefoneRemetente(telefoneRemetente);
        html.append("<tr>");
        html.append("<td style=\"padding: 2px 0; vertical-align: middle;\">Tel: ").append(escapeHtml(telefone)).append("</td>");
        html.append("</tr>");
        
        // Email (usar valor informado ou padrão)
        String email = emailRemetente != null && !emailRemetente.isBlank() ? emailRemetente : commercialBranding.supportEmail();
        html.append("<tr>");
        html.append("<td style=\"padding: 2px 0; vertical-align: middle;\">");
        html.append("<a href=\"mailto:").append(email).append("\" style=\"color: #0ea5e9; text-decoration: none;\">").append(email).append("</a>");
        html.append("</td>");
        html.append("</tr>");
        
        // Descrição removida - Serviços Aeronáuticos já está no nome da empresa
        
        html.append("</table>");
        html.append("</td>");
        html.append("</tr>");
        html.append("</table>");

        // Linha divisória antes do aviso
        html.append("<div style=\"margin: 25px 0; height: 1px; background: linear-gradient(90deg, #e2e8f0 0%, transparent 100%); max-width: 450px;\"></div>");

        // Aviso de confidencialidade
        html.append("<div style=\"margin-top: 20px; padding: 12px 15px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #0ea5e9; max-width: 450px;\">");
        html.append("<p style=\"margin: 0; font-size: 9px; color: #64748b; line-height: 1.4;\">");
        html.append("<strong style=\"color: #475569;\">").append(escapeHtml(m.confidentialityTitle())).append("</strong> ");
        html.append(escapeHtml(m.confidentialityBody()));
        html.append("</p>");
        html.append("</div>");

        html.append("</div>"); // end email-container

        html.append("</body>");
        html.append("</html>");

        return commercialBranding.applyBrandPalette(html.toString());
    }

    /**
     * Gera HTML da proposta para impressão (com logo incluída)
     */
    public String gerarHtmlImpressao(Long id) {
        PropostaComercial proposta = requireProposta(id);
        if (proposta == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_COMERCIAL_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        // Carregar itens salvos
        List<EnviarPropostaEmailDto.PropostaItemDto> itensParaImpressao = new ArrayList<>();
        List<PropostaComercialItem> itensSalvos = PropostaComercialItem.find("propostaComercial = ?1", Sort.by("ordem").ascending(), proposta)
            .list();
        for (PropostaComercialItem item : itensSalvos) {
            EnviarPropostaEmailDto.PropostaItemDto itemDto = new EnviarPropostaEmailDto.PropostaItemDto();
            itemDto.produtoNome = item.produtoNome;
            itemDto.produtoDescricao = item.produtoDescricao;
            itemDto.produtoPn = item.produtoPn;
            itemDto.produtoSn = item.produtoSn;
            itemDto.quantidade = item.quantidade;
            itemDto.valorUnitario = item.valorUnitario;
            itemDto.valorTotal = item.valorTotal;
            itensParaImpressao.add(itemDto);
        }
        
        // Usar o mesmo método de build HTML mas sem mensagem adicional e sem assinatura
        String locale = resolveClienteEmailLocale(proposta);
        return buildPropostaEmailHtml(
                proposta,
                null,
                null,
                itensParaImpressao.isEmpty() ? null : itensParaImpressao,
                null,
                null,
                locale);
    }

    /**
     * Constrói o texto plano do email da proposta
     */
    private String buildPropostaEmailText(
            PropostaComercial proposta,
            String mensagemAdicional,
            List<EnviarPropostaEmailDto.PropostaItemDto> items,
            String telefoneRemetente,
            String emailRemetente,
            String locale) {
        PropostaComercialMessages.Labels m = propostaLabels(locale);
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        StringBuilder text = new StringBuilder();
        text.append(m.docTitulo()).append("\n");
        text.append("==================\n");
        text.append(proposta.numeroProposta).append("\n\n");

        if (mensagemAdicional != null && !mensagemAdicional.isBlank()) {
            text.append(m.lblMensagem()).append("\n");
            text.append(mensagemAdicional).append("\n\n");
        }

        text.append(m.secDadosCliente()).append("\n");
        text.append("----------------\n");
        text.append(m.lblNome()).append(": ").append(nullSafe(proposta.clienteNome)).append("\n");
        text.append(m.lblCnpjCpf()).append(": ").append(nullSafe(proposta.clienteCnpjCpf)).append("\n");
        text.append(m.lblContato()).append(": ").append(nullSafe(proposta.clienteContato)).append("\n");
        text.append(m.lblTelefone()).append(": ").append(nullSafe(proposta.clienteTelefone)).append("\n\n");

        text.append(m.secProdutos()).append("\n");
        text.append("------------------\n");
        
        // Se houver itens enviados, usar eles (múltiplos produtos)
        if (items != null && !items.isEmpty()) {
            int totalQtd = 0;
            java.math.BigDecimal totalValor = java.math.BigDecimal.ZERO;
            
            for (int i = 0; i < items.size(); i++) {
                EnviarPropostaEmailDto.PropostaItemDto item = items.get(i);
                text.append(i + 1).append(". ").append(nullSafe(item.produtoNome)).append("\n");
                text.append("   ").append(m.colPn()).append(": ").append(nullSafe(item.produtoPn)).append("\n");
                text.append("   ").append(m.colSn()).append(": ").append(nullSafe(item.produtoSn)).append("\n");
                text.append("   ").append(m.colQtd()).append(": ").append(item.quantidade != null ? item.quantidade : 0).append("\n");
                text.append("   ").append(m.lblValorUnit()).append(" ").append(item.valorUnitario != null ? formatCurrency(item.valorUnitario) : "R$ 0,00").append("\n");
                text.append("   ").append(m.lblTotalItem()).append(" ").append(item.valorTotal != null ? formatCurrency(item.valorTotal) : "R$ 0,00").append("\n\n");
                
                if (item.quantidade != null) totalQtd += item.quantidade;
                if (item.valorTotal != null) totalValor = totalValor.add(item.valorTotal);
            }
            
            text.append(m.totais()).append(":\n");
            text.append("   ").append(m.lblQtdTotal()).append(" ").append(totalQtd).append("\n");
            text.append("   ").append(m.lblValorTotal()).append(" ").append(formatCurrency(totalValor)).append("\n\n");
        } else {
            // Fallback: usar campos da entidade (um produto só)
            text.append(m.lblProduto()).append(" ").append(nullSafe(proposta.produtoNome)).append("\n");
            text.append(m.colPn()).append(": ").append(nullSafe(proposta.produtoPn)).append("\n");
            text.append(m.colSn()).append(": ").append(nullSafe(proposta.produtoSn)).append("\n");
            text.append(m.colValor()).append(": ").append(proposta.produtoValor != null ? formatCurrency(proposta.produtoValor) : m.aOrcar()).append("\n");
        }
        
        if (proposta.servicoExecutado != null && !proposta.servicoExecutado.isBlank()) {
            text.append(m.servicoExecutado()).append(" ").append(proposta.servicoExecutado).append("\n");
        }
        text.append("\n");

        text.append(m.secCondCom()).append("\n");
        text.append("--------------------\n");
        text.append(m.lblDataProposta()).append(": ").append(proposta.dataProposta != null ? proposta.dataProposta.format(dateFormatter) : "-").append("\n");
        text.append(m.lblValidade()).append(": ").append(proposta.validadeProposta != null ? proposta.validadeProposta.format(dateFormatter) : "-").append("\n");
        text.append(m.lblPrazoEntrega()).append(": ").append(nullSafe(proposta.prazoEntrega)).append("\n");
        text.append(m.lblFormaPagamento()).append(": ").append(nullSafe(proposta.formaPagamento)).append("\n\n");

        text.append(m.secCondGerais()).append("\n");
        text.append("----------------\n");
        List<String> condicoes = condicoesGeraisFixas(locale);
        for (int i = 0; i < condicoes.size(); i++) {
            text.append(i + 1).append(". ").append(condicoes.get(i)).append("\n\n");
        }

        if (proposta.observacoes != null && !proposta.observacoes.trim().isEmpty()) {
            text.append(">>> ").append(m.obsTitulo()).append(" <<<\n");
            text.append(proposta.observacoes.trim()).append("\n\n");
        }

        // Assinatura Profissional
        text.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
        
        // Nome do assinante
        String signerName = proposta.assinaturaNome != null ? proposta.assinaturaNome : "";
        if (!signerName.isBlank()) {
            text.append(signerName).append("\n");
        }
        
        text.append(m.vendedorTecnico()).append("\n");
        text.append(commercialBranding.bannerLine()).append("\n\n");
        String emitPlain = sistemaEmpresaConfigService.plainTextEmitenteFiscal();
        if (emitPlain != null && !emitPlain.isBlank()) {
            text.append(emitPlain).append("\n");
        }

        // Usar telefone e email informados ou padrão
        String telefone = resolveTelefoneRemetente(telefoneRemetente);
        String email = emailRemetente != null && !emailRemetente.isBlank() ? emailRemetente : commercialBranding.supportEmail();
        
        text.append("📞 ").append(telefone).append("\n");
        text.append("✉️ ").append(email).append("\n\n");
        
        text.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        text.append(m.confidentialityTitle()).append("\n");
        text.append(m.confidentialityBody()).append("\n");

        return text.toString();
    }

    private String nullSafe(String value) {
        return value != null ? value : "-";
    }

    private String formatCurrency(java.math.BigDecimal value) {
        java.text.NumberFormat format = java.text.NumberFormat.getCurrencyInstance(java.util.Locale.forLanguageTag("pt-BR"));
        return format.format(value);
    }

    private String formatCurrencyUsd(java.math.BigDecimal value) {
        java.text.NumberFormat format = java.text.NumberFormat.getCurrencyInstance(java.util.Locale.US);
        return format.format(value != null ? value : java.math.BigDecimal.ZERO);
    }

    private void appendCondicoesGeraisFixasHtml(StringBuilder html, String locale) {
        PropostaComercialMessages.Labels m = propostaLabels(locale);
        html.append("<div class=\"section observacoes-gerais-section\">");
        html.append("<div class=\"section-title\">").append(m.secCondGerais()).append("</div>");
        html.append("<div class=\"informacoes-gerais-grid\">");
        List<String> condicoes = condicoesGeraisFixas(locale);
        for (int i = 0; i < condicoes.size(); i++) {
            html.append("<div class=\"info-geral-item\"><span class=\"num\">").append(i + 1).append(".</span><span>");
            html.append(escapeHtml(condicoes.get(i)));
            html.append("</span></div>");
        }
        html.append("</div></div>");
    }

    private String resolveTelefoneRemetente(String telefoneRemetente) {
        if (telefoneRemetente != null && !telefoneRemetente.isBlank()) {
            return telefoneRemetente;
        }
        return sistemaEmpresaConfigService.configuredEmpresaTelefone().orElse("(11) 99999-9999");
    }

    /** Logo enviada (empresa-assets) em data URL, ou null para usar recurso no classpath / SVG. */
    private String loadLogoBase64FromUploadedFile() {
        try (java.io.InputStream in = empresaAssetService.openLogo()) {
            if (in != null) {
                byte[] logoBytes = in.readAllBytes();
                String mime = empresaAssetService.guessLogoMediaType();
                return "data:" + mime + ";base64," + java.util.Base64.getEncoder().encodeToString(logoBytes);
            }
        } catch (Exception e) {
            LOGGER.fine("Logo em empresa-assets indisponível: " + e.getMessage());
        }
        return null;
    }

    /**
     * Retorna o logo para uso em emails em formato base64 inline.
     * Prioridade: ficheiro gravado em {@link EmpresaAssetService}; depois logo_redondo.png / .jpg, logo-email.png, logo.png.
     */
    private String getLogoBase64Inline() {
        String uploaded = loadLogoBase64FromUploadedFile();
        if (uploaded != null) {
            return uploaded;
        }
        try {
            java.io.InputStream logoStream = Thread.currentThread().getContextClassLoader()
                .getResourceAsStream("META-INF/resources/logo_redondo.png");
            if (logoStream == null) {
                logoStream = Thread.currentThread().getContextClassLoader()
                    .getResourceAsStream("META-INF/resources/logo_redondo.jpg");
            }
            if (logoStream == null) {
                logoStream = Thread.currentThread().getContextClassLoader()
                    .getResourceAsStream("META-INF/resources/logo-email.png");
            }
            if (logoStream == null) {
                logoStream = Thread.currentThread().getContextClassLoader()
                    .getResourceAsStream("META-INF/resources/logo.png");
            }
            
            if (logoStream != null) {
                byte[] logoBytes = logoStream.readAllBytes();
                logoStream.close();
                boolean jpeg = logoBytes.length >= 2 && (logoBytes[0] & 0xFF) == 0xFF && (logoBytes[1] & 0xFF) == 0xD8;
                String mime = jpeg ? "image/jpeg" : "image/png";
                return "data:" + mime + ";base64," + java.util.Base64.getEncoder().encodeToString(logoBytes);
            }
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Erro inesperado", e);
        }
        // Fallback: SVG simples com marca configurável (white-label)
        String d = commercialBranding.nameNormal();
        String letter = d.isEmpty() ? "A" : d.substring(0, 1).toUpperCase(Locale.ROOT);
        String lineBrand = d.length() <= 12 ? d.toUpperCase(Locale.ROOT) : d.substring(0, 12).toUpperCase(Locale.ROOT) + "…";
        String tag = commercialBranding.taglineTrimmed();
        String lineTag = tag.length() <= 22 ? tag : tag.substring(0, 22) + "…";
        String escBrand = lineBrand.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        String escTag = lineTag.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        String brandFill = commercialBranding.primaryColor();
        String svgLogo = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'>" +
             "<rect width='150' height='150' rx='15' fill='" + brandFill + "'/>" +
             "<text x='75' y='70' font-family='Arial,sans-serif' font-size='60' font-weight='bold' fill='white' text-anchor='middle'>" + letter.replace("&", "&amp;") + "</text>" +
             "<text x='75' y='110' font-family='Arial,sans-serif' font-size='18' font-weight='bold' fill='white' text-anchor='middle'>" + escBrand + "</text>" +
             "<text x='75' y='130' font-family='Arial,sans-serif' font-size='10' fill='rgba(255,255,255,0.8)' text-anchor='middle'>" + escTag + "</text>" +
             "</svg>";
        return "data:image/svg+xml;base64," + java.util.Base64.getEncoder().encodeToString(
            svgLogo.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
    
    /**
     * Retorna URL absoluta para a logo
     * Usa a configuração do application.properties ou default
     */
    private String getLogoUrl() {
        try {
            // Usar a URL base da API (substituir app por api no frontend.url)
            String url = baseApiUrl != null 
                ? baseApiUrl.replace("app.aerosuite.app", "api.aerosuite.app")
                    .replace("https://app.", "https://api.")
                    .replace("http://app.", "http://api.")
                : "https://api.aerosuite.app";
            
            // Se não foi possível derivar, usar default
            if (url == null || url.isEmpty() || url.equals(baseApiUrl)) {
                url = "https://api.aerosuite.app";
            }
            
            return url + "/api/logo";
        } catch (Exception e) {
            LOGGER.warning("Erro ao gerar URL da logo: " + e.getMessage());
            return "https://api.aerosuite.app/api/logo";
        }
    }

    /**
     * Constrói HTML simples para email com anexo (apenas mensagem personalizada)
     */
    private String buildMensagemSimplesHtml(
            String locale, String mensagemAdicional, EnviarPropostaEmailDto.SignatureDto signature) {
        PropostaComercialMessages.Lang lang = PropostaComercialMessages.toLang(locale);
        PropostaComercialMessages.Labels m = propostaLabels(locale);
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html lang=\"").append(PropostaComercialMessages.htmlLang(lang)).append("\">");
        html.append("<head>");
        html.append("<meta charset=\"UTF-8\">");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        html.append("<title>").append(m.docTitulo()).append("</title>");
        html.append("<style>");
        html.append("@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Tangerine:wght@400;700&family=Pacifico&family=Kaushan+Script&family=Pinyon+Script&family=Caveat:wght@400;600;700&family=Dancing+Script:wght@400;700&family=Sacramento&family=Alex+Brush&display=swap');");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }");
        html.append(".mensagem { padding: 20px; white-space: pre-wrap; }");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        
        // Mensagem personalizada
        if (mensagemAdicional != null && !mensagemAdicional.isBlank()) {
            html.append("<div class=\"mensagem\">").append(mensagemAdicional.replace("\n", "<br>")).append("</div>");
        }
        
        // Assinatura
        if (signature != null && signature.name != null && !signature.name.isBlank()) {
            String fontFamily = signature.fontFamily != null ? signature.fontFamily : "'Dancing Script', cursive";
            String color = signature.color != null ? signature.color : "#0ea5e9";
            html.append("<div style=\"margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;\">");
            html.append("<p style=\"margin: 0; font-family: ").append(fontFamily).append("; font-size: 24px; color: ").append(color).append(";\">")
                .append(signature.name).append("</p>");
            html.append("<p style=\"margin: 5px 0 0 0; font-size: 12px; color: #64748b;\">")
                    .append(m.vendedorTecnico())
                    .append(" — ")
                    .append(escapeHtml(commercialBranding.bannerLine()))
                    .append("</p>");
            html.append("</div>");
        }
        
        html.append("</body>");
        html.append("</html>");
        return commercialBranding.applyBrandPalette(html.toString());
    }

    /**
     * Constrói texto simples para email com anexo (apenas mensagem personalizada)
     */
    private String resolveClienteEmailLocale(PropostaComercial proposta) {
        if (proposta.clientePropostaId != null) {
            ClienteProposta cliente =
                    ClienteProposta.findById(proposta.clientePropostaId.longValue());
            if (cliente != null && cliente.idioma != null && !cliente.idioma.isBlank()) {
                return UserLocaleResolver.normalize(cliente.idioma);
            }
        }
        return UserLocaleResolver.normalize(null);
    }

    private String buildMensagemSimplesText(
            String locale, EnviarPropostaEmailDto.SignatureDto signature) {
        StringBuilder text = new StringBuilder();
        text.append(TransactionalEmailMessages.propostaComercialAttachmentDefaultText(locale));
        
        if (signature != null && signature.name != null && !signature.name.isBlank()) {
            text.append(signature.name).append("\n");
        }
        text.append(propostaLabels(locale).vendedorTecnico()).append("\n");
        text.append(commercialBranding.bannerLine()).append("\n");
        
        return text.toString();
    }

    /**
     * Gera PDF da proposta comercial com alta qualidade (mesma qualidade do HTML de impressão do frontend)
     * Usa o EXATO mesmo HTML que o frontend gera para impressão
     */
    private byte[] generatePropostaPdf(
            PropostaComercial proposta,
            List<EnviarPropostaEmailDto.PropostaItemDto> items,
            EnviarPropostaEmailDto.SignatureDto signature,
            String locale) {
        try {
            // Gerar o HTML idêntico ao do frontend
            String htmlPrint = buildPropostaPrintHtml(proposta, items, signature, locale);
            
            // Converter HTML para PDF usando OpenHTMLToPDF
            return convertHtmlToPdf(htmlPrint);
        } catch (Exception e) {
            LOGGER.severe("Erro ao gerar PDF da proposta: " + e.getMessage());
            LOGGER.log(Level.WARNING, "Erro inesperado", e);
            throw new RuntimeException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.PROPOSTA_PDF_GENERATE_FAILED, e.getMessage()), e);
        }
    }
    
    /**
     * Constrói o HTML de impressão idêntico ao gerado pelo frontend
     */
    private String buildPropostaPrintHtml(
            PropostaComercial proposta,
            List<EnviarPropostaEmailDto.PropostaItemDto> items,
            EnviarPropostaEmailDto.SignatureDto signature,
            String locale) {
        PropostaComercialMessages.Labels m = propostaLabels(locale);
        // Log dos dados do cliente antes de gerar o HTML
        LOGGER.info("📄 Gerando HTML do PDF - Dados do cliente:");
        LOGGER.info("  clienteNome: " + proposta.clienteNome);
        LOGGER.info("  clienteCnpjCpf: " + proposta.clienteCnpjCpf);
        LOGGER.info("  clienteEmail: " + proposta.clienteEmail);
        LOGGER.info("  clienteTelefone: " + proposta.clienteTelefone);
        LOGGER.info("  clienteEndereco: " + proposta.clienteEndereco);
        LOGGER.info("  clienteCidade: " + proposta.clienteCidade);
        LOGGER.info("  clienteEstado: " + proposta.clienteEstado);
        LOGGER.info("  clienteCep: " + proposta.clienteCep);
        LOGGER.info("  clienteContato: " + proposta.clienteContato);
        
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        // Carregar logo em base64 (upload da config, depois recursos no classpath)
        String logoBase64 = "";
        String uploadedLogo = loadLogoBase64FromUploadedFile();
        if (uploadedLogo != null) {
            logoBase64 = uploadedLogo;
        }
        try {
            if (logoBase64.isEmpty()) {
            java.io.InputStream logoStream = getClass().getClassLoader().getResourceAsStream("META-INF/resources/logo_redondo.png");
            if (logoStream == null) {
                logoStream = getClass().getClassLoader().getResourceAsStream("META-INF/resources/logo_redondo.jpg");
            }
            if (logoStream == null) {
                logoStream = getClass().getClassLoader().getResourceAsStream("META-INF/resources/logo.png");
            }
            if (logoStream != null) {
                byte[] logoBytes = logoStream.readAllBytes();
                logoStream.close();
                boolean jpeg = logoBytes.length >= 2 && (logoBytes[0] & 0xFF) == 0xFF && (logoBytes[1] & 0xFF) == 0xD8;
                String mime = jpeg ? "image/jpeg" : "image/png";
                logoBase64 = "data:" + mime + ";base64," + java.util.Base64.getEncoder().encodeToString(logoBytes);
            }
            }
        } catch (Exception e) {
            LOGGER.warning("Erro ao carregar logo para HTML: " + e.getMessage());
        }
        
        String logoHtml = logoBase64.isEmpty() 
            ? "" 
            : "<img src=\"" + logoBase64 + "\" alt=\"" + commercialAltText() + "\" style=\"max-width: 80px; max-height: 80px; height: auto; width: auto;\" />";
        
        // Data formatada
        String dataFormatada = proposta.dataProposta != null 
            ? proposta.dataProposta.format(dateFormatter) 
            : java.time.LocalDate.now().format(dateFormatter);
        String validadeFormatada = proposta.validadeProposta != null 
            ? proposta.validadeProposta.format(dateFormatter) 
            : "-";
        
        // Construir tabela de produtos (HTML idêntico ao frontend)
        StringBuilder produtosHtml = new StringBuilder();
        int totalQtd = 0;
        java.math.BigDecimal totalValor = java.math.BigDecimal.ZERO;
        
        if (items != null && !items.isEmpty()) {
            produtosHtml.append("<table class=\"produto-table\">");
            produtosHtml.append("<thead>");
            produtosHtml.append("<tr>");
            produtosHtml.append("<th style=\"width: 40px; text-align: center;\">#</th>");
            produtosHtml.append("<th style=\"text-align: left;\">").append(m.colDesc()).append("</th>");
            produtosHtml.append("<th style=\"width: 100px; text-align: left;\">").append(m.colPn()).append("</th>");
            produtosHtml.append("<th style=\"width: 100px; text-align: left;\">").append(m.colSn()).append("</th>");
            produtosHtml.append("<th style=\"width: 60px; text-align: center;\">").append(m.colQtd()).append("</th>");
            produtosHtml.append("<th style=\"width: 100px; text-align: right;\">").append(m.colValorUnitUsd()).append("</th>");
            produtosHtml.append("<th style=\"width: 100px; text-align: right;\">").append(m.colTotalUsd()).append("</th>");
            produtosHtml.append("</tr>");
            produtosHtml.append("</thead>");
            produtosHtml.append("<tbody>");
            
            for (int i = 0; i < items.size(); i++) {
                EnviarPropostaEmailDto.PropostaItemDto item = items.get(i);
                java.math.BigDecimal itemTotal = item.valorTotal != null ? item.valorTotal : java.math.BigDecimal.ZERO;
                if (item.quantidade != null) totalQtd += item.quantidade;
                totalValor = totalValor.add(itemTotal);
                
                String descricaoHtml = "<strong>" + escapeHtml(nullSafe(item.produtoNome)) + "</strong>";
                if (item.produtoDescricao != null && !item.produtoDescricao.isBlank()) {
                    String descLimitada = item.produtoDescricao.length() > 80 
                        ? item.produtoDescricao.substring(0, 80) + "..." 
                        : item.produtoDescricao;
                    descricaoHtml += "<br /><small>" + escapeHtml(descLimitada) + "</small>";
                }
                
                produtosHtml.append("<tr>");
                produtosHtml.append("<td style=\"text-align: center;\">").append(i + 1).append("</td>");
                produtosHtml.append("<td style=\"text-align: left;\">").append(descricaoHtml).append("</td>");
                produtosHtml.append("<td style=\"text-align: left;\">").append(escapeHtml(nullSafe(item.produtoPn))).append("</td>");
                produtosHtml.append("<td style=\"text-align: left;\">").append(escapeHtml(nullSafe(item.produtoSn))).append("</td>");
                produtosHtml.append("<td style=\"text-align: center;\">").append(item.quantidade != null ? item.quantidade : 0).append("</td>");
                produtosHtml.append("<td style=\"text-align: right;\">").append(formatCurrencyUsd(item.valorUnitario != null ? item.valorUnitario : java.math.BigDecimal.ZERO)).append("</td>");
                produtosHtml.append("<td style=\"text-align: right; font-weight: bold; color: #0ea5e9;\">").append(formatCurrencyUsd(itemTotal)).append("</td>");
                produtosHtml.append("</tr>");
            }
            
            produtosHtml.append("</tbody>");
            produtosHtml.append("<tfoot>");
            // Subtotal Produtos (USD)
            produtosHtml.append("<tr style=\"background: #f8fafc; border-top: 1px solid #e2e8f0;\">");
            produtosHtml.append("<td colspan=\"5\" style=\"text-align: right; font-weight: 500; color: #64748b; padding: 12px 8px;\">")
                    .append(m.subtotalProdutosUsd())
                    .append("</td>");
            produtosHtml.append("<td colspan=\"2\" style=\"text-align: right; font-weight: 600; color: #334155; padding: 12px 8px;\">").append(formatCurrencyUsd(totalValor)).append("</td>");
            produtosHtml.append("</tr>");
            
            // Custos Adicionais (se existirem)
            if (proposta.freteBrl != null && proposta.freteBrl.compareTo(java.math.BigDecimal.ZERO) > 0 && proposta.freteUsd != null) {
                produtosHtml.append("<tr style=\"background: #f0fdf4;\">");
                produtosHtml.append("<td colspan=\"5\" style=\"text-align: right; font-weight: 500; color: #64748b; padding: 10px 8px;\">")
                        .append(String.format(m.freteUsd(), formatCurrency(proposta.freteBrl)))
                        .append("</td>");
                produtosHtml.append("<td colspan=\"2\" style=\"text-align: right; font-weight: 600; color: #16a34a; padding: 10px 8px;\">").append(formatCurrencyUsd(proposta.freteUsd)).append("</td>");
                produtosHtml.append("</tr>");
            }
            if (proposta.maoDeObraBrl != null && proposta.maoDeObraBrl.compareTo(java.math.BigDecimal.ZERO) > 0 && proposta.maoDeObraUsd != null) {
                produtosHtml.append("<tr style=\"background: #f0fdf4;\">");
                produtosHtml.append("<td colspan=\"5\" style=\"text-align: right; font-weight: 500; color: #64748b; padding: 10px 8px;\">")
                        .append(String.format(m.maoDeObraUsd(), formatCurrency(proposta.maoDeObraBrl)))
                        .append("</td>");
                produtosHtml.append("<td colspan=\"2\" style=\"text-align: right; font-weight: 600; color: #16a34a; padding: 10px 8px;\">").append(formatCurrencyUsd(proposta.maoDeObraUsd)).append("</td>");
                produtosHtml.append("</tr>");
            }
            
            // Total Geral (USD)
            java.math.BigDecimal totalGeral = proposta.totalGeralUsd != null ? proposta.totalGeralUsd : totalValor;
            produtosHtml.append("<tr style=\"background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);\">");
            produtosHtml.append("<td colspan=\"5\" style=\"text-align: right; font-weight: 700; color: white; padding: 14px 8px; font-size: 15px;\">")
                    .append(m.totalGeralUsd())
                    .append("</td>");
            produtosHtml.append("<td colspan=\"2\" style=\"text-align: right; font-weight: 700; color: white; padding: 14px 8px; font-size: 18px;\">").append(formatCurrencyUsd(totalGeral)).append("</td>");
            produtosHtml.append("</tr>");
            produtosHtml.append("</tfoot>");
            produtosHtml.append("</table>");
        } else {
            produtosHtml.append("<p style=\"color: #666; font-style: italic;\">").append(m.semProdutos()).append("</p>");
        }
        
        // Assinatura
        String assinaturaHtml = "";
        if (signature != null && signature.name != null && !signature.name.isBlank()) {
            String fontFamily = signature.fontFamily != null ? signature.fontFamily : "Arial, sans-serif";
            String color = signature.color != null ? signature.color : "#0ea5e9";
            assinaturaHtml = "<div class=\"assinatura\">";
            assinaturaHtml += "<div style=\"font-family: " + fontFamily + "; font-size: " + (signature.fontSize != null ? signature.fontSize : "24px") + "; color: " + color + "; padding: 10px 0;\">";
            assinaturaHtml += escapeHtml(signature.name);
            assinaturaHtml += "</div>";
            assinaturaHtml += "<div class=\"linha-assinatura\"></div>";
            assinaturaHtml += "<p>" + escapeHtml(m.responsavelProposta()) + "</p>";
            assinaturaHtml += "</div>";
        } else {
            assinaturaHtml = "<div class=\"assinatura\"><div class=\"linha-assinatura\"></div><p>"
                    + escapeHtml(m.responsavelAssinatura())
                    + "</p></div>";
        }
        
        // Construir HTML completo (idêntico ao frontend)
        StringBuilder html = new StringBuilder();
        html.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        html.append("<!DOCTYPE html>");
        html.append("<html xmlns=\"http://www.w3.org/1999/xhtml\">");
        html.append("<head>");
        html.append("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />");
        html.append("<title>").append(m.docTitulo()).append(" - ").append(proposta.numeroProposta != null ? proposta.numeroProposta : m.refNova()).append("</title>");
        html.append("<style>");
        html.append("* { box-sizing: border-box; }");
        html.append("body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.5; }");
        html.append(".proposta-header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; }");
        html.append(".company-logo { display: flex; align-items: center; gap: 15px; }");
        html.append(".company-info h2 { margin: 0; color: #0ea5e9; font-size: 18px; }");
        html.append(".company-info p { margin: 5px 0 0; font-size: 12px; color: #666; }");
        html.append(".proposta-info { text-align: right; }");
        html.append(".proposta-info h1 { margin: 0; font-size: 20px; color: #0ea5e9; }");
        html.append(".proposta-info .numero { font-size: 14px; font-weight: bold; margin: 5px 0; }");
        html.append(".proposta-info .data { font-size: 12px; color: #666; }");
        html.append(".proposta-section { margin-bottom: 18px; page-break-inside: auto; break-inside: auto; }");
        html.append(".proposta-section > h3 { color: #0ea5e9; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px; ");
        html.append("page-break-after: avoid; break-after: avoid; page-break-inside: avoid; }");
        html.append(".proposta-section > h3 + table, .proposta-section > h3 + div { page-break-before: avoid; break-before: avoid; }");
        html.append(".section-content { max-height: none; overflow: visible; }");
        html.append(".section-content p { margin: 4px 0; font-size: 13px; word-wrap: break-word; overflow-wrap: break-word; }");
        html.append(".produto-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: auto; break-inside: auto; }");
        html.append(".produto-table thead { display: table-header-group; }");
        html.append(".produto-table tbody { display: table-row-group; }");
        html.append(".produto-table tr { page-break-inside: avoid; break-inside: avoid; }");
        html.append(".produto-table th, .produto-table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }");
        html.append(".produto-table th { background: #f8fafc; font-weight: 600; }");
        html.append(".condicoes-grid { display: flex; flex-wrap: wrap; gap: 15px; }");
        html.append(".condicao-item { flex: 1; min-width: 150px; background: #f8fafc; padding: 10px; border-radius: 5px; }");
        html.append(".condicao-item label { display: block; font-size: 11px; color: #666; margin-bottom: 3px; }");
        html.append(".condicao-item span { font-size: 13px; font-weight: 500; }");
        html.append(".condicoes-text { font-size: 11px; line-height: 1.6; white-space: pre-wrap; color: #666; margin-top: 15px; }");
        html.append(".proposta-observacao-section > h3 { color: #c2410c !important; border-bottom-color: #fdba74 !important; }");
        html.append(".proposta-observacao-box { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px solid #ea580c; border-radius: 10px; padding: 14px 16px; ");
        html.append("font-size: 13px; line-height: 1.65; color: #1c1917; word-wrap: break-word; box-shadow: 0 2px 8px rgba(234,88,12,0.12); }");
        html.append(".informacoes-gerais-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 10px; line-height: 1.45; color: #475569; ");
        html.append("page-break-inside: auto; break-inside: auto; }");
        html.append(".condicoes-gerais-section > h3 + .informacoes-gerais-grid { page-break-before: avoid; break-before: avoid; }");
        html.append(".informacoes-gerais-section, .observacoes-gerais-section { background: #f8fafc; padding: 12px 14px; border-radius: 8px; border: 1px solid #e2e8f0; page-break-inside: auto; break-inside: auto; }");
        html.append(".info-geral-item { display: flex; gap: 6px; align-items: flex-start; page-break-inside: auto; break-inside: auto; ");
        html.append("word-wrap: break-word; overflow-wrap: break-word; }");
        html.append(".info-geral-item .num { flex-shrink: 0; font-weight: 700; color: #0ea5e9; }");
        html.append(".proposta-footer { margin-top: 36px; min-height: 64px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 16px; page-break-inside: avoid; break-inside: avoid; position: relative; clear: both; }");
        html.append(".assinatura { text-align: center; }");
        html.append(".linha-assinatura { width: 200px; border-bottom: 1px solid #333; margin: 10px auto; }");
        html.append(".assinatura p { margin: 0; font-size: 12px; }");
        html.append(".contato-footer { text-align: right; font-size: 11px; color: #666; }");
        html.append("@media print {");
        html.append("body { margin: 0; padding: 15px; }");
        html.append("* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }");
        html.append("svg { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }");
        html.append(".proposta-section { page-break-inside: auto !important; break-inside: auto !important; margin-bottom: 16px !important; }");
        html.append(".proposta-section > h3 { page-break-after: avoid !important; break-after: avoid !important; }");
        html.append(".produto-table { page-break-inside: auto !important; break-inside: auto !important; }");
        html.append(".proposta-footer { margin-top: 40px !important; min-height: 56px !important; page-break-inside: avoid !important; break-inside: avoid !important; }");
        html.append("}");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        
        // CABEÇALHO
        html.append("<div class=\"proposta-header\">");
        html.append("<div class=\"company-logo\">");
        html.append(logoHtml);
        html.append("<div class=\"company-info\">");
        html.append("<h2>").append(escapeHtml(commercialBranding.bannerLine())).append("</h2>");
        String emitPdfHeader = sistemaEmpresaConfigService.htmlEmitenteFiscalForPdfHeader();
        if (emitPdfHeader != null && !emitPdfHeader.isBlank()) {
            html.append(emitPdfHeader);
        }
        html.append("</div>");
        html.append("</div>");
        html.append("<div class=\"proposta-info\">");
        html.append("<h1>").append(m.docTitulo()).append("</h1>");
        html.append("<div class=\"numero\">").append(proposta.numeroProposta != null ? proposta.numeroProposta : m.refNova()).append("</div>");
        html.append("<div class=\"data\">").append(m.dataPrefix()).append(" ").append(dataFormatada).append("</div>");
        html.append("</div>");
        html.append("</div>");
        
        // DADOS DO CLIENTE
        html.append("<div class=\"proposta-section\">");
        html.append("<h3>").append(m.secDadosCliente()).append("</h3>");
        html.append("<div class=\"section-content\">");
        html.append("<p><strong>").append(m.nomeRazaoSocial()).append(":</strong> ").append(escapeHtml(nullSafe(proposta.clienteNome))).append("</p>");
        if (proposta.clienteCnpjCpf != null && !proposta.clienteCnpjCpf.isBlank()) {
            html.append("<p><strong>").append(m.lblCnpjCpf()).append(":</strong> ").append(escapeHtml(proposta.clienteCnpjCpf)).append("</p>");
        }
        if (proposta.clienteContato != null && !proposta.clienteContato.isBlank()) {
            html.append("<p><strong>").append(m.lblContato()).append(":</strong> ").append(escapeHtml(proposta.clienteContato)).append("</p>");
        }
        if (proposta.clienteTelefone != null && !proposta.clienteTelefone.isBlank()) {
            html.append("<p><strong>").append(m.lblTelefone()).append(":</strong> ").append(escapeHtml(proposta.clienteTelefone)).append("</p>");
        }
        if (proposta.clienteEmail != null && !proposta.clienteEmail.isBlank()) {
            html.append("<p><strong>").append(m.lblEmail()).append(":</strong> ").append(escapeHtml(proposta.clienteEmail)).append("</p>");
        }
        // Endereço completo
        StringBuilder enderecoCompleto = new StringBuilder();
        if (proposta.clienteEndereco != null && !proposta.clienteEndereco.isBlank()) {
            enderecoCompleto.append(proposta.clienteEndereco);
        }
        if (proposta.clienteCidade != null && !proposta.clienteCidade.isBlank()) {
            if (enderecoCompleto.length() > 0) enderecoCompleto.append(", ");
            enderecoCompleto.append(proposta.clienteCidade);
        }
        if (proposta.clienteEstado != null && !proposta.clienteEstado.isBlank()) {
            if (enderecoCompleto.length() > 0) enderecoCompleto.append(" - ");
            enderecoCompleto.append(proposta.clienteEstado);
        }
        if (proposta.clienteCep != null && !proposta.clienteCep.isBlank()) {
            if (enderecoCompleto.length() > 0) enderecoCompleto.append(" - ").append(m.lblCep()).append(": ");
            enderecoCompleto.append(proposta.clienteCep);
        }
        if (enderecoCompleto.length() > 0) {
            html.append("<p><strong>").append(m.lblEndereco()).append(":</strong> ").append(escapeHtml(enderecoCompleto.toString())).append("</p>");
        }
        if (proposta.clienteObservacao != null && !proposta.clienteObservacao.isBlank()) {
            html.append("<p style=\"margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;\"><strong>")
                    .append(m.lblObservacoes())
                    .append(":</strong> ")
                    .append(escapeHtml(proposta.clienteObservacao))
                    .append("</p>");
        }
        html.append("</div>");
        html.append("</div>");
        
        // PRODUTOS/SERVIÇOS
        html.append("<div class=\"proposta-section\">");
        html.append("<h3>").append(m.secProdutos()).append("</h3>");
        html.append(produtosHtml.toString());
        html.append("</div>");
        
        // CONDIÇÕES COMERCIAIS
        html.append("<div class=\"proposta-section\">");
        html.append("<h3>").append(m.secCondCom()).append("</h3>");
        html.append("<div class=\"condicoes-grid\">");
        html.append("<div class=\"condicao-item\"><label>").append(m.lblPrazoEntrega()).append("</label><span>").append(escapeHtml(nullSafe(proposta.prazoEntrega))).append("</span></div>");
        html.append("<div class=\"condicao-item\"><label>").append(m.lblFormaPagamento()).append("</label><span>").append(escapeHtml(nullSafe(proposta.formaPagamento))).append("</span></div>");
        html.append("<div class=\"condicao-item\"><label>").append(m.lblValidade()).append("</label><span>").append(validadeFormatada).append("</span></div>");
        html.append("<div class=\"condicao-item\"><label>").append(m.lblGarantia()).append("</label><span>-</span></div>");
        html.append("</div>");
        html.append("</div>");
        
        // Condições Gerais (conteúdo fixo em colunas)
        html.append("<div class=\"proposta-section condicoes-gerais-section informacoes-gerais-section\">");
        html.append("<h3>").append(m.secCondGerais()).append("</h3>");
        html.append("<div class=\"informacoes-gerais-grid\">");
        List<String> condicoes = condicoesGeraisFixas(locale);
        for (int i = 0; i < condicoes.size(); i++) {
            html.append("<div class=\"info-geral-item\"><span class=\"num\">").append(i + 1).append(".</span><span>");
            html.append(escapeHtml(condicoes.get(i)));
            html.append("</span></div>");
        }
        html.append("</div></div>");

        if (proposta.observacoes != null && !proposta.observacoes.trim().isEmpty()) {
            html.append("<div class=\"proposta-section proposta-observacao-section\">");
            html.append("<h3>").append(m.obsTitulo()).append("</h3>");
            html.append("<div class=\"proposta-observacao-box\">");
            html.append(escapeHtml(proposta.observacoes.trim()).replace("\n", "<br>"));
            html.append("</div></div>");
        }
        
        // RODAPÉ
        html.append("<div class=\"proposta-footer\">");
        html.append(assinaturaHtml);
        html.append("<div class=\"contato-footer\">");
        String emitFooter = sistemaEmpresaConfigService.htmlEmitenteFiscalForDocumentFooter();
        if (emitFooter != null && !emitFooter.isBlank()) {
            html.append(emitFooter);
        } else {
            html.append("<p><strong>").append(escapeHtml(commercialBranding.nameNormal())).append("</strong></p>");
            html.append("<p>").append(escapeHtml(commercialBranding.supportEmail())).append("</p>");
        }
        html.append("</div>");
        html.append("</div>");
        
        html.append("</body>");
        html.append("</html>");
        
        return commercialBranding.applyBrandPalette(html.toString());
    }
    
    /**
     * Converte HTML para PDF usando OpenHTMLToPDF
     */
    private byte[] convertHtmlToPdf(String html) throws Exception {
        try {
            // Normalizar HTML para XHTML (auto-fechar tags válidas)
            html = normalizeHtmlToXhtml(html);
            
            ByteArrayOutputStream os = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            
            // Configurar para usar UTF-8 explicitamente e A4
            builder.useDefaultPageSize(210, 297, PdfRendererBuilder.PageSizeUnits.MM); // A4
            
            // Configurar margens (em mm)
            builder.useDefaultPageSize(210, 297, PdfRendererBuilder.PageSizeUnits.MM);
            
            // Passar HTML com base URI vazio e encoding UTF-8
            builder.withHtmlContent(html, "");
            
            // Garantir que todas as páginas sejam incluídas
            builder.useFastMode();
            
            // Configurar para não truncar conteúdo
            builder.toStream(os);
            builder.run();
            
            byte[] pdfBytes = os.toByteArray();
            LOGGER.info("PDF gerado com sucesso. Tamanho: " + pdfBytes.length + " bytes");
            
            return pdfBytes;
        } catch (Exception e) {
            LOGGER.severe("Erro ao converter HTML para PDF: " + e.getMessage());
            LOGGER.log(Level.WARNING, "Erro inesperado", e);
            throw e;
        }
    }
    
    /**
     * Normaliza HTML para XHTML válido (auto-fecha tags)
     */
    private String normalizeHtmlToXhtml(String html) {
        if (html == null) return "";
        // Substituir tags auto-fecháveis que não estão fechadas
        // Nota: apenas para tags simples que aparecem sozinhas, não dentro de outras tags
        html = html.replaceAll("<img([^>]*?)(?<!/)>", "<img$1 />");
        html = html.replaceAll("<br(?<!/)>", "<br />");
        html = html.replaceAll("<hr(?<!/)>", "<hr />");
        html = html.replaceAll("<input([^>]*?)(?<!/)>", "<input$1 />");
        html = html.replaceAll("<meta([^>]*?)(?<!/)>", "<meta$1 />");
        html = html.replaceAll("<link([^>]*?)(?<!/)>", "<link$1 />");
        return html;
    }
    
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }

    /**
     * Salva os itens da proposta na tabela proposta_comercial_item
     * IMPORTANTE: Este método salva os produtos/itens na tabela relacionada
     * CRÍTICO: Deve ser chamado dentro de uma transação @Transactional
     */
    private void salvarItensDaProposta(PropostaComercial proposta, List<PropostaComercialDto.PropostaItemDto> itensDto) {
        if (itensDto == null || itensDto.isEmpty()) {
            LOGGER.warning("⚠️ Nenhum item para salvar na proposta ID: " + (proposta != null ? proposta.id : "null"));
            return;
        }
        
        if (proposta == null || proposta.id == null) {
            LOGGER.severe("❌ ERRO: Proposta é null ou não tem ID! Não é possível salvar itens.");
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_NULL_ON_SAVE_ITEMS));
        }
        
        LOGGER.info("💾 Salvando " + itensDto.size() + " itens na tabela proposta_comercial_item para proposta ID: " + proposta.id);
        
        int ordem = 0;
        int itensSalvos = 0;
        int itensComErro = 0;
        
        for (PropostaComercialDto.PropostaItemDto itemDto : itensDto) {
            try {
                PropostaComercialItem itemEntity = new PropostaComercialItem();
                
                // CRÍTICO: Vincular ao relacionamento - isso cria a foreign key id_proposta_comercial
                itemEntity.propostaComercial = proposta;
                
                // Copiar dados do DTO
                itemEntity.produtoNome = itemDto.produtoNome;
                if (itemEntity.produtoNome == null || itemEntity.produtoNome.isBlank()) {
                    LOGGER.warning("⚠️ Item sem nome, pulando...");
                    continue;
                }
                
                itemEntity.produtoDescricao = itemDto.produtoDescricao;
                itemEntity.produtoPn = itemDto.produtoPn;
                itemEntity.produtoSn = itemDto.produtoSn;
                itemEntity.quantidade = itemDto.quantidade != null ? itemDto.quantidade : 1;
                itemEntity.valorUnitario = itemDto.valorUnitario != null ? itemDto.valorUnitario : java.math.BigDecimal.ZERO;
                itemEntity.valorTotal = itemDto.valorTotal != null ? itemDto.valorTotal : java.math.BigDecimal.ZERO;
                itemEntity.ordem = ordem++;
                
                // Persistir o item na tabela proposta_comercial_item
                itemEntity.persist();
                
                // Verificar se foi persistido corretamente
                if (itemEntity.id == null) {
                    LOGGER.severe("❌ ERRO: Item não foi persistido! ID é null após persist()");
                    itensComErro++;
                } else {
                    itensSalvos++;
                    LOGGER.info("✅ Item salvo - ID: " + itemEntity.id + 
                        " | Nome: " + itemEntity.produtoNome + 
                        " | P/N: " + (itemEntity.produtoPn != null ? itemEntity.produtoPn : "N/A") +
                        " | Qtd: " + itemEntity.quantidade + 
                        " | Valor Total: " + itemEntity.valorTotal +
                        " | Ordem: " + itemEntity.ordem +
                        " | Proposta ID: " + itemEntity.propostaComercial.id);
                }
            } catch (Exception e) {
                itensComErro++;
                LOGGER.severe("❌ ERRO ao salvar item: " + e.getMessage());
                LOGGER.log(Level.WARNING, "Erro inesperado", e);
            }
        }
        
        LOGGER.info("📊 Resumo - Total processado: " + itensDto.size() + 
            " | Salvos: " + itensSalvos + 
            " | Erros: " + itensComErro);
        
        if (itensComErro > 0) {
            LOGGER.severe("❌ ATENÇÃO: " + itensComErro + " itens não foram salvos devido a erros!");
        }
        
        // Verificar se os itens foram realmente salvos no banco
        List<PropostaComercialItem> itensVerificacao = PropostaComercialItem.find("propostaComercial.id = ?1", proposta.id).list();
        LOGGER.info("🔍 Verificação: " + itensVerificacao.size() + " itens encontrados no banco para proposta ID: " + proposta.id);
    }

    @Inject
    WhatsAppService whatsAppService;

    /**
     * Envia proposta via WhatsApp usando API
     */
    @Transactional
    public Map<String, Object> enviarPorWhatsApp(Long propostaId, String telefoneDestino, String mensagemAdicional, EnviarPropostaEmailDto.SignatureDto signature) {
        Map<String, Object> result = new HashMap<>();
        String statusEnvio = "FALHA";

        try {
            LOGGER.info("Iniciando envio via WhatsApp para proposta ID: " + propostaId);

            // Buscar a proposta
            PropostaComercial proposta = requireProposta(propostaId);
            if (proposta == null) {
                throw new NotFoundException(
                        ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_NOT_FOUND, "id", String.valueOf(propostaId)));
            }

            // Validar telefone
            if (telefoneDestino == null || telefoneDestino.isBlank()) {
                telefoneDestino = proposta.clienteTelefone;
            }

            if (telefoneDestino == null || telefoneDestino.isBlank()) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_PHONE_DESTINO_REQUIRED));
            }

            // Limpar telefone (remover caracteres especiais)
            String telefoneLimpo = telefoneDestino.replaceAll("[^0-9]", "");
            if (telefoneLimpo.length() < 10) {
                throw new IllegalArgumentException(
                        ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_PHONE_INVALID, "phone", telefoneDestino));
            }

            // CRÍTICO: Recarregar a proposta do banco para garantir que todos os dados estejam atualizados
            // Isso é necessário porque a entidade pode estar em cache ou desatualizada
            // Usar getEntityManager() do Panache ou recarregar via findById
            try {
                // Tentar recarregar usando o EntityManager do Panache
                if (proposta.id != null) {
                    PropostaComercial propostaRecarregada = requireProposta(proposta.id);
                    if (propostaRecarregada != null) {
                        proposta = propostaRecarregada;
                    }
                }
            } catch (Exception e) {
                LOGGER.warning("Não foi possível recarregar a proposta, usando dados em cache: " + e.getMessage());
            }
            
            LOGGER.info("📋 Dados do cliente na proposta (antes de gerar PDF):");
            LOGGER.info("  clienteNome: " + proposta.clienteNome);
            LOGGER.info("  clienteCnpjCpf: " + proposta.clienteCnpjCpf);
            LOGGER.info("  clienteEmail: " + proposta.clienteEmail);
            LOGGER.info("  clienteTelefone: " + proposta.clienteTelefone);
            LOGGER.info("  clienteEndereco: " + proposta.clienteEndereco);
            LOGGER.info("  clienteCidade: " + proposta.clienteCidade);
            LOGGER.info("  clienteEstado: " + proposta.clienteEstado);
            LOGGER.info("  clienteCep: " + proposta.clienteCep);
            LOGGER.info("  clienteContato: " + proposta.clienteContato);
            
            // Gerar PDF da proposta
            List<EnviarPropostaEmailDto.PropostaItemDto> itensParaEnvio = new ArrayList<>();
            List<PropostaComercialItem> itensSalvos = PropostaComercialItem.find("propostaComercial = ?1", Sort.by("ordem").ascending(), proposta)
                .list();
            for (PropostaComercialItem item : itensSalvos) {
                EnviarPropostaEmailDto.PropostaItemDto itemDto = new EnviarPropostaEmailDto.PropostaItemDto();
                itemDto.produtoNome = item.produtoNome;
                itemDto.produtoDescricao = item.produtoDescricao;
                itemDto.produtoPn = item.produtoPn;
                itemDto.produtoSn = item.produtoSn;
                itemDto.quantidade = item.quantidade;
                itemDto.valorUnitario = item.valorUnitario;
                itemDto.valorTotal = item.valorTotal;
                itensParaEnvio.add(itemDto);
            }

            String waLocale = resolveClienteEmailLocale(proposta);
            byte[] pdfBytes = generatePropostaPdf(proposta, itensParaEnvio, signature, waLocale);

            String mensagemWhatsAppApi =
                    montarMensagemWhatsApp(proposta, mensagemAdicional, signature, false, waLocale);
            String mensagemWhatsAppWeb =
                    montarMensagemWhatsApp(proposta, mensagemAdicional, signature, true, waLocale);

            String nomePdf =
                    TransactionalEmailMessages.propostaComercialPdfFilename(
                            waLocale, proposta.numeroProposta);

            // Tentar enviar via API do WhatsApp
            LOGGER.info("📤 Tentando enviar proposta via WhatsApp API...");
            LOGGER.info("📋 Dados do envio:");
            LOGGER.info("  Telefone destino: " + telefoneDestino);
            LOGGER.info("  Tamanho do PDF: " + (pdfBytes != null ? pdfBytes.length : 0) + " bytes");
            LOGGER.info("  Nome do PDF: " + nomePdf);
            LOGGER.info("  Tamanho da mensagem: " + mensagemWhatsAppApi.length() + " caracteres");
            
            Map<String, Object> resultadoEnvio = whatsAppService.sendMessageWithPdfDetailed(
                telefoneDestino, 
                mensagemWhatsAppApi, 
                pdfBytes, 
                nomePdf
            );
            
            boolean enviadoViaApi = (Boolean) resultadoEnvio.getOrDefault("success", false);
            String mensagemErro = (String) resultadoEnvio.getOrDefault("errorMessage", null);

            LOGGER.info("📊 Resultado do envio via API:");
            LOGGER.info("  Sucesso: " + enviadoViaApi);
            LOGGER.info("  Mensagem de erro: " + (mensagemErro != null ? mensagemErro : "[Nenhuma]"));

            if (enviadoViaApi) {
                statusEnvio = "ENVIADO";
                proposta.status = "ENVIADA";
                proposta.persist();
                
                result.put("success", true);
                result.put(
                        "message",
                        ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_WHATSAPP_SENT, "phone", telefoneDestino));
                result.put("fallback", false); // EXPLICITAMENTE definir como false quando enviado via API
                LOGGER.info("✅ Proposta enviada com sucesso via WhatsApp API para: " + telefoneDestino);
            } else {
                // Fallback: gerar link do WhatsApp Web se API não estiver configurada
                String motivo = mensagemErro != null
                        ? mensagemErro
                        : ApiI18nMessages.encode(ApiI18nMessages.WHATSAPP_API_UNAVAILABLE);
                LOGGER.warning("⚠️ WhatsApp API não disponível ou falhou: " + motivo + ". Gerando link do WhatsApp Web como fallback");
                String mensagemEncoded = java.net.URLEncoder.encode(mensagemWhatsAppWeb, "UTF-8");
                String whatsappUrl = "https://wa.me/" + telefoneLimpo + "?text=" + mensagemEncoded;
                
                statusEnvio = "PENDENTE";
                result.put("success", true);
                result.put("message", ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_WHATSAPP_LINK));
                result.put("whatsappUrl", whatsappUrl);
                result.put("fallback", true); // EXPLICITAMENTE definir como true quando usar fallback
                result.put("whatsappApiConfigured", whatsAppService.isApiConfigured());
                result.put("errorMessage", motivo); // Incluir motivo do fallback para debug
                LOGGER.info("🔗 Link do WhatsApp Web gerado: " + whatsappUrl);
            }

            // Salvar dados de envio
            PropostaComercialEnvio envio = new PropostaComercialEnvio();
            envio.propostaComercial = proposta;
            envio.tipoEnvio = "WHATSAPP";
            envio.canal = enviadoViaApi ? "whatsapp_api" : "whatsapp_web";
            envio.destinatarioTelefone = telefoneDestino;
            envio.destinatarioNome = proposta.clienteNome;
            envio.mensagemAdicional = mensagemAdicional;
            envio.status = statusEnvio;
            envio.dataEnvio = LocalDateTime.now();
            envio.persist();

            result.put("telefone", telefoneDestino);
            result.put("pdfBase64", java.util.Base64.getEncoder().encodeToString(pdfBytes));
            result.put("pdfNome", nomePdf);

        } catch (Exception e) {
            LOGGER.severe("Erro ao enviar proposta via WhatsApp: " + e.getMessage());
            LOGGER.log(Level.WARNING, "Erro inesperado", e);
            result.put("success", false);
            result.put(
                    "message",
                    ApiI18nMessages.withDetail(ApiI18nMessages.PROPOSTA_WHATSAPP_SEND_ERROR, e.getMessage()));
            
            // Salvar histórico de envio com erro
            try {
                PropostaComercial proposta = requireProposta(propostaId);
                if (proposta != null) {
                    PropostaComercialEnvio envio = new PropostaComercialEnvio();
                    envio.propostaComercial = proposta;
                    envio.tipoEnvio = "WHATSAPP";
                    envio.canal = "whatsapp_api";
                    envio.destinatarioTelefone = telefoneDestino;
                    envio.destinatarioNome = proposta.clienteNome;
                    envio.mensagemAdicional = mensagemAdicional;
                    envio.status = "FALHA";
                    envio.mensagemErro = e.getMessage();
                    envio.dataEnvio = LocalDateTime.now();
                    envio.persist();
                }
            } catch (Exception ex) {
                LOGGER.severe("Erro ao salvar histórico de envio: " + ex.getMessage());
            }
        }

        return result;
    }

    /**
     * Mensagem WhatsApp: via API o PDF vai em anexo; no WhatsApp Web o utilizador anexa o PDF transferido.
     */
    private String montarMensagemWhatsApp(
            PropostaComercial proposta,
            String mensagemAdicional,
            EnviarPropostaEmailDto.SignatureDto signature,
            boolean paraWhatsAppWeb,
            String locale) {
        PropostaComercialMessages.WhatsAppTexts w =
                PropostaComercialMessages.whatsApp(PropostaComercialMessages.toLang(locale));
        StringBuilder mensagem = new StringBuilder();
        mensagem.append(w.greeting());
        mensagem.append("📄 *").append(w.propostaLabel()).append(' ').append(proposta.numeroProposta).append("*\n");
        mensagem.append("📅 ").append(w.dataLabel()).append(' ')
                .append(proposta.dataProposta != null
                        ? proposta.dataProposta.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : "-")
                .append("\n\n");

        if (mensagemAdicional != null && !mensagemAdicional.isBlank()) {
            mensagem.append(mensagemAdicional).append("\n\n");
        }

        mensagem.append(paraWhatsAppWeb ? w.webAttachHint() : w.apiAttachHint());

        mensagem.append(w.regards());
        if (signature != null && signature.name != null) {
            mensagem.append(signature.name).append("\n");
        }
        mensagem.append(commercialBranding.bannerLine());
        return mensagem.toString();
    }

    /**
     * Cria DTO manualmente quando o mapper falha
     */
    private PropostaComercialDto criarDtoManual(PropostaComercial entity) {
        PropostaComercialDto dto = new PropostaComercialDto();
        
        // Copiar todos os campos manualmente
        dto.id = entity.id;
        dto.numeroProposta = entity.numeroProposta;
        
        // Dados do produto
        dto.produtoNome = entity.produtoNome;
        dto.produtoPn = entity.produtoPn;
        dto.produtoSn = entity.produtoSn;
        dto.produtoManual = entity.produtoManual;
        dto.produtoValor = entity.produtoValor;
        dto.aplicacaoMotor = entity.aplicacaoMotor;
        dto.aeronavePrefixo = entity.aeronavePrefixo;
        dto.servicoExecutado = entity.servicoExecutado;
        dto.idTipoServico = entity.idTipoServico;
        dto.tipoServicoNome = entity.tipoServicoNome;
        
        // Dados do cliente
        dto.clienteNome = entity.clienteNome;
        dto.clienteCnpjCpf = entity.clienteCnpjCpf;
        dto.clienteEmail = entity.clienteEmail;
        dto.clienteTelefone = entity.clienteTelefone;
        dto.clienteEndereco = entity.clienteEndereco;
        dto.clienteCidade = entity.clienteCidade;
        dto.clienteEstado = entity.clienteEstado;
        dto.clienteCep = entity.clienteCep;
        dto.clienteContato = entity.clienteContato;
        dto.clienteObservacao = entity.clienteObservacao;
        
        // Dados da proposta
        dto.dataProposta = entity.dataProposta;
        dto.validadeProposta = entity.validadeProposta;
        dto.prazoEntrega = entity.prazoEntrega;
        dto.formaPagamento = entity.formaPagamento;
        dto.observacoes = entity.observacoes;
        dto.condicoesGerais = entity.condicoesGerais;
        dto.status = entity.status;
        
        // Dados da assinatura
        dto.assinaturaNome = entity.assinaturaNome;
        dto.assinaturaEstilo = entity.assinaturaEstilo;
        dto.assinaturaFontFamily = entity.assinaturaFontFamily;
        dto.assinaturaColor = entity.assinaturaColor;
        dto.assinaturaTimestamp = entity.assinaturaTimestamp;
        
        // Metadados
        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        dto.createdBy = entity.createdBy;
        dto.osId = entity.osId;
        dto.osGeradaEm = entity.osGeradaEm;
        dto.osGeradaPor = entity.osGeradaPor;
        
        return dto;
    }

    /**
     * Carrega itens da tabela proposta_comercial_item por id da proposta.
     */
    private List<PropostaComercialDto.PropostaItemDto> carregarItensParaDto(Long propostaId) {
        if (propostaId == null) {
            return new ArrayList<>();
        }
        List<PropostaComercialItem> itens = PropostaComercialItem.find(
                "propostaComercial.id = ?1",
                Sort.by("ordem").ascending(),
                propostaId
        ).list();
        if (itens == null || itens.isEmpty()) {
            return new ArrayList<>();
        }
        List<PropostaComercialDto.PropostaItemDto> itensDto = new ArrayList<>(itens.size());
        for (PropostaComercialItem item : itens) {
            PropostaComercialDto.PropostaItemDto itemDto = new PropostaComercialDto.PropostaItemDto();
            itemDto.id = item.id;
            itemDto.produtoNome = item.produtoNome;
            itemDto.produtoDescricao = item.produtoDescricao;
            itemDto.produtoPn = item.produtoPn;
            itemDto.produtoSn = item.produtoSn;
            itemDto.quantidade = item.quantidade;
            itemDto.valorUnitario = item.valorUnitario;
            itemDto.valorTotal = item.valorTotal;
            itemDto.ordem = item.ordem;
            itensDto.add(itemDto);
        }
        return itensDto;
    }
}
