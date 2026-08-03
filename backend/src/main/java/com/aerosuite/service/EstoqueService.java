package com.aerosuite.service;

import org.jboss.logging.Logger;
import com.aerosuite.domain.TenantConstants;

import com.aerosuite.domain.*;
import com.aerosuite.domain.InvoiceAuditoria.AcaoAuditoria;
import com.aerosuite.dto.*;
import com.aerosuite.estoque.CertificadoPecaUtil;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.p1.TenantFeatureCodes;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import com.aerosuite.security.NativeQueryTenant;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.ServerUrlUtil;
import com.aerosuite.util.PanacheMaps;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@ApplicationScoped
public class EstoqueService {

    private static final Logger LOG = Logger.getLogger(EstoqueService.class);

    public static final int HISTORICO_QR_PADRAO = 50;
    public static final int HISTORICO_QR_EXTENDIDO = 250;

    private static final Set<Invoice.StatusInvoice> STATUS_BLOQUEIA_INATIVACAO = Set.of(
            Invoice.StatusInvoice.RECEBIDA,
            Invoice.StatusInvoice.CONFERIDA,
            Invoice.StatusInvoice.ESTOCADA);

    private static final Set<ItemEstoque.StatusItemEstoque> STATUS_BLOQUEIA_EDICAO_ITEM = Set.of(
            ItemEstoque.StatusItemEstoque.QUARENTENA,
            ItemEstoque.StatusItemEstoque.DESCARTADO);

    private static final String ORIENTACAO_INATIVACAO = "estoque.invoice.orientacao.inativacao";
    private static final String ORIENTACAO_CANCELAMENTO = "estoque.invoice.orientacao.cancelamento";

    @Inject
    TenantDataAccess tenantDataAccess;
    @Inject
    TenantFeatureService tenantFeatureService;

    @Inject
    NativeQueryTenant nativeQueryTenant;

    @Inject
    ServerUrlUtil serverUrlUtil;

    @Inject
    EstoqueCertificadoService estoqueCertificadoService;

    @Inject
    EstoqueQuarentenaService estoqueQuarentenaService;

    @Inject
    InvoiceAuditoriaService invoiceAuditoriaService;

    @Inject
    ConformidadeEnforcementService conformidadeEnforcement;

    private long tid() {
        return tenantDataAccess.currentTenantId();
    }

    private String qTenant(String base) {
        return base;
    }

    private Fornecedor requireFornecedor(Long id) {
        Fornecedor f = Fornecedor.find("id = ?1", id).firstResult();
        if (f == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode("estoque.error.fornecedor_not_found", "id", String.valueOf(id)));
        }
        return f;
    }

    /** D3 — exige ASL aprovado e vigente na entrada de material. */
    private Fornecedor requireFornecedorAsl(Long id) {
        Fornecedor f = requireFornecedor(id);
        conformidadeEnforcement.assertFornecedorAslAprovado(f);
        return f;
    }

    private Invoice requireInvoice(Long id) {
        Invoice inv = Invoice.find("id = ?1", id).firstResult();
        if (inv == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode("estoque.error.invoice_not_found", "id", String.valueOf(id)));
        }
        return inv;
    }

    private void assertInvoiceUtilizavel(Invoice inv) {
        if (!Boolean.TRUE.equals(inv.isActive)) {
            throw new IllegalStateException(ApiI18nMessages.domain("estoque.invoice.error.utilizavel_inativa"));
        }
        if (inv.status == Invoice.StatusInvoice.CANCELADA) {
            throw new IllegalStateException(ApiI18nMessages.domain("estoque.invoice.error.utilizavel_cancelada"));
        }
    }

    private Invoice requireInvoiceUtilizavel(Long id) {
        Invoice inv = requireInvoice(id);
        assertInvoiceUtilizavel(inv);
        return inv;
    }

    private Lote requireLote(Long id) {
        Lote lote = Lote.find("id = ?1", id).firstResult();
        if (lote == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode("estoque.error.lote_not_found", "id", String.valueOf(id)));
        }
        return lote;
    }

    private ItemEstoque requireItemEstoque(Long id) {
        ItemEstoque item = ItemEstoque.find("id = ?1", id).firstResult();
        if (item == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode("estoque.error.item_not_found", "id", String.valueOf(id)));
        }
        return item;
    }

    private void assignMovimentacaoTenant(MovimentacaoEstoque mov, ItemEstoque item) {
        mov.tenantId = item != null && item.tenantId != null ? item.tenantId : TenantConstants.tenantIdOf(tid());
    }
    
    // ==================== FORNECEDORES ====================
    
    public record FornecedorPageResult(List<FornecedorDto> content, long totalElements, int page, int size) {}

    public FornecedorPageResult listarFornecedoresPagina(int page, int size, String search) {
        int safeSize = Math.min(Math.max(size, 1), 200);
        int safePage = Math.max(page, 0);
        String query = fornecedorListQuery(search);
        Map<String, Object> params = fornecedorListParams(search);

        var panacheQuery = Fornecedor.find(query, Sort.by("razaoSocial"), params);
        List<Fornecedor> fetched = panacheQuery.page(Page.of(safePage, safeSize + 1)).list();

        boolean hasMore = fetched.size() > safeSize;
        List<Fornecedor> lista = hasMore ? fetched.subList(0, safeSize) : fetched;
        long total = hasMore
                ? panacheQuery.count()
                : (long) safePage * safeSize + lista.size();

        List<FornecedorDto> content = lista.stream()
                .map(this::toFornecedorDto)
                .collect(Collectors.toList());
        return new FornecedorPageResult(content, total, safePage, safeSize);
    }

    public List<FornecedorDto> listarFornecedores(int page, int size, String search) {
        return listarFornecedoresPagina(page, size, search).content();
    }
    
    public long contarFornecedores(String search) {
        return Fornecedor.count(fornecedorListQuery(search), fornecedorListParams(search));
    }

    private static String fornecedorListQuery(String search) {
        String query = "isActive = true";
        if (search != null && !search.isBlank()) {
            query += " AND (LOWER(razaoSocial) LIKE :search OR LOWER(codigo) LIKE :search OR LOWER(nomeFantasia) LIKE :search)";
        }
        return query;
    }

    private static Map<String, Object> fornecedorListParams(String search) {
        Map<String, Object> params = new HashMap<>();
        if (search != null && !search.isBlank()) {
            params.put("search", "%" + search.toLowerCase(java.util.Locale.ROOT) + "%");
        }
        return params;
    }
    
    public FornecedorDto buscarFornecedor(Long id) {
        return toFornecedorDto(requireFornecedor(id));
    }
    
    @Transactional
    public FornecedorDto salvarFornecedor(FornecedorDto dto) {
        if (dto.razaoSocial == null || dto.razaoSocial.isBlank()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode("estoque.error.razao_social_obrigatoria"));
        }
        
        Fornecedor f;
        if (dto.id != null) {
            f = requireFornecedor(dto.id);
        } else {
            f = new Fornecedor();
            f.tenantId = TenantConstants.tenantIdOf(tid());
            if (dto.codigo == null || dto.codigo.isBlank()) {
                f.codigo = gerarCodigoFornecedorUnico();
            }
        }
        
        if (dto.codigo != null && !dto.codigo.isBlank()) f.codigo = dto.codigo.trim();
        f.razaoSocial = dto.razaoSocial.trim();
        f.nomeFantasia = dto.nomeFantasia;
        f.cnpjCpf = dto.cnpjCpf;
        f.inscricaoEstadual = dto.inscricaoEstadual;
        f.paisOrigem = dto.paisOrigem != null ? dto.paisOrigem : "Estados Unidos";
        f.endereco = dto.endereco;
        f.numero = dto.numero;
        f.complemento = dto.complemento;
        f.bairro = dto.bairro;
        f.cidade = dto.cidade;
        f.estado = dto.estado;
        f.cep = dto.cep;
        f.telefone = dto.telefone;
        f.email = dto.email;
        f.website = dto.website;
        f.contatoNome = dto.contatoNome;
        f.contatoTelefone = dto.contatoTelefone;
        f.contatoEmail = dto.contatoEmail;
        f.observacoes = dto.observacoes;
        if (dto.aslStatus != null && !dto.aslStatus.isBlank()) {
            f.aslStatus = dto.aslStatus.trim();
        }
        f.aslEscopo = dto.aslEscopo;
        f.aslValidade = parseLocalDate(dto.aslValidade);
        f.aslAprovadoEm = parseLocalDate(dto.aslAprovadoEm);
        f.aslObservacoes = dto.aslObservacoes;
        
        Fornecedor.persist(f);
        return toFornecedorDto(f);
    }

    @Transactional
    public void excluirFornecedor(Long id) {
        Fornecedor f = requireFornecedor(id);
        f.isActive = false;
        f.persist();
    }
    
    /** Gera código único FORN-NNNN baseado no maior número já existente para evitar duplicatas. */
    private String gerarCodigoFornecedorUnico() {
        List<Fornecedor> todos = Fornecedor.listAll();
        int max = 0;
        for (Fornecedor forn : todos) {
            if (forn.codigo != null && forn.codigo.startsWith("FORN-")) {
                try {
                    int n = Integer.parseInt(forn.codigo.substring(5).trim());
                    if (n > max) max = n;
                } catch (NumberFormatException ignored) {}
            }
        }
        return String.format("FORN-%04d", max + 1);
    }
    
    // ==================== INVOICES ====================
    
    public List<InvoiceDto> listarInvoices(int page, int size, String search, String status,
            boolean incluirInativas, boolean somenteUtilizaveis) {
        String filtroBase;
        if (somenteUtilizaveis) {
            filtroBase = "isActive = true AND status != :statusCancelada";
        } else {
            filtroBase = incluirInativas ? "1 = 1" : "isActive = true";
        }
        StringBuilder query = new StringBuilder(qTenant(filtroBase));
        Map<String, Object> params = new HashMap<>();
        if (somenteUtilizaveis) {
            params.put("statusCancelada", Invoice.StatusInvoice.CANCELADA);
        }
        
        if (search != null && !search.isBlank()) {
            String term = "%" + search.toLowerCase(java.util.Locale.ROOT) + "%";
            query.append(" AND (LOWER(numeroInvoice) LIKE :search");
            query.append(" OR fornecedorId IN (SELECT f.id FROM Fornecedor f WHERE");
            query.append(" LOWER(f.razaoSocial) LIKE :search");
            query.append(" OR LOWER(f.nomeFantasia) LIKE :search");
            query.append(" OR LOWER(f.codigo) LIKE :search))");
            params.put("search", term);
        }
        
        if (status != null && !status.isBlank()) {
            query.append(" AND status = :status");
            params.put("status", Invoice.StatusInvoice.valueOf(status));
        }
        
        List<Invoice> lista = Invoice.find(query.toString(), Sort.by("dataEmissao").descending(), params)
                .page(Page.of(page, size))
                .list();
        return toInvoiceDtoList(lista);
    }

    private List<InvoiceDto> toInvoiceDtoList(List<Invoice> lista) {
        if (lista == null || lista.isEmpty()) {
            return List.of();
        }
        Set<Long> fornecedorIds = lista.stream()
                .filter(inv -> inv.fornecedor == null && inv.fornecedorId != null)
                .map(inv -> inv.fornecedorId)
                .collect(Collectors.toSet());
        Map<Long, Fornecedor> fornecedores = fornecedorIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<Fornecedor, Long>byId(Fornecedor.list("id in ?1", fornecedorIds), f -> f.id);
        return lista.stream().map(inv -> toInvoiceDto(inv, fornecedores)).collect(Collectors.toList());
    }
    
    public InvoiceDto buscarInvoice(Long id) {
        Invoice inv = requireInvoice(id);
        inv.itens = InvoiceItem.find("invoice.id = ?1 order by linha asc, id asc", id).list();
        if (inv.fornecedor == null && inv.fornecedorId != null) {
            inv.fornecedor = Fornecedor.findById(inv.fornecedorId);
        }
        return toInvoiceDto(inv);
    }

    public InvoiceInativacaoValidacaoDto validarInativacaoInvoice(Long id) {
        Invoice inv = requireInvoice(id);
        return montarValidacaoInativacao(inv);
    }

    public List<InvoiceAuditoriaDto> listarAuditoriaInvoice(Long invoiceId) {
        requireInvoice(invoiceId);
        return invoiceAuditoriaService.listarPorInvoice(invoiceId);
    }

    @Transactional
    public InvoiceDto inativarInvoice(Long id, InvoiceAcaoRequest request, Long usuarioId, String usuarioNome,
            String ipOrigem, String userAgent) {
        Invoice inv = requireInvoice(id);
        String motivo = validarMotivoInvoice(request);
        InvoiceInativacaoValidacaoDto validacao = montarValidacaoInativacao(inv);
        int qtdItens = (int) validacao.qtdItensEstoque;
        int qtdLotes = (int) validacao.qtdLotes;

        if (!validacao.podeInativar) {
            invoiceAuditoriaService.registrar(
                    inv.id,
                    inv.numeroInvoice,
                    AcaoAuditoria.TENTATIVA_INATIVACAO_BLOQUEADA,
                    motivo,
                    statusNome(inv.status),
                    statusNome(inv.status),
                    inv.isActive,
                    inv.isActive,
                    qtdItens,
                    qtdLotes,
                    String.join("; ", validacao.bloqueios),
                    usuarioId,
                    usuarioNome,
                    emailAuditoria(request),
                    ipOrigem,
                    userAgent);
            throw new IllegalStateException(ApiI18nMessages.domain("estoque.invoice.error.inativacao_bloqueada"));
        }

        Boolean ativoAntes = inv.isActive;
        String statusAntes = statusNome(inv.status);
        inv.isActive = false;
        inv.persist();

        invoiceAuditoriaService.registrar(
                inv.id,
                inv.numeroInvoice,
                AcaoAuditoria.INATIVACAO,
                motivo,
                statusAntes,
                statusAntes,
                ativoAntes,
                false,
                qtdItens,
                qtdLotes,
                null,
                usuarioId,
                usuarioNome,
                emailAuditoria(request),
                ipOrigem,
                userAgent);

        return toInvoiceDto(inv);
    }

    @Transactional
    public InvoiceDto cancelarInvoice(Long id, InvoiceAcaoRequest request, Long usuarioId, String usuarioNome,
            String ipOrigem, String userAgent) {
        Invoice inv = requireInvoice(id);
        String motivo = validarMotivoInvoice(request);
        InvoiceInativacaoValidacaoDto validacao = montarValidacaoInativacao(inv);

        if (validacao.jaInativa) {
            throw new IllegalStateException(ApiI18nMessages.domain("estoque.invoice.error.ja_inativa"));
        }
        if (validacao.jaCancelada) {
            throw new IllegalStateException(ApiI18nMessages.domain("estoque.invoice.error.ja_cancelada"));
        }

        int qtdItens = (int) validacao.qtdItensEstoque;
        int qtdLotes = (int) validacao.qtdLotes;
        String statusAntes = statusNome(inv.status);
        Boolean ativoAntes = inv.isActive;

        inv.status = Invoice.StatusInvoice.CANCELADA;
        String obsCancel = "[Cancelada em " + LocalDateTime.now()
                + " por " + (usuarioNome != null ? usuarioNome : "Sistema")
                + "] Motivo: " + motivo;
        if (inv.observacoes == null || inv.observacoes.isBlank()) {
            inv.observacoes = obsCancel;
        } else {
            inv.observacoes = inv.observacoes + "\n\n" + obsCancel;
        }
        inv.persist();

        invoiceAuditoriaService.registrar(
                inv.id,
                inv.numeroInvoice,
                AcaoAuditoria.CANCELAMENTO,
                motivo,
                statusAntes,
                statusNome(inv.status),
                ativoAntes,
                inv.isActive,
                qtdItens,
                qtdLotes,
                validacao.bloqueios.isEmpty() ? null : String.join("; ", validacao.bloqueios),
                usuarioId,
                usuarioNome,
                emailAuditoria(request),
                ipOrigem,
                userAgent);

        return toInvoiceDto(inv);
    }

    @Transactional
    public InvoiceDto restaurarInvoice(Long id, InvoiceAcaoRequest request, Long usuarioId, String usuarioNome,
            String ipOrigem, String userAgent) {
        Invoice inv = requireInvoice(id);
        String motivo = validarMotivoInvoice(request);
        InvoiceInativacaoValidacaoDto validacao = montarValidacaoInativacao(inv);

        if (!validacao.jaInativa) {
            throw new IllegalStateException(ApiI18nMessages.domain("estoque.invoice.error.ja_ativa"));
        }
        if (validacao.jaCancelada) {
            throw new IllegalStateException(ApiI18nMessages.domain("estoque.invoice.error.restaurar_cancelada"));
        }

        Boolean ativoAntes = inv.isActive;
        String statusAntes = statusNome(inv.status);
        inv.isActive = true;
        inv.persist();

        invoiceAuditoriaService.registrar(
                inv.id,
                inv.numeroInvoice,
                AcaoAuditoria.RESTAURACAO,
                motivo,
                statusAntes,
                statusAntes,
                ativoAntes,
                true,
                0,
                0,
                null,
                usuarioId,
                usuarioNome,
                emailAuditoria(request),
                ipOrigem,
                userAgent);

        return toInvoiceDto(inv);
    }

    private InvoiceInativacaoValidacaoDto montarValidacaoInativacao(Invoice inv) {
        InvoiceInativacaoValidacaoDto dto = new InvoiceInativacaoValidacaoDto();
        dto.statusAtual = statusNome(inv.status);
        dto.jaInativa = inv.isActive != null && !inv.isActive;
        dto.jaCancelada = inv.status == Invoice.StatusInvoice.CANCELADA;

        dto.qtdItensEstoque = ItemEstoque.count("invoiceId = ?1 and isActive = true", inv.id);
        dto.qtdLotes = Lote.count("invoiceId = ?1 and isActive = true", inv.id);

        if (dto.jaInativa) {
            dto.bloqueios.add("estoque.invoice.bloqueio.ja_inativa");
        }
        if (dto.jaCancelada) {
            dto.bloqueios.add("estoque.invoice.bloqueio.ja_cancelada");
        }
        if (dto.qtdItensEstoque > 0) {
            dto.bloqueios.add("estoque.invoice.bloqueio.itens_estoque");
        }
        if (dto.qtdLotes > 0) {
            dto.bloqueios.add("estoque.invoice.bloqueio.lotes");
        }
        if (inv.status != null && STATUS_BLOQUEIA_INATIVACAO.contains(inv.status)) {
            dto.bloqueios.add("estoque.invoice.bloqueio.status");
        }
        if (inv.dataRecebimento != null
                && (inv.status == Invoice.StatusInvoice.PENDENTE || inv.status == Invoice.StatusInvoice.EM_TRANSITO)) {
            dto.bloqueios.add("estoque.invoice.bloqueio.data_recebimento");
        }

        dto.podeInativar = dto.bloqueios.isEmpty();
        dto.podeCancelar = !dto.jaInativa && !dto.jaCancelada;
        dto.orientacao = ORIENTACAO_INATIVACAO;
        dto.orientacaoCancelamento = ORIENTACAO_CANCELAMENTO;
        return dto;
    }

    private static String validarMotivoInvoice(InvoiceAcaoRequest request) {
        if (request == null || request.motivo == null || request.motivo.isBlank()) {
            throw new IllegalArgumentException(ApiI18nMessages.domain("estoque.invoice.error.motivo_obrigatorio"));
        }
        String m = request.motivo.trim();
        if (m.length() < 5) {
            throw new IllegalArgumentException(ApiI18nMessages.domain("estoque.invoice.error.motivo_curto"));
        }
        return m;
    }

    private static String emailAuditoria(InvoiceAcaoRequest request) {
        return request != null && request.usuarioEmail != null && !request.usuarioEmail.isBlank()
                ? request.usuarioEmail.trim()
                : null;
    }

    private static String statusNome(Invoice.StatusInvoice status) {
        return status != null ? status.name() : null;
    }
    
    @Transactional
    public InvoiceDto salvarInvoice(InvoiceDto dto, Long usuarioId) {
        Invoice inv;
        if (dto.id != null) {
            inv = requireInvoice(dto.id);
        } else {
            inv = new Invoice();
            inv.tenantId = TenantConstants.tenantIdOf(tid());
            inv.createdBy = usuarioId;
        }
        
        inv.numeroInvoice = dto.numeroInvoice;
        inv.fornecedor = requireFornecedorAsl(dto.fornecedorId);
        inv.dataEmissao = dto.dataEmissao;
        inv.dataRecebimento = dto.dataRecebimento;
        inv.paisOrigem = dto.paisOrigem;
        inv.moeda = dto.moeda;
        inv.valorTotal = dto.valorTotal;
        inv.valorFrete = dto.valorFrete;
        inv.valorSeguro = dto.valorSeguro;
        inv.valorImpostos = dto.valorImpostos;
        inv.taxaCambio = dto.taxaCambio;
        inv.numeroDi = dto.numeroDi;
        inv.numeroConhecimento = dto.numeroConhecimento;
        if (dto.modalTransporte != null) {
            inv.modalTransporte = Invoice.ModalTransporte.valueOf(dto.modalTransporte);
        }
        if (dto.status != null) {
            inv.status = Invoice.StatusInvoice.valueOf(dto.status);
        }
        inv.observacoes = dto.observacoes;
        inv.arquivoInvoice = dto.arquivoInvoice;
        
        Invoice.persist(inv);
        
        // Salvar itens da invoice
        if (dto.itens != null && !dto.itens.isEmpty()) {
            for (InvoiceItemDto itemDto : dto.itens) {
                salvarInvoiceItem(inv.id, itemDto);
            }
        }
        
        return toInvoiceDto(inv);
    }
    
    @Transactional
    public InvoiceItemDto salvarInvoiceItem(Long invoiceId, InvoiceItemDto dto) {
        Invoice inv = requireInvoiceUtilizavel(invoiceId);
        
        InvoiceItem item;
        if (dto.id != null) {
            item = InvoiceItem.find("id = ?1", dto.id).firstResult();
            if (item == null) {
                throw new NotFoundException(
                        ApiI18nMessages.encode("estoque.error.item_not_found", "id", String.valueOf(dto.id)));
            }
        } else {
            item = new InvoiceItem();
            item.invoice = inv;
        }
        
        item.linha = dto.linha;
        item.partNumber = dto.partNumber;
        item.descricao = dto.descricao;
        item.quantidade = dto.quantidade;
        item.unidade = dto.unidade;
        item.valorUnitario = dto.valorUnitario;
        item.valorTotal = dto.valorTotal;
        item.quantidadeRecebida = dto.quantidadeRecebida != null ? dto.quantidadeRecebida : BigDecimal.ZERO;
        item.quantidadePendente = dto.quantidade.subtract(item.quantidadeRecebida);
        item.observacoes = dto.observacoes;
        
        // Atualizar status
        if (item.quantidadeRecebida.compareTo(BigDecimal.ZERO) == 0) {
            item.status = InvoiceItem.StatusItem.PENDENTE;
        } else if (item.quantidadeRecebida.compareTo(dto.quantidade) < 0) {
            item.status = InvoiceItem.StatusItem.PARCIAL;
        } else {
            item.status = InvoiceItem.StatusItem.COMPLETO;
        }
        
        InvoiceItem.persist(item);
        return toInvoiceItemDto(item);
    }
    
    // ==================== LOTES ====================
    
    public List<LoteDto> listarLotes(int page, int size, String search, String status, Long invoiceId) {
        StringBuilder query = new StringBuilder(qTenant("isActive = true"));
        Map<String, Object> params = new HashMap<>();

        if (search != null && !search.isBlank()) {
            query.append(" AND (LOWER(codigoLote) LIKE :search)");
            params.put("search", "%" + search.toLowerCase() + "%");
        }

        if (status != null && !status.isBlank()) {
            query.append(" AND status = :status");
            params.put("status", Lote.StatusLote.valueOf(status));
        }

        if (invoiceId != null) {
            query.append(" AND invoiceId = :invoiceId");
            params.put("invoiceId", invoiceId);
        }
        
        List<Lote> lista = Lote.find(query.toString(), Sort.by("dataEntrada").descending(), params)
                .page(Page.of(page, size))
                .list();
        return toLoteDtoList(lista);
    }
    
    public long contarLotes(String search, String status, Long invoiceId) {
        StringBuilder query = new StringBuilder(qTenant("isActive = true"));
        Map<String, Object> params = new HashMap<>();

        if (search != null && !search.isBlank()) {
            query.append(" AND (LOWER(codigoLote) LIKE :search)");
            params.put("search", "%" + search.toLowerCase() + "%");
        }

        if (status != null && !status.isBlank()) {
            query.append(" AND status = :status");
            params.put("status", Lote.StatusLote.valueOf(status));
        }

        if (invoiceId != null) {
            query.append(" AND invoiceId = :invoiceId");
            params.put("invoiceId", invoiceId);
        }

        return Lote.count(query.toString(), params);
    }
    
    public LoteDto buscarLote(Long id) {
        return toLoteDto(requireLote(id));
    }
    
    @Transactional
    public LoteDto salvarLote(LoteDto dto, Long usuarioId) {
        Lote lote;
        if (dto.id != null) {
            lote = requireLote(dto.id);
        } else {
            lote = new Lote();
            lote.tenantId = TenantConstants.tenantIdOf(tid());
            lote.createdBy = usuarioId;
            // Gerar código se não informado
            if (dto.codigoLote == null || dto.codigoLote.isBlank()) {
                lote.codigoLote = Lote.gerarCodigoLote(tid());
            } else {
                lote.codigoLote = dto.codigoLote;
            }
        }
        
        if (dto.codigoLote != null && !dto.codigoLote.isBlank()) {
            lote.codigoLote = dto.codigoLote;
        }
        
        if (dto.fornecedorId != null) {
            lote.fornecedor = requireFornecedorAsl(dto.fornecedorId);
        }
        
        if (dto.invoiceId != null) {
            boolean invoiceAlterada = lote.invoiceId == null || !dto.invoiceId.equals(lote.invoiceId);
            if (invoiceAlterada) {
                lote.invoice = requireInvoiceUtilizavel(dto.invoiceId);
            } else if (lote.invoice == null) {
                lote.invoice = requireInvoice(dto.invoiceId);
            }
        } else {
            lote.invoice = null;
        }
        
        lote.dataEntrada = dto.dataEntrada != null ? dto.dataEntrada : LocalDate.now();
        lote.dataValidade = dto.dataValidade;
        lote.quantidadeTotal = dto.quantidadeTotal != null ? dto.quantidadeTotal : 0;
        lote.quantidadeDisponivel = dto.quantidadeDisponivel != null ? dto.quantidadeDisponivel : lote.quantidadeTotal;
        lote.localizacao = dto.localizacao;
        lote.observacoes = dto.observacoes;
        
        if (dto.status != null && !dto.status.isBlank()) {
            lote.status = Lote.StatusLote.valueOf(dto.status);
        }
        
        Lote.persist(lote);
        return toLoteDto(lote);
    }
    
    private LoteDto toLoteDto(Lote lote) {
        return toLoteDto(lote, null, null);
    }

    private LoteDto toLoteDto(Lote lote, Map<Long, Fornecedor> fornecedores, Map<Long, Invoice> invoices) {
        LoteDto dto = new LoteDto();
        dto.id = lote.id;
        dto.codigoLote = lote.codigoLote;
        dto.invoiceId = lote.invoiceId;
        dto.fornecedorId = lote.fornecedorId;
        dto.dataEntrada = lote.dataEntrada;
        dto.dataValidade = lote.dataValidade;
        dto.quantidadeTotal = lote.quantidadeTotal;
        dto.quantidadeDisponivel = lote.quantidadeDisponivel;
        dto.localizacao = lote.localizacao;
        dto.status = lote.status != null ? lote.status.name() : null;
        dto.observacoes = lote.observacoes;
        dto.isActive = lote.isActive;
        dto.createdAt = lote.createdAt;
        dto.createdBy = lote.createdBy;
        
        Fornecedor fornecedor = lote.fornecedor;
        if (fornecedor == null && lote.fornecedorId != null) {
            if (fornecedores != null) {
                fornecedor = fornecedores.get(lote.fornecedorId);
            } else {
                fornecedor = Fornecedor.findById(lote.fornecedorId);
            }
        }
        if (fornecedor != null) {
            dto.fornecedorNome = fornecedor.razaoSocial;
            dto.fornecedorCodigo = fornecedor.codigo;
        }

        Invoice invoice = lote.invoice;
        if (invoice == null && lote.invoiceId != null) {
            if (invoices != null) {
                invoice = invoices.get(lote.invoiceId);
            } else {
                invoice = Invoice.findById(lote.invoiceId);
            }
        }
        if (invoice != null) {
            dto.invoiceNumero = invoice.numeroInvoice;
        }
        
        return dto;
    }

    /**
     * Converte quantidade do item (unidades, até 3 decimais) para inteiro usado no resumo do lote.
     */
    private int toQuantidadeInteira(BigDecimal quantidade) {
        if (quantidade == null) {
            return 0;
        }
        return quantidade.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    /**
     * Recalcula {@code quantidadeDisponivel} do lote a partir da soma real dos itens ativos disponíveis.
     * {@code quantidadeTotal} representa o volume já registrado no lote (não diminui em saídas).
     */
    @Transactional
    public void sincronizarQuantidadesLote(Long loteId) {
        if (loteId == null) {
            return;
        }
        Lote lote = Lote.find("id = ?1", loteId).firstResult();
        if (lote == null) {
            return;
        }

        BigDecimal disponivelBd = ItemEstoque.getEntityManager()
                .createQuery(
                        "select coalesce(sum(i.quantidade), 0) from ItemEstoque i "
                                + "where i.lote.id = :lid and i.isActive = true and i.status = :st",
                        BigDecimal.class)
                .setParameter("lid", loteId)
                .setParameter("st", ItemEstoque.StatusItemEstoque.DISPONIVEL)
                .getSingleResult();
        if (disponivelBd == null) {
            disponivelBd = BigDecimal.ZERO;
        }

        int disponivel = Math.max(0, toQuantidadeInteira(disponivelBd));
        lote.quantidadeDisponivel = disponivel;

        int totalAtual = lote.quantidadeTotal != null ? lote.quantidadeTotal : 0;
        if (disponivel > totalAtual) {
            lote.quantidadeTotal = disponivel;
        }

        if (disponivel <= 0) {
            lote.status = Lote.StatusLote.ESGOTADO;
        } else if (totalAtual > 0 && disponivel < totalAtual) {
            lote.status = Lote.StatusLote.PARCIAL;
        } else {
            lote.status = Lote.StatusLote.ATIVO;
        }
        Lote.persist(lote);
    }

    private void acrescentarTotalLote(Lote lote, BigDecimal quantidadeEntrada) {
        if (lote == null) {
            return;
        }
        int qtd = toQuantidadeInteira(quantidadeEntrada);
        if (qtd <= 0) {
            return;
        }
        int total = lote.quantidadeTotal != null ? lote.quantidadeTotal : 0;
        lote.quantidadeTotal = total + qtd;
    }

    /**
     * Corrige lotes cujo saldo ficou dessincronizado (ex.: saídas decrementavam apenas 1 unidade por movimento).
     */
    @Transactional
    public int recalcularQuantidadesTodosLotes() {
        List<Lote> lotes = Lote.list("isActive = true");
        for (Lote lote : lotes) {
            sincronizarQuantidadesLote(lote.id);
        }
        return lotes.size();
    }
    
    // ==================== ITENS DE ESTOQUE ====================
    
    public List<ItemEstoqueDto> listarItensEstoque(int page, int size, String search, String status, Long fornecedorId, Long invoiceId, Long loteId) {
        StringBuilder query = new StringBuilder(qTenant("isActive = true"));
        Map<String, Object> params = new HashMap<>();
        
        if (search != null && !search.isBlank()) {
            query.append(" AND (LOWER(partNumber) LIKE :search OR LOWER(serialNumber) LIKE :search OR LOWER(codigoRastreio) LIKE :search OR LOWER(descricao) LIKE :search OR (invoice IS NOT NULL AND LOWER(invoice.numeroInvoice) LIKE :search))");
            params.put("search", "%" + search.toLowerCase() + "%");
        }
        
        if (status != null && !status.isBlank()) {
            query.append(" AND status = :status");
            params.put("status", ItemEstoque.StatusItemEstoque.valueOf(status));
        }
        
        if (fornecedorId != null) {
            query.append(" AND fornecedorId = :fornecedorId");
            params.put("fornecedorId", fornecedorId);
        }
        if (invoiceId != null) {
            query.append(" AND invoiceId = :invoiceId");
            params.put("invoiceId", invoiceId);
        }
        if (loteId != null) {
            query.append(" AND loteId = :loteId");
            params.put("loteId", loteId);
        }
        
        List<ItemEstoque> lista = ItemEstoque.find(query.toString(), Sort.by("createdAt").descending(), params)
                .page(Page.of(page, size))
                .list();
        return toItemEstoqueDtoListCompleto(lista);
    }
    
    public long contarItensEstoque(String search, String status, Long fornecedorId, Long invoiceId, Long loteId) {
        StringBuilder query = new StringBuilder(qTenant("isActive = true"));
        Map<String, Object> params = new HashMap<>();
        
        if (search != null && !search.isBlank()) {
            query.append(" AND (LOWER(partNumber) LIKE :search OR LOWER(serialNumber) LIKE :search OR LOWER(codigoRastreio) LIKE :search OR LOWER(descricao) LIKE :search OR (invoice IS NOT NULL AND LOWER(invoice.numeroInvoice) LIKE :search))");
            params.put("search", "%" + search.toLowerCase() + "%");
        }
        
        if (status != null && !status.isBlank()) {
            query.append(" AND status = :status");
            params.put("status", ItemEstoque.StatusItemEstoque.valueOf(status));
        }
        
        if (fornecedorId != null) {
            query.append(" AND fornecedorId = :fornecedorId");
            params.put("fornecedorId", fornecedorId);
        }
        if (invoiceId != null) {
            query.append(" AND invoiceId = :invoiceId");
            params.put("invoiceId", invoiceId);
        }
        if (loteId != null) {
            query.append(" AND loteId = :loteId");
            params.put("loteId", loteId);
        }
        
        return ItemEstoque.count(query.toString(), params);
    }
    
    /**
     * Busca item por qualquer código: rastreio, part number, serial number ou número da invoice.
     * Ordem: rastreio exato → serial exato → part number exato → invoice exata → busca parcial (LIKE).
     */
    public ItemEstoqueDto buscarItemPorCodigoRastreio(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new NotFoundException(ApiI18nMessages.encode("estoque.error.codigo_nao_informado"));
        }
        
        String codigoLimpo = codigo.trim();
        Long itemIdQr = parseItemIdFromQrScan(codigoLimpo);
        if (itemIdQr != null) {
            return buscarItemEstoque(itemIdQr);
        }
        String codigoLower = codigoLimpo.toLowerCase();
        
        // 1. Tentar pelo código de rastreio (ex: BLW-202501-ABC12345)
        ItemEstoque item = ItemEstoque.find("codigoRastreio = ?1 AND isActive = true", codigoLimpo).firstResult();
        if (item != null) {
            return toItemEstoqueDtoCompleto(item);
        }
        
        // 2. Tentar pelo serial number (único por item)
        item = ItemEstoque.find("serialNumber = ?1 AND isActive = true", codigoLimpo).firstResult();
        if (item != null) {
            return toItemEstoqueDtoCompleto(item);
        }
        
        // 3. Tentar pelo part number (vários itens: prioriza disponível em FIFO por data de recebimento)
        List<ItemEstoque> porPn = listarItensDisponiveisFifoPorPartNumber(codigoLimpo);
        if (!porPn.isEmpty()) {
            return toItemEstoqueDtoCompleto(porPn.get(0));
        }
        item = ItemEstoque.find("partNumber = ?1 AND isActive = true ORDER BY status ASC, createdAt DESC", codigoLimpo)
                .firstResult();
        if (item != null) {
            return toItemEstoqueDtoCompleto(item);
        }
        
        // 3b. Número da invoice (exato, case insensitive)
        item = ItemEstoque.find("isActive = true AND invoice IS NOT NULL AND LOWER(invoice.numeroInvoice) = ?1 ORDER BY createdAt DESC", codigoLower)
                .firstResult();
        if (item != null) {
            return toItemEstoqueDtoCompleto(item);
        }
        
        // 4. Busca parcial (case insensitive): rastreio, P/N, S/N, descrição ou invoice
        item = ItemEstoque.find(
                "(LOWER(codigoRastreio) LIKE ?1 OR LOWER(partNumber) LIKE ?1 OR LOWER(serialNumber) LIKE ?1 OR LOWER(descricao) LIKE ?1 OR (invoice IS NOT NULL AND LOWER(invoice.numeroInvoice) LIKE ?1)) AND isActive = true ORDER BY createdAt DESC",
                "%" + codigoLower + "%").firstResult();
        if (item != null) {
            return toItemEstoqueDtoCompleto(item);
        }
        
        throw new NotFoundException(
                ApiI18nMessages.encode("estoque.error.item_not_found_codigo", "codigo", codigo));
    }
    
    /**
     * Busca todos os itens com um determinado part number
     */
    public List<ItemEstoqueDto> buscarItensPorPartNumber(String partNumber) {
        if (partNumber == null || partNumber.isBlank()) {
            return List.of();
        }
        @SuppressWarnings("unchecked")
        List<ItemEstoque> itens = ItemEstoque.getEntityManager()
                .createQuery(
                        "SELECT i FROM ItemEstoque i LEFT JOIN FETCH i.invoice LEFT JOIN FETCH i.lote "
                                + "WHERE lower(trim(i.partNumber)) = lower(:pn) AND i.isActive = true",
                        ItemEstoque.class)
                .setParameter("pn", partNumber.trim())
                .getResultList();
        ordenarItensFifo(itens);
        return itens.stream().map(this::toItemEstoqueDtoCompleto).collect(Collectors.toList());
    }
    
    public ItemEstoqueDto buscarItemEstoque(Long id) {
        return toItemEstoqueDtoCompleto(requireItemEstoque(id));
    }
    
    @Transactional
    public ItemEstoqueDto atualizarItemEstoque(Long id, ItemEstoqueDto dto, Long usuarioId, String usuarioNome) {
        ItemEstoque item = requireItemEstoque(id);
        if (!Boolean.TRUE.equals(item.isActive)) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.item_excluido_nao_alteravel"));
        }
        if (STATUS_BLOQUEIA_EDICAO_ITEM.contains(item.status)) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.item_quarentena_nao_alteravel"));
        }
        Long loteAnteriorId = item.loteId;
        Long invoiceAnteriorId = item.invoiceId;
        ItemEstoque.StatusItemEstoque statusAnterior = item.status;
        BigDecimal quantidadeAnterior = item.quantidade;
        String partNumberAnterior = item.partNumber;
        boolean houveAjuste = false;
        StringBuilder obsAjuste = new StringBuilder();
        
        if (dto.partNumber != null && !dto.partNumber.isBlank() && !dto.partNumber.equals(item.partNumber)) {
            obsAjuste.append(String.format("P/N: %s -> %s; ", partNumberAnterior, dto.partNumber.trim()));
            item.partNumber = dto.partNumber.trim();
            houveAjuste = true;
        }
        if (dto.quantidade != null) {
            if (dto.quantidade.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.quantidade_maior_zero"));
            }
            if (item.quantidade == null || dto.quantidade.compareTo(item.quantidade) != 0) {
                obsAjuste.append(String.format(
                        "Qtd: %s -> %s; ",
                        quantidadeAnterior != null ? quantidadeAnterior.stripTrailingZeros().toPlainString() : "0",
                        dto.quantidade.stripTrailingZeros().toPlainString()));
                item.quantidade = dto.quantidade;
                houveAjuste = true;
                if (dto.quantidade.compareTo(BigDecimal.ZERO) > 0
                        && (statusAnterior == ItemEstoque.StatusItemEstoque.CONSUMIDO
                                || statusAnterior == ItemEstoque.StatusItemEstoque.EM_USO)) {
                    item.status = ItemEstoque.StatusItemEstoque.DISPONIVEL;
                    item.osId = null;
                    item.dataConsumo = null;
                    item.consumidoPor = null;
                    obsAjuste.append("Status reaberto para DISPONIVEL; ");
                }
            }
        }
        if (dto.invoiceId != null) {
            Long novoInvoiceId = dto.invoiceId > 0 ? dto.invoiceId : null;
            if (!Objects.equals(novoInvoiceId, item.invoiceId)) {
                item.invoice = novoInvoiceId != null ? requireInvoiceUtilizavel(novoInvoiceId) : null;
                obsAjuste.append(String.format("Invoice id: %s -> %s; ", invoiceAnteriorId, novoInvoiceId));
                houveAjuste = true;
            }
        }
        if (dto.loteId != null) {
            Long novoLoteId = dto.loteId > 0 ? dto.loteId : null;
            if (!Objects.equals(novoLoteId, item.loteId)) {
                item.lote = novoLoteId != null ? requireLote(novoLoteId) : null;
                obsAjuste.append(String.format("Lote id: %s -> %s; ", loteAnteriorId, novoLoteId));
                houveAjuste = true;
            }
        }
        if (dto.estoqueMinimo != null) item.estoqueMinimo = dto.estoqueMinimo;
        if (dto.estoqueIdeal != null) item.estoqueIdeal = dto.estoqueIdeal;
        if (dto.valorUnitarioUsd != null) item.valorUnitarioUsd = dto.valorUnitarioUsd;
        if (dto.valorUnitarioBrl != null) item.valorUnitarioBrl = dto.valorUnitarioBrl;
        if (dto.localizacao != null) {
            item.localizacao = dto.localizacao.isBlank() ? null : dto.localizacao.trim();
        }
        if (dto.prateleira != null) {
            item.prateleira = dto.prateleira.isBlank() ? null : dto.prateleira.trim();
        }
        if (dto.gaveta != null) {
            item.gaveta = dto.gaveta.isBlank() ? null : dto.gaveta.trim();
        }
        item.persist();
        
        if (houveAjuste) {
            MovimentacaoEstoque mov = new MovimentacaoEstoque();
            mov.itemEstoque = item;
            mov.tipoMovimentacao = MovimentacaoEstoque.TipoMovimentacao.AJUSTE;
            mov.quantidade = item.quantidade;
            mov.quantidadeAnterior = quantidadeAnterior;
            mov.quantidadePosterior = item.quantidade;
            mov.usuarioId = usuarioId;
            mov.usuarioNome = usuarioNome;
            mov.localizacaoOrigem = item.localizacao;
            mov.motivo = "Ajuste manual de item";
            String obs = obsAjuste.toString().trim();
            mov.observacoes = obs.isEmpty() ? null : obs;
            assignMovimentacaoTenant(mov, item);
            mov.persist();
        }
        if (houveAjuste) {
            if (loteAnteriorId != null && !Objects.equals(loteAnteriorId, item.loteId)) {
                sincronizarQuantidadesLote(loteAnteriorId);
            }
            if (item.lote != null) {
                sincronizarQuantidadesLote(item.lote.id);
            }
        }
        return toItemEstoqueDtoCompleto(item);
    }

    @Transactional
    public ItemEstoqueDto excluirItemEstoque(Long id, Long usuarioId, String usuarioNome, String motivo) {
        ItemEstoque item = requireItemEstoque(id);
        if (!Boolean.TRUE.equals(item.isActive)) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.item_ja_excluido"));
        }
        if (item.status == ItemEstoque.StatusItemEstoque.CONSUMIDO) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.item_consumido_nao_excluir"));
        }
        
        item.isActive = false;
        item.status = ItemEstoque.StatusItemEstoque.DESCARTADO;
        item.persist();
        
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.itemEstoque = item;
        mov.tipoMovimentacao = MovimentacaoEstoque.TipoMovimentacao.DESCARTE;
        mov.quantidade = item.quantidade != null ? item.quantidade : BigDecimal.ZERO;
        mov.quantidadeAnterior = item.quantidade;
        mov.quantidadePosterior = BigDecimal.ZERO;
        mov.usuarioId = usuarioId;
        mov.usuarioNome = usuarioNome;
        mov.localizacaoOrigem = item.localizacao;
        mov.motivo = (motivo != null && !motivo.isBlank()) ? motivo : "Exclusão lógica de entrada incorreta";
        assignMovimentacaoTenant(mov, item);
        mov.persist();

        Long loteId = item.lote != null ? item.lote.id : item.loteId;
        if (loteId != null) {
            sincronizarQuantidadesLote(loteId);
        }
        
        return toItemEstoqueDtoCompleto(item);
    }
    
    /**
     * Atualiza estoque mínimo e ideal em lote por Part Number.
     * Para cada linha, atualiza todos os itens que tenham o part_number informado.
     */
    @Transactional
    public EstoqueMinimoLoteResultDto atualizarEstoqueMinimoLote(List<EstoqueMinimoLoteDto> linhas) {
        List<String> atualizados = new ArrayList<>();
        List<String> naoEncontrados = new ArrayList<>();
        long totalItens = 0;
        
        for (EstoqueMinimoLoteDto linha : linhas) {
            if (linha.partNumber == null || linha.partNumber.isBlank()) continue;
            String pn = linha.partNumber.trim();
            List<ItemEstoque> itens = ItemEstoque.find("partNumber = ?1 AND isActive = true", pn).list();
            if (itens.isEmpty()) {
                naoEncontrados.add(pn);
            } else {
                for (ItemEstoque item : itens) {
                    if (linha.estoqueMinimo != null) item.estoqueMinimo = linha.estoqueMinimo;
                    if (linha.estoqueIdeal != null) item.estoqueIdeal = linha.estoqueIdeal;
                    item.persist();
                    totalItens++;
                }
                atualizados.add(pn);
            }
        }
        
        EstoqueMinimoLoteResultDto result = new EstoqueMinimoLoteResultDto();
        result.partNumbersAtualizados = atualizados;
        result.partNumbersNaoEncontrados = naoEncontrados;
        result.totalItensAtualizados = totalItens;
        result.linhasProcessadas = linhas.size();
        return result;
    }
    
    /**
     * Entrada de mercadoria no estoque
     * Cria item, gera QR Code e registra movimentação
     */
    @Transactional
    public ItemEstoqueDto entradaEstoque(EntradaEstoqueDto dto, Long usuarioId, String usuarioNome) {
        if (dto.fornecedorId == null) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.fornecedor_origem_obrigatorio"));
        }
        // Criar item de estoque
        ItemEstoque item = new ItemEstoque();
        item.tenantId = TenantConstants.tenantIdOf(tid());
        item.codigoRastreio = ItemEstoque.gerarCodigoRastreio();
        item.partNumber = dto.partNumber;
        item.serialNumber = dto.serialNumber;
        item.descricao = dto.descricao;
        item.unidade = dto.unidade != null ? dto.unidade : "UN";
        item.quantidade = dto.quantidade != null ? dto.quantidade : BigDecimal.ONE;
        item.estoqueMinimo = dto.estoqueMinimo;
        item.estoqueIdeal = dto.estoqueIdeal;
        item.valorUnitarioUsd = dto.valorUnitarioUsd;
        item.valorUnitarioBrl = dto.valorUnitarioBrl;
        item.localizacao = dto.localizacao;
        item.prateleira = dto.prateleira;
        item.gaveta = dto.gaveta;
        CertificadoPecaUtil.aplicarCampos(
                item,
                dto.certTipo,
                dto.certNumero,
                dto.certEmissor,
                dto.certDataEmissao,
                dto.dataValidade,
                dto.certOrgaoAprovacao,
                dto.certificadoConformidade);
        item.dataFabricacao = dto.dataFabricacao;
        item.dataValidade = dto.dataValidade;
        item.shelfLifeMeses = dto.shelfLifeMeses;
        item.observacoes = dto.observacoes;
        item.status = ItemEstoque.StatusItemEstoque.DISPONIVEL;
        item.createdBy = usuarioId;
        
        // Vincular fornecedor (D3/P1 — exige ASL aprovado na entrada)
        if (dto.fornecedorId != null) {
            item.fornecedor = requireFornecedorAsl(dto.fornecedorId);
        }
        
        // Vincular invoice
        if (dto.invoiceId != null) {
            item.invoice = requireInvoiceUtilizavel(dto.invoiceId);
        }
        
        // Vincular ou criar lote (só cria lote se houver fornecedor; lote exige fornecedor_id NOT NULL)
        if (dto.loteId != null) {
            item.lote = requireLote(dto.loteId);
        } else if (Boolean.TRUE.equals(dto.criarLote) && item.fornecedor != null) {
            Lote lote = new Lote();
            lote.tenantId = TenantConstants.tenantIdOf(tid());
            lote.codigoLote = Lote.gerarCodigoLote(tid());
            lote.fornecedor = item.fornecedor;
            lote.invoice = item.invoice;
            lote.dataEntrada = item.invoice != null && item.invoice.dataRecebimento != null
                    ? item.invoice.dataRecebimento
                    : LocalDate.now();
            int qtdLote = toQuantidadeInteira(item.quantidade);
            lote.quantidadeTotal = Math.max(1, qtdLote);
            lote.quantidadeDisponivel = Math.max(1, qtdLote);
            lote.localizacao = dto.localizacao;
            lote.createdBy = usuarioId;
            Lote.persist(lote);
            item.lote = lote;
        } else if (item.lote != null) {
            acrescentarTotalLote(item.lote, item.quantidade);
        }
        
        item.persist();
        
        // Gerar dados do QR Code (URL pública quando configurada)
        item.qrCodeData = resolveQrCodeData(item);
        item.persist();
        
        // Registrar movimentação de entrada
        MovimentacaoEstoque mov = MovimentacaoEstoque.criarEntrada(
            item, item.quantidade, dto.invoiceId, usuarioId, usuarioNome);
        assignMovimentacaoTenant(mov, item);
        mov.persist();
        
        // Atualizar quantidade recebida no item da invoice
        if (dto.invoiceItemId != null) {
            InvoiceItem invItem = InvoiceItem.find("id = ?1", dto.invoiceItemId).firstResult();
            if (invItem != null) {
                if (invItem.invoice != null) {
                    assertInvoiceUtilizavel(invItem.invoice);
                } else if (invItem.invoiceId != null) {
                    assertInvoiceUtilizavel(requireInvoice(invItem.invoiceId));
                }
                invItem.quantidadeRecebida = invItem.quantidadeRecebida.add(item.quantidade);
                invItem.quantidadePendente = invItem.quantidade.subtract(invItem.quantidadeRecebida);
                if (invItem.quantidadeRecebida.compareTo(invItem.quantidade) >= 0) {
                    invItem.status = InvoiceItem.StatusItem.COMPLETO;
                } else {
                    invItem.status = InvoiceItem.StatusItem.PARCIAL;
                }
                InvoiceItem.persist(invItem);
            }
        }

        if (item.lote != null) {
            sincronizarQuantidadesLote(item.lote.id);
        }
        
        return toItemEstoqueDtoCompleto(item);
    }
    
    /**
     * Saída de mercadoria do estoque (consumo em OS)
     */
    @Transactional
    public ItemEstoqueDto saidaEstoque(Long itemId, Long osId, BigDecimal quantidade, 
            Long usuarioId, String usuarioNome, String motivo) {
        return saidaEstoque(itemId, osId, quantidade, usuarioId, usuarioNome, motivo, null, null, null);
    }

    /**
     * Saída com metadados de rastreio (kit FCU / trocas eventuais). {@code chaveIdempotencia} evita débito duplicado.
     */
    @Transactional
    public ItemEstoqueDto saidaEstoque(Long itemId, Long osId, BigDecimal quantidade,
            Long usuarioId, String usuarioNome, String motivo,
            String origemSaida, Integer idProdutoCatalogo, String chaveIdempotencia) {
        assertSaidaValidacaoExtra(osId, motivo);
        assertConformidadeSaida(osId);
        ItemEstoque item = requireItemEstoque(itemId);
        assertCertificadoParaSaida(item);
        estoqueQuarentenaService.assertDisponivelParaSaida(item);

        if (chaveIdempotencia != null && !chaveIdempotencia.isBlank() && existsMovimentoComChave(chaveIdempotencia)) {
            return toItemEstoqueDtoCompleto(item);
        }
        
        if (item.status != ItemEstoque.StatusItemEstoque.DISPONIVEL) {
            throw new IllegalStateException(
                    ApiI18nMessages.encode(
                            "estoque.error.item_nao_disponivel_consumo",
                            "status",
                            String.valueOf(item.status)));
        }
        if (quantidade == null || quantidade.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.saida_quantidade_maior_zero"));
        }
        if (item.quantidade == null || quantidade.compareTo(item.quantidade) > 0) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.saida_quantidade_maior_saldo"));
        }
        
        // Registrar movimentação de saída
        MovimentacaoEstoque mov = MovimentacaoEstoque.criarSaida(
            item, quantidade, osId, usuarioId, usuarioNome, motivo);
        mov.origemSaida = origemSaida;
        mov.idProdutoCatalogo = idProdutoCatalogo;
        mov.chaveIdempotencia = chaveIdempotencia;
        assignMovimentacaoTenant(mov, item);
        mov.persist();
        
        // Atualizar saldo/status do item
        item.quantidade = item.quantidade.subtract(quantidade);
        if (item.quantidade.compareTo(BigDecimal.ZERO) == 0) {
            item.status = ItemEstoque.StatusItemEstoque.CONSUMIDO;
            item.osId = osId;
            item.dataConsumo = LocalDateTime.now();
            item.consumidoPor = usuarioId;
        } else {
            item.status = ItemEstoque.StatusItemEstoque.DISPONIVEL;
        }
        item.persist();
        
        if (item.lote != null) {
            sincronizarQuantidadesLote(item.lote.id);
        }
        
        return toItemEstoqueDtoCompleto(item);
    }

    /**
     * Regras de UI/API para saída manual quando o tenant tem {@code estoque.saida.validacaoExtra}.
     */
    public SaidaRegrasCustomizadasDto regrasSaidaCustomizadas() {
        EstoqueSaidaRegrasDto r = regrasSaida();
        return new SaidaRegrasCustomizadasDto(
                r.validacaoExtra, r.motivoMinLength, r.osObrigatoria);
    }

    public EstoqueSaidaRegrasDto regrasSaida() {
        long tenantId = tenantDataAccess.currentTenantId();
        boolean extra =
                tenantFeatureService.isEnabled(
                        tenantId, TenantFeatureCodes.ESTOQUE_SAIDA_VALIDACAO_EXTRA);
        boolean exigeCert =
                tenantFeatureService.isEnabled(
                        tenantId, TenantFeatureCodes.ESTOQUE_SAIDA_EXIGE_CERTIFICADO_PECA);
        return new EstoqueSaidaRegrasDto(extra, extra ? 10 : 0, extra, exigeCert);
    }

    public CertificadoPecaDto obterCertificado(Long itemId) {
        ItemEstoque item = requireItemEstoque(itemId);
        return estoqueCertificadoService.toDto(item, exigeAnexoCertificado());
    }

    public CertificadoPecaDto salvarCertificado(Long itemId, CertificadoPecaDto body) {
        return estoqueCertificadoService.salvarCampos(itemId, body, exigeAnexoCertificado());
    }

    public CertificadoPecaDto uploadCertificadoAnexo(Long itemId, org.jboss.resteasy.reactive.multipart.FileUpload upload) {
        return estoqueCertificadoService.uploadAnexo(itemId, upload, exigeAnexoCertificado());
    }

    public java.nio.file.Path caminhoAnexoCertificado(Long itemId) {
        return estoqueCertificadoService.resolveAnexoPath(requireItemEstoque(itemId));
    }

    private boolean exigeCertificadoPeca() {
        return tenantFeatureService.isEnabled(
                tenantDataAccess.currentTenantId(),
                TenantFeatureCodes.ESTOQUE_SAIDA_EXIGE_CERTIFICADO_PECA);
    }

    private boolean exigeAnexoCertificado() {
        return exigeCertificadoPeca();
    }

    private void assertCertificadoParaSaida(ItemEstoque item) {
        if (!exigeCertificadoPeca()) {
            return;
        }
        if (!CertificadoPecaUtil.isCompleto(item, true)) {
            throw new IllegalStateException(CertificadoPecaUtil.ERROR_INCOMPLETO_SAIDA);
        }
    }

    /** P1 — calibração vencida e subcontratação vencida na OS de destino. */
    private void assertConformidadeSaida(Long osId) {
        conformidadeEnforcement.assertCalibracaoOperacionalPermitida(null);
        if (osId == null || osId <= 0) {
            return;
        }
        OS os = OS.findById(osId);
        if (os != null && os.idOs != null) {
            conformidadeEnforcement.assertSubcontratacaoOsPermitida(os.idOs);
        }
    }

    /** Validação reforçada (custom por tenant): OS e motivo mínimo. */
    private void assertSaidaValidacaoExtra(Long osId, String motivo) {
        long tenantId = tenantDataAccess.currentTenantId();
        if (!tenantFeatureService.isEnabled(
                tenantId, com.aerosuite.p1.TenantFeatureCodes.ESTOQUE_SAIDA_VALIDACAO_EXTRA)) {
            return;
        }
        if (osId == null || osId <= 0) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.os_valida_obrigatoria"));
        }
        String m = motivo != null ? motivo.trim() : "";
        if (m.length() < 10) {
            throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.motivo_saida_minimo"));
        }
    }

    public ConsultaQrRegrasDto consultaQrRegras() {
        long tenantId = tenantDataAccess.currentTenantId();
        boolean ext =
                tenantFeatureService.isEnabled(
                        tenantId, TenantFeatureCodes.ESTOQUE_CONSULTA_QR_HISTORICO_EXTENDIDO);
        return new ConsultaQrRegrasDto(ext, ext ? HISTORICO_QR_EXTENDIDO : HISTORICO_QR_PADRAO);
    }

    public int resolveHistoricoMovimentacoesLimite(int requestedSize) {
        ConsultaQrRegrasDto regras = consultaQrRegras();
        int cap = regras.historicoLimite();
        if (requestedSize <= 0) {
            return cap;
        }
        return Math.min(requestedSize, cap);
    }

    // ==================== MOVIMENTAÇÕES ====================
    
    public PageResponse<MovimentacaoEstoqueDto> listarMovimentacoes(
            int page,
            int size,
            Long itemId,
            String tipo,
            String partNumber,
            LocalDate dataInicio,
            LocalDate dataFim) {
        if (itemId != null) {
            size = resolveHistoricoMovimentacoesLimite(size);
        }
        StringBuilder query = new StringBuilder(qTenant("1=1"));
        Map<String, Object> params = new HashMap<>();

        if (itemId != null) {
            query.append(" AND itemEstoqueId = :itemId");
            params.put("itemId", itemId);
        }

        if (tipo != null && !tipo.isBlank()) {
            query.append(" AND tipoMovimentacao = :tipo");
            params.put("tipo", MovimentacaoEstoque.TipoMovimentacao.valueOf(tipo));
        }

        if (partNumber != null && !partNumber.isBlank()) {
            query.append(" AND LOWER(itemEstoque.partNumber) LIKE LOWER(:partNumber)");
            params.put("partNumber", "%" + partNumber.trim() + "%");
        }

        if (dataInicio != null) {
            query.append(" AND dataMovimentacao >= :dataInicio");
            params.put("dataInicio", dataInicio.atStartOfDay());
        }

        if (dataFim != null) {
            query.append(" AND dataMovimentacao < :dataFimExclusive");
            params.put("dataFimExclusive", dataFim.plusDays(1).atStartOfDay());
        }

        var panacheQuery = MovimentacaoEstoque.find(
                query.toString(), Sort.by("dataMovimentacao").descending(), params);
        long total = panacheQuery.count();
        List<MovimentacaoEstoque> lista = panacheQuery.page(Page.of(page, size)).list();
        List<MovimentacaoEstoqueDto> dtos = lista.stream()
                .map(this::toMovimentacaoDto)
                .collect(Collectors.toList());
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(dtos, total, totalPages, page, size, "dataMovimentacao,desc");
    }
    
    // ==================== GERAÇÃO DE QR CODE ====================
    
    /**
     * Gera imagem do QR Code para um item de estoque
     * Retorna bytes da imagem PNG
     */
    public byte[] gerarQrCodeImagem(Long itemId, int tamanho) {
        ItemEstoque item = requireItemEstoque(itemId);
        
        try {
            String dados = resolveQrCodeData(item);
            boolean storedLoopback = ServerUrlUtil.isLoopbackFrontendUrl(item.qrCodeData);
            if (item.qrCodeData == null || item.qrCodeData.isBlank()
                    || item.qrCodeData.startsWith("{")
                    || item.qrCodeData.startsWith(ItemEstoque.QR_PAYLOAD_PREFIX)
                    || storedLoopback
                    || (dados.startsWith("http") && !dados.equals(item.qrCodeData))) {
                item.qrCodeData = dados;
                item.persist();
            }
            BufferedImage qrImage = gerarQrCodeReal(dados, tamanho);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", baos);
            return baos.toByteArray();
            
        } catch (WriterException e) {
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.ESTOQUE_QR_GENERATE_FAILED, e.getMessage()), e);
        } catch (Exception e) {
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.ESTOQUE_QR_IMAGE_FAILED, e.getMessage()), e);
        }
    }
    
    private BufferedImage gerarQrCodeReal(String dados, int tamanho) throws WriterException {
        int size = Math.max(120, tamanho);
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 2);
        hints.put(EncodeHintType.ERROR_CORRECTION, com.google.zxing.qrcode.decoder.ErrorCorrectionLevel.H);

        BitMatrix matrix = new QRCodeWriter().encode(dados, BarcodeFormat.QR_CODE, size, size, hints);
        BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < size; x++) {
            for (int y = 0; y < size; y++) {
                image.setRGB(x, y, matrix.get(x, y) ? 0xFF000000 : 0xFFFFFFFF);
            }
        }
        return image;
    }
    
    // ==================== CONVERSORES DTO ====================
    
    private FornecedorDto toFornecedorDto(Fornecedor f) {
        FornecedorDto dto = new FornecedorDto();
        dto.id = f.id;
        dto.codigo = f.codigo;
        dto.razaoSocial = f.razaoSocial;
        dto.nomeFantasia = f.nomeFantasia;
        dto.cnpjCpf = f.cnpjCpf;
        dto.inscricaoEstadual = f.inscricaoEstadual;
        dto.paisOrigem = f.paisOrigem;
        dto.endereco = f.endereco;
        dto.numero = f.numero;
        dto.complemento = f.complemento;
        dto.bairro = f.bairro;
        dto.cidade = f.cidade;
        dto.estado = f.estado;
        dto.cep = f.cep;
        dto.telefone = f.telefone;
        dto.email = f.email;
        dto.website = f.website;
        dto.contatoNome = f.contatoNome;
        dto.contatoTelefone = f.contatoTelefone;
        dto.contatoEmail = f.contatoEmail;
        dto.observacoes = f.observacoes;
        dto.aslStatus = f.aslStatus;
        dto.aslEscopo = f.aslEscopo;
        dto.aslValidade = formatLocalDate(f.aslValidade);
        dto.aslAprovadoEm = formatLocalDate(f.aslAprovadoEm);
        dto.aslObservacoes = f.aslObservacoes;
        dto.isActive = f.isActive;
        dto.createdAt = f.createdAt;
        return dto;
    }

    private static java.time.LocalDate parseLocalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return java.time.LocalDate.parse(value.trim());
    }

    private static String formatLocalDate(java.time.LocalDate value) {
        return value != null ? value.toString() : null;
    }
    
    private InvoiceDto toInvoiceDto(Invoice inv) {
        return toInvoiceDto(inv, null);
    }

    private InvoiceDto toInvoiceDto(Invoice inv, Map<Long, Fornecedor> fornecedores) {
        InvoiceDto dto = new InvoiceDto();
        dto.id = inv.id;
        dto.numeroInvoice = inv.numeroInvoice;
        dto.fornecedorId = inv.fornecedorId;
        Fornecedor fornecedor = inv.fornecedor;
        if (fornecedor == null && inv.fornecedorId != null) {
            fornecedor = fornecedores != null
                    ? fornecedores.get(inv.fornecedorId)
                    : Fornecedor.findById(inv.fornecedorId);
        }
        if (fornecedor != null) {
            dto.fornecedorNome = fornecedor.razaoSocial;
            dto.fornecedorCodigo = fornecedor.codigo;
        }
        dto.dataEmissao = inv.dataEmissao;
        dto.dataRecebimento = inv.dataRecebimento;
        dto.paisOrigem = inv.paisOrigem;
        dto.moeda = inv.moeda;
        dto.valorTotal = inv.valorTotal;
        dto.valorFrete = inv.valorFrete;
        dto.valorSeguro = inv.valorSeguro;
        dto.valorImpostos = inv.valorImpostos;
        dto.taxaCambio = inv.taxaCambio;
        dto.numeroDi = inv.numeroDi;
        dto.numeroConhecimento = inv.numeroConhecimento;
        dto.modalTransporte = inv.modalTransporte != null ? inv.modalTransporte.name() : null;
        dto.status = inv.status != null ? inv.status.name() : null;
        dto.isActive = inv.isActive;
        dto.observacoes = inv.observacoes;
        dto.arquivoInvoice = inv.arquivoInvoice;
        dto.createdAt = inv.createdAt;
        
        // Carregar itens
        if (inv.itens != null) {
            dto.itens = inv.itens.stream().map(this::toInvoiceItemDto).collect(Collectors.toList());
        }
        
        return dto;
    }
    
    private InvoiceItemDto toInvoiceItemDto(InvoiceItem item) {
        InvoiceItemDto dto = new InvoiceItemDto();
        dto.id = item.id;
        dto.invoiceId = item.invoiceId;
        dto.linha = item.linha;
        dto.partNumber = item.partNumber;
        dto.descricao = item.descricao;
        dto.quantidade = item.quantidade;
        dto.unidade = item.unidade;
        dto.valorUnitario = item.valorUnitario;
        dto.valorTotal = item.valorTotal;
        dto.quantidadeRecebida = item.quantidadeRecebida;
        dto.quantidadePendente = item.quantidadePendente;
        dto.status = item.status != null ? item.status.name() : null;
        dto.observacoes = item.observacoes;
        return dto;
    }
    
    private ItemEstoqueDto toItemEstoqueDto(ItemEstoque item) {
        ItemEstoqueDto dto = new ItemEstoqueDto();
        dto.id = item.id;
        dto.codigoRastreio = item.codigoRastreio;
        dto.partNumber = item.partNumber;
        dto.serialNumber = item.serialNumber;
        dto.descricao = item.descricao;
        dto.quantidade = item.quantidade;
        dto.estoqueMinimo = item.estoqueMinimo;
        dto.estoqueIdeal = item.estoqueIdeal;
        dto.status = item.status != null ? item.status.name() : null;
        dto.localizacao = item.localizacao;
        dto.prateleira = item.prateleira;
        dto.gaveta = item.gaveta;
        dto.valorUnitarioUsd = item.valorUnitarioUsd;
        dto.valorUnitarioBrl = item.valorUnitarioBrl;
        dto.createdAt = item.createdAt;
        dto.fornecedorId = item.fornecedorId;
        dto.invoiceId = item.invoiceId;
        dto.loteId = item.loteId;
        dto.qrCodeData = resolveQrCodeData(item);
        return dto;
    }

    /**
     * Payload do QR: URL pública que abre as especificações no celular, ou {@code AERO:I:id} como fallback.
     */
    private String resolveQrCodeData(ItemEstoque item) {
        String url = buildQrPublicUrlForItem(item);
        if (url != null && !url.isBlank()) {
            return url;
        }
        return item.gerarQrCodeData();
    }

    private String buildQrPublicUrlForItem(ItemEstoque item) {
        if (item == null || item.codigoRastreio == null || item.codigoRastreio.isBlank()) {
            return null;
        }
        String base = serverUrlUtil.getFrontendUrlForQrLabels();
        if (base == null || base.isBlank()) {
            return null;
        }
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String tenantCodigo = tenantCodigoForItem(item);
        String cod = URLEncoder.encode(item.codigoRastreio.trim(), StandardCharsets.UTF_8);
        String tenant = URLEncoder.encode(tenantCodigo, StandardCharsets.UTF_8);
        return base + "/rastreio/" + cod + "?tenant=" + tenant;
    }

    /** Base URL para QR (LAN em dev, pública em produção). */
    public String getQrScanBaseUrl() {
        return serverUrlUtil.getFrontendUrlForQrLabels();
    }

    private static String tenantCodigoForItem(ItemEstoque item) {
        try {
            long tid = Long.parseLong(item.tenantId.trim());
            Tenant t = Tenant.findById(tid);
            if (t != null && t.codigo != null && !t.codigo.isBlank()) {
                return t.codigo.trim().toLowerCase(Locale.ROOT);
            }
        } catch (NumberFormatException ignored) {
            // ignore
        }
        return TenantConstants.DEFAULT_CODIGO;
    }

    /**
     * Interpreta QR compacto ({@code AERO:I:123}) ou JSON legado de etiquetas antigas.
     */
    private Long parseItemIdFromQrScan(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String c = raw.trim();
        String upper = c.toUpperCase(java.util.Locale.ROOT);
        String prefix = ItemEstoque.QR_PAYLOAD_PREFIX.toUpperCase(java.util.Locale.ROOT);
        if (upper.startsWith(prefix)) {
            return parseItemIdDigits(c.substring(ItemEstoque.QR_PAYLOAD_PREFIX.length()));
        }
        int marker = upper.indexOf(prefix);
        if (marker >= 0) {
            return parseItemIdDigits(c.substring(marker + ItemEstoque.QR_PAYLOAD_PREFIX.length()));
        }
        if (c.startsWith("{") && c.contains("\"id\"")) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"id\"\\s*:\\s*(\\d+)").matcher(c);
            if (m.find()) {
                try {
                    return Long.parseLong(m.group(1));
                } catch (NumberFormatException ignored) {
                    return null;
                }
            }
        }
        return null;
    }

    private Long parseItemIdDigits(String tail) {
        if (tail == null || tail.isBlank()) {
            return null;
        }
        String digits = tail.trim().replaceAll("\\D.*$", "");
        if (digits.isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(digits);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
    
    private List<ItemEstoqueDto> toItemEstoqueDtoListCompleto(List<ItemEstoque> items) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        Set<Long> fornecedorIds = new HashSet<>();
        Set<Long> invoiceIds = new HashSet<>();
        Set<Long> loteIds = new HashSet<>();
        for (ItemEstoque item : items) {
            if (item.fornecedor == null && item.fornecedorId != null) {
                fornecedorIds.add(item.fornecedorId);
            }
            if (item.invoice == null && item.invoiceId != null) {
                invoiceIds.add(item.invoiceId);
            }
            if (item.lote == null && item.loteId != null) {
                loteIds.add(item.loteId);
            }
        }
        Map<Long, Fornecedor> fornecedores = fornecedorIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<Fornecedor, Long>byId(Fornecedor.list("id in ?1", fornecedorIds), f -> f.id);
        Map<Long, Invoice> invoices = invoiceIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<Invoice, Long>byId(Invoice.list("id in ?1", invoiceIds), i -> i.id);
        Map<Long, Lote> lotes = loteIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<Lote, Long>byId(Lote.list("id in ?1", loteIds), l -> l.id);
        return items.stream()
                .map(item -> toItemEstoqueDtoCompleto(item, fornecedores, invoices, lotes))
                .collect(Collectors.toList());
    }

    private List<LoteDto> toLoteDtoList(List<Lote> lista) {
        if (lista == null || lista.isEmpty()) {
            return List.of();
        }
        Set<Long> fornecedorIds = new HashSet<>();
        Set<Long> invoiceIds = new HashSet<>();
        for (Lote lote : lista) {
            if (lote.fornecedor == null && lote.fornecedorId != null) {
                fornecedorIds.add(lote.fornecedorId);
            }
            if (lote.invoice == null && lote.invoiceId != null) {
                invoiceIds.add(lote.invoiceId);
            }
        }
        Map<Long, Fornecedor> fornecedores = fornecedorIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<Fornecedor, Long>byId(Fornecedor.list("id in ?1", fornecedorIds), f -> f.id);
        Map<Long, Invoice> invoices = invoiceIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<Invoice, Long>byId(Invoice.list("id in ?1", invoiceIds), i -> i.id);
        return lista.stream()
                .map(lote -> toLoteDto(lote, fornecedores, invoices))
                .collect(Collectors.toList());
    }

    private ItemEstoqueDto toItemEstoqueDtoCompleto(ItemEstoque item) {
        return toItemEstoqueDtoListCompleto(List.of(item)).get(0);
    }

    private ItemEstoqueDto toItemEstoqueDtoCompleto(
            ItemEstoque item,
            Map<Long, Fornecedor> fornecedores,
            Map<Long, Invoice> invoices,
            Map<Long, Lote> lotes) {
        ItemEstoqueDto dto = toItemEstoqueDto(item);
        
        // Informações completas de rastreabilidade
        Fornecedor fornecedor = item.fornecedor;
        if (fornecedor == null && item.fornecedorId != null) {
            fornecedor = fornecedores.get(item.fornecedorId);
        }
        if (fornecedor != null) {
            dto.fornecedorCodigo = fornecedor.codigo;
            dto.fornecedorNome = fornecedor.razaoSocial;
            dto.fornecedorPais = fornecedor.paisOrigem;
        }

        Invoice invoice = item.invoice;
        if (invoice == null && item.invoiceId != null) {
            invoice = invoices.get(item.invoiceId);
        }
        if (invoice != null) {
            dto.invoiceNumero = invoice.numeroInvoice;
            dto.invoiceData = invoice.dataEmissao;
        }

        Lote lote = item.lote;
        if (lote == null && item.loteId != null) {
            lote = lotes.get(item.loteId);
        }
        if (lote != null) {
            dto.loteCodigo = lote.codigoLote;
            dto.loteDataEntrada = lote.dataEntrada;
        }
        
        dto.unidade = item.unidade;
        dto.prateleira = item.prateleira;
        dto.gaveta = item.gaveta;
        dto.certificadoConformidade = item.certificadoConformidade;
        dto.certTipo = item.certTipo;
        dto.certNumero = item.certNumero;
        dto.certEmissor = item.certEmissor;
        dto.certDataEmissao = item.certDataEmissao;
        dto.certOrgaoAprovacao = item.certOrgaoAprovacao;
        dto.certAnexoNome = item.certAnexoNome;
        dto.certificadoTemAnexo = CertificadoPecaUtil.temAnexo(item);
        dto.certificadoCompleto = CertificadoPecaUtil.isCompleto(item, exigeAnexoCertificado());
        dto.quarentenaMotivo = item.quarentenaMotivo;
        dto.quarentenaInicioEm = item.quarentenaInicioEm;
        dto.quarentenaInicioUsuarioNome = item.quarentenaInicioUsuarioNome;
        dto.quarentenaFimEm = item.quarentenaFimEm;
        dto.quarentenaFimUsuarioNome = item.quarentenaFimUsuarioNome;
        dto.quarentenaDisposicao = item.quarentenaDisposicao;
        dto.quarentenaObservacoes = item.quarentenaObservacoes;
        dto.dataFabricacao = item.dataFabricacao;
        dto.dataValidade = item.dataValidade;
        dto.shelfLifeMeses = item.shelfLifeMeses;
        dto.observacoes = item.observacoes;
        dto.osId = item.osId;
        dto.dataConsumo = item.dataConsumo;
        
        return dto;
    }
    
    private MovimentacaoEstoqueDto toMovimentacaoDto(MovimentacaoEstoque mov) {
        MovimentacaoEstoqueDto dto = new MovimentacaoEstoqueDto();
        dto.id = mov.id;
        dto.itemEstoqueId = mov.itemEstoqueId;
        dto.tipoMovimentacao = mov.tipoMovimentacao != null ? mov.tipoMovimentacao.name() : null;
        dto.quantidade = mov.quantidade;
        dto.quantidadeAnterior = mov.quantidadeAnterior;
        dto.quantidadePosterior = mov.quantidadePosterior;
        dto.invoiceId = mov.invoiceId;
        dto.osId = mov.osId;
        dto.loteId = mov.loteId;
        dto.localizacaoOrigem = mov.localizacaoOrigem;
        dto.localizacaoDestino = mov.localizacaoDestino;
        dto.usuarioId = mov.usuarioId;
        dto.usuarioNome = mov.usuarioNome;
        dto.motivo = mov.motivo;
        dto.observacoes = mov.observacoes;
        dto.dataMovimentacao = mov.dataMovimentacao;
        dto.origemSaida = mov.origemSaida;
        dto.idProdutoCatalogo = mov.idProdutoCatalogo;
        dto.chaveIdempotencia = mov.chaveIdempotencia;
        
        if (mov.itemEstoque != null) {
            dto.itemCodigoRastreio = mov.itemEstoque.codigoRastreio;
            dto.itemPartNumber = mov.itemEstoque.partNumber;
        }
        
        return dto;
    }

    /**
     * Soma quantidade em itens de estoque com status DISPONÍVEL (part_number case-insensitive).
     */
    public BigDecimal somarDisponivelPorPn(String partNumber) {
        if (partNumber == null || partNumber.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("pn", partNumber.trim());
            nativeQueryTenant.putFilterTid(params);
            Object row = nativeQueryTenant.bindFilterTid(
                    ItemEstoque.getEntityManager().createNativeQuery(
                            "SELECT COALESCE(SUM(quantidade), 0) FROM item_estoque "
                                    + "WHERE is_active = 1 AND status = 'DISPONIVEL' "
                                    + "AND tenant_id = :filterTid "
                                    + "AND LOWER(TRIM(part_number)) = LOWER(TRIM(:pn))"),
                    params)
                    .getSingleResult();
            if (row instanceof Number n) {
                return BigDecimal.valueOf(n.doubleValue());
            }
            return BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    /**
     * Para inclusão em OS: compara quantidade solicitada (por P/N, agregando linhas iguais) com estoque disponível.
     */
    public List<DisponibilidadePnResultDto> consultarDisponibilidadeParaLinhas(List<ConsultaDisponibilidadeLinhaDto> linhas) {
        if (linhas == null || linhas.isEmpty()) {
            return List.of();
        }
        Map<String, BigDecimal> solicitadoPorChave = new LinkedHashMap<>();
        Map<String, String> pnPorChave = new LinkedHashMap<>();
        for (ConsultaDisponibilidadeLinhaDto l : linhas) {
            if (l == null || l.partNumber == null || l.partNumber.isBlank()) {
                continue;
            }
            String exib = l.partNumber.trim();
            String chave = exib.toLowerCase(Locale.ROOT);
            BigDecimal q = BigDecimal.ONE;
            if (l.quantidade != null && l.quantidade > 0) {
                q = BigDecimal.valueOf(l.quantidade);
            }
            solicitadoPorChave.merge(chave, q, BigDecimal::add);
            pnPorChave.putIfAbsent(chave, exib);
        }
        List<DisponibilidadePnResultDto> out = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : solicitadoPorChave.entrySet()) {
            String chave = e.getKey();
            BigDecimal sol = e.getValue();
            String pnLabel = pnPorChave.getOrDefault(chave, chave);
            BigDecimal disp = somarDisponivelPorPn(pnLabel);
            boolean sem = disp.compareTo(sol) < 0;
            out.add(new DisponibilidadePnResultDto(pnLabel, sol.doubleValue(), disp.doubleValue(), sem));
        }
        return out;
    }

    public boolean existsMovimentoComChave(String chaveIdempotencia) {
        if (chaveIdempotencia == null || chaveIdempotencia.isBlank()) {
            return false;
        }
        return MovimentacaoEstoque.count("chaveIdempotencia = ?1", chaveIdempotencia) > 0;
    }

    /**
     * Consome por P/N em FIFO; modo estrito (lança {@link IllegalStateException} se faltar). Mantido por compatibilidade
     * com chamadas existentes (ex.: troca eventual paga).
     */
    @Transactional
    public void consumirPorPartNumberFifo(long osPk, String partNumber, BigDecimal quantidadeTotal,
            Long usuarioId, String usuarioNome, String motivo, String origemSaida,
            Integer idProdutoCatalogo, String chaveIdempotenciaLinha) {
        consumirPorPartNumberFifo(osPk, partNumber, quantidadeTotal, usuarioId, usuarioNome,
                motivo, origemSaida, idProdutoCatalogo, chaveIdempotenciaLinha, true);
    }

    /**
     * Consome quantidade por P/N em FIFO (data de recebimento da invoice, depois entrada do lote, depois cadastro;
     * desempate por {@code item_estoque.id}), com idempotência apenas na primeira fatia. Quando {@code lancarSeFaltar = false},
     * faz baixa parcial silenciosa (apenas log) e retorna a quantidade pendente — útil para fluxos que avisam déficit
     * por outra via (ex.: notificação de déficit do kit FCU).
     *
     * @return quantidade pendente (zero se totalmente atendido).
     */
    @Transactional
    public BigDecimal consumirPorPartNumberFifo(long osPk, String partNumber, BigDecimal quantidadeTotal,
            Long usuarioId, String usuarioNome, String motivo, String origemSaida,
            Integer idProdutoCatalogo, String chaveIdempotenciaLinha, boolean lancarSeFaltar) {
        if (quantidadeTotal == null || quantidadeTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (partNumber == null || partNumber.isBlank()) {
            if (lancarSeFaltar) {
                throw new IllegalStateException(ApiI18nMessages.encode("estoque.error.part_number_obrigatorio"));
            }
            LOG.warn("EstoqueService.consumirPorPartNumberFifo (tolerante) - P/N vazio; pulando.");
            return quantidadeTotal;
        }
        String pn = partNumber.trim();
        Long uid = usuarioId != null ? usuarioId : 0L;
        String unome = usuarioNome != null ? usuarioNome : "Sistema";

        if (chaveIdempotenciaLinha != null && !chaveIdempotenciaLinha.isBlank()
                && existsMovimentoComChave(chaveIdempotenciaLinha)) {
            return BigDecimal.ZERO;
        }

        List<ItemEstoque> itens = listarItensDisponiveisFifoPorPartNumber(pn);

        BigDecimal remaining = quantidadeTotal;
        String chaveFatia = chaveIdempotenciaLinha;

        for (ItemEstoque item : itens) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            if (item.quantidade == null || item.quantidade.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal usar = remaining.min(item.quantidade);
            saidaEstoque(item.id, osPk, usar, uid, unome, motivo, origemSaida, idProdutoCatalogo, chaveFatia);
            chaveFatia = null;
            remaining = remaining.subtract(usar);
        }

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            if (lancarSeFaltar) {
                throw new IllegalStateException(
                        ApiI18nMessages.encode(
                                "estoque.error.estoque_insuficiente",
                                Map.of(
                                        "pn", pn,
                                        "remaining",
                                        remaining.stripTrailingZeros().toPlainString())));
            }
            LOG.warnf("EstoqueService.consumirPorPartNumberFifo (tolerante) - estoque insuficiente para P/N \"%s\"; pendente %s un. Será sinalizado por notificação de déficit.",
                    pn, remaining.stripTrailingZeros().toPlainString());
        }
        return remaining;
    }

    /**
     * Data de referência para FIFO: recebimento da invoice, depois entrada do lote, depois cadastro do item.
     */
    private static LocalDate dataReferenciaFifo(ItemEstoque item) {
        if (item == null) {
            return LocalDate.MAX;
        }
        if (item.invoice != null && item.invoice.dataRecebimento != null) {
            return item.invoice.dataRecebimento;
        }
        if (item.lote != null && item.lote.dataEntrada != null) {
            return item.lote.dataEntrada;
        }
        if (item.createdAt != null) {
            return item.createdAt.toLocalDate();
        }
        return LocalDate.MAX;
    }

    private static void ordenarItensFifo(List<ItemEstoque> itens) {
        if (itens == null || itens.size() < 2) {
            return;
        }
        itens.sort(Comparator
                .comparing(EstoqueService::dataReferenciaFifo)
                .thenComparing(i -> i.id != null ? i.id : Long.MAX_VALUE));
    }

    private List<ItemEstoque> listarItensDisponiveisFifoPorPartNumber(String partNumberNormalizado) {
        @SuppressWarnings("unchecked")
        List<ItemEstoque> itens = ItemEstoque.getEntityManager()
                .createQuery(
                        "SELECT i FROM ItemEstoque i "
                                + "LEFT JOIN FETCH i.invoice "
                                + "LEFT JOIN FETCH i.lote "
                                + "WHERE lower(trim(i.partNumber)) = lower(:pn) "
                                + "AND i.isActive = true AND i.status = :st AND i.quantidade > 0",
                        ItemEstoque.class)
                .setParameter("pn", partNumberNormalizado)
                .setParameter("st", ItemEstoque.StatusItemEstoque.DISPONIVEL)
                .getResultList();
        ordenarItensFifo(itens);
        return itens;
    }

    public PageResponse<SaidaProdutoRastreioLinhaDto> listarRastreioSaidasAutomaticas(
            int page, int size,
            String partNumberContains,
            String origemSaida,
            Long osPk,
            Integer produtoCatalogoId,
            LocalDate dataInicio,
            LocalDate dataFim) {
        var em = ItemEstoque.getEntityManager();
        Map<String, Object> params = new HashMap<>();
        nativeQueryTenant.putFilterTid(params);
        StringBuilder fromWhere = new StringBuilder(
                " FROM movimentacao_estoque m "
                        + "JOIN item_estoque i ON i.id = m.item_estoque_id "
                        + "LEFT JOIN os o ON o.id = m.os_id "
                        + "LEFT JOIN fcu f ON f.id = o.id_fcu "
                        + "LEFT JOIN product p ON p.id = m.id_produto_catalogo "
                        + "WHERE m.tenant_id = :filterTid AND i.tenant_id = :filterTid "
                        + "AND m.tipo_movimentacao = 'SAIDA' "
                        + "AND (m.origem_saida IN ('OS_FCU_KIT','TROCAS_EVENTUAL') "
                        + "OR (m.origem_saida IS NULL AND m.os_id IS NOT NULL AND ("
                        + "m.motivo LIKE 'Kit FCU na OS%' OR m.motivo LIKE 'Troca eventual paga%'))) ");

        if (origemSaida != null && !origemSaida.isBlank()) {
            String o = origemSaida.trim();
            if (OsEstoqueSaidaAutomacaoService.ORIGEM_KIT_FCU.equals(o)) {
                fromWhere.append("AND (m.origem_saida = :origem OR (m.origem_saida IS NULL AND m.motivo LIKE 'Kit FCU na OS%')) ");
            } else if (OsEstoqueSaidaAutomacaoService.ORIGEM_TROCAS_EVENTUAL.equals(o)) {
                fromWhere.append("AND (m.origem_saida = :origem OR (m.origem_saida IS NULL AND m.motivo LIKE 'Troca eventual paga%')) ");
            } else {
                fromWhere.append("AND m.origem_saida = :origem ");
            }
            params.put("origem", o);
        }
        if (osPk != null) {
            // Aceita tanto a PK (os.id) quanto o número exibido da OS (os.id_os) — usuários costumam digitar o id_os.
            fromWhere.append("AND (m.os_id = :osFiltro OR o.id_os = :osFiltro) ");
            params.put("osFiltro", osPk);
        }
        if (produtoCatalogoId != null) {
            fromWhere.append("AND m.id_produto_catalogo = :pcid ");
            params.put("pcid", produtoCatalogoId);
        }
        if (partNumberContains != null && !partNumberContains.isBlank()) {
            fromWhere.append("AND LOWER(i.part_number) LIKE LOWER(:pn) ");
            params.put("pn", "%" + partNumberContains.trim() + "%");
        }
        if (dataInicio != null) {
            // Linhas legadas podem ter data_movimentacao NULL; não excluir só por causa do filtro.
            fromWhere.append("AND (m.data_movimentacao IS NULL OR m.data_movimentacao >= :d0) ");
            params.put("d0", dataInicio.atStartOfDay());
        }
        if (dataFim != null) {
            fromWhere.append("AND (m.data_movimentacao IS NULL OR m.data_movimentacao < :d1) ");
            params.put("d1", dataFim.plusDays(1).atStartOfDay());
        }

        Query countQ = nativeQueryTenant.bindFilterTid(
                em.createNativeQuery("SELECT COUNT(m.id) " + fromWhere), params);
        long total = ((Number) countQ.getSingleResult()).longValue();

        String select = "SELECT m.id, m.data_movimentacao, m.quantidade, m.origem_saida, m.chave_idempotencia, "
                + "m.motivo, m.usuario_nome, m.os_id, o.id_os, o.dt_abertura, o.cliente_nome, o.id_fcu, "
                + "f.pn, f.fcu_codigo, f.fcu_description, "
                + "i.part_number, i.id, i.codigo_rastreio, m.id_produto_catalogo, p.name ";

        int offset = Math.max(0, page) * Math.max(1, size);
        Query listQ = nativeQueryTenant.bindFilterTid(
                em.createNativeQuery(select + fromWhere + " ORDER BY m.data_movimentacao DESC, m.id DESC"),
                params);
        listQ.setFirstResult(offset);
        listQ.setMaxResults(Math.max(1, size));

        @SuppressWarnings("unchecked")
        List<Object[]> rows = listQ.getResultList();
        List<SaidaProdutoRastreioLinhaDto> items = new ArrayList<>();
        for (Object[] r : rows) {
            SaidaProdutoRastreioLinhaDto dto = new SaidaProdutoRastreioLinhaDto();
            dto.movimentacaoId = r[0] != null ? ((Number) r[0]).longValue() : null;
            if (r[1] instanceof LocalDateTime ldt) {
                dto.dataMovimentacao = ldt;
            } else if (r[1] instanceof java.sql.Timestamp ts) {
                dto.dataMovimentacao = ts.toLocalDateTime();
            }
            dto.quantidade = r[2] != null ? new BigDecimal(r[2].toString()) : null;
            String motivoRow = r[5] != null ? r[5].toString() : null;
            dto.origemSaida = inferOrigemSaidaRastreio(r[3] != null ? r[3].toString() : null, motivoRow);
            dto.chaveIdempotencia = r[4] != null ? r[4].toString() : null;
            dto.motivo = motivoRow;
            dto.usuarioNome = r[6] != null ? r[6].toString() : null;
            dto.osId = r[7] != null ? ((Number) r[7]).longValue() : null;
            dto.idOs = r[8] != null ? ((Number) r[8]).intValue() : null;
            if (r[9] instanceof LocalDate ld) {
                dto.dtAberturaOs = ld;
            } else if (r[9] instanceof java.sql.Date sd) {
                dto.dtAberturaOs = sd.toLocalDate();
            }
            dto.clienteNome = r[10] != null ? r[10].toString() : null;
            dto.idFcu = r[11] != null ? ((Number) r[11]).intValue() : null;
            dto.fcuPn = r[12] != null ? r[12].toString() : null;
            dto.fcuCodigo = r[13] != null ? r[13].toString() : null;
            dto.fcuDescription = r[14] != null ? r[14].toString() : null;
            dto.partNumber = r[15] != null ? r[15].toString() : null;
            dto.itemEstoqueId = r[16] != null ? ((Number) r[16]).longValue() : null;
            dto.codigoRastreio = r[17] != null ? r[17].toString() : null;
            dto.idProdutoCatalogo = r[18] != null ? ((Number) r[18]).intValue() : null;
            dto.produtoCatalogoNome = r[19] != null ? r[19].toString() : null;
            items.add(dto);
        }

        int totalPages = size > 0 ? (int) Math.ceil(total / (double) size) : 0;
        return new PageResponse<>(items, total, totalPages, page, size, null);
    }

    /**
     * Kit FCU por OS: paginação por OS; produtos do kit vêm aninhados em {@link OsKitRastreioResumoDto#produtosKit}.
     */
    public PageResponse<OsKitRastreioResumoDto> listarKitCatalogoFcuPorOsLegado(
            int page,
            int size,
            String partNumberContains,
            Long osPk,
            Integer produtoCatalogoId,
            LocalDate dataInicio,
            LocalDate dataFim) {
        var em = ItemEstoque.getEntityManager();
        Map<String, Object> params = new HashMap<>();
        nativeQueryTenant.putFilterTid(params);
        StringBuilder fromWhere = new StringBuilder(
                " FROM os o "
                        + "LEFT JOIN fcu f ON f.id = o.id_fcu "
                        + "INNER JOIN associacao_fcu af ON af.id_fcu = o.id_fcu AND af.tenant_id = :filterTid "
                        + "INNER JOIN product p ON p.id = af.id_product AND p.tenant_id = :filterTid "
                        + "WHERE o.tenant_id = :filterTid "
                        + "AND (o.is_active IS NULL OR o.is_active = 1) "
                        + "AND o.id_fcu IS NOT NULL AND o.id_fcu > 0 ");

        if (osPk != null) {
            fromWhere.append("AND (o.id = :osFiltro OR o.id_os = :osFiltro) ");
            params.put("osFiltro", osPk);
        }
        if (produtoCatalogoId != null) {
            fromWhere.append("AND p.id = :pcid ");
            params.put("pcid", produtoCatalogoId);
        }
        if (partNumberContains != null && !partNumberContains.isBlank()) {
            fromWhere.append(
                    "AND LOWER(TRIM(COALESCE(p.productpn,''))) COLLATE utf8mb4_unicode_ci "
                            + "LIKE LOWER(TRIM(:pn)) COLLATE utf8mb4_unicode_ci ");
            params.put("pn", "%" + partNumberContains.trim() + "%");
        }
        if (dataInicio != null) {
            fromWhere.append("AND (o.dt_abertura IS NULL OR o.dt_abertura >= :d0) ");
            params.put("d0", dataInicio);
        }
        if (dataFim != null) {
            fromWhere.append("AND (o.dt_abertura IS NULL OR o.dt_abertura <= :d1) ");
            params.put("d1", dataFim);
        }

        Query countDistinctOs = nativeQueryTenant.bindFilterTid(
                em.createNativeQuery("SELECT COUNT(DISTINCT o.id) " + fromWhere), params);
        long totalOs = ((Number) countDistinctOs.getSingleResult()).longValue();

        String confirmacaoSub = "EXISTS ( "
                + "SELECT 1 FROM movimentacao_estoque m "
                + "INNER JOIN item_estoque i ON i.id = m.item_estoque_id "
                + "WHERE m.tenant_id = :filterTid AND i.tenant_id = :filterTid "
                + "AND m.os_id = o.id "
                + "AND m.tipo_movimentacao = 'SAIDA' "
                + "AND (m.origem_saida = 'OS_FCU_KIT' "
                + "     OR (m.origem_saida IS NULL AND m.motivo LIKE 'Kit FCU na OS%')) "
                + "AND ( "
                + "  (m.id_produto_catalogo IS NOT NULL AND m.id_produto_catalogo <> 0 AND m.id_produto_catalogo = p.id) "
                + "  OR ( "
                + "    (m.id_produto_catalogo IS NULL OR m.id_produto_catalogo = 0) "
                + "    AND LOWER(TRIM(COALESCE(i.part_number,''))) COLLATE utf8mb4_unicode_ci = "
                + "        LOWER(TRIM(COALESCE(p.productpn,''))) COLLATE utf8mb4_unicode_ci "
                + "  ) "
                + ") ) ";

        String osGroupSelect = "SELECT o.id, o.id_os, o.cliente_nome, o.dt_abertura, o.id_fcu, "
                + "f.pn, f.fcu_codigo, f.fcu_description ";

        String osGroupSuffix = fromWhere
                + " GROUP BY o.id, o.id_os, o.cliente_nome, o.dt_abertura, o.id_fcu, f.pn, f.fcu_codigo, f.fcu_description "
                + "ORDER BY o.dt_abertura DESC, o.id DESC ";

        int offset = Math.max(0, page) * Math.max(1, size);
        Query osPageQ = nativeQueryTenant.bindFilterTid(
                em.createNativeQuery(osGroupSelect + osGroupSuffix), params);
        osPageQ.setFirstResult(offset);
        osPageQ.setMaxResults(Math.max(1, size));

        @SuppressWarnings("unchecked")
        List<Object[]> osRows = osPageQ.getResultList();

        List<OsKitRastreioResumoDto> resumoList = new ArrayList<>();
        Map<Long, OsKitRastreioResumoDto> porOsId = new LinkedHashMap<>();
        List<Long> osIds = new ArrayList<>();

        for (Object[] r : osRows) {
            OsKitRastreioResumoDto dto = new OsKitRastreioResumoDto();
            dto.osId = r[0] != null ? ((Number) r[0]).longValue() : null;
            if (dto.osId == null) {
                continue;
            }
            dto.idOs = r[1] != null ? ((Number) r[1]).intValue() : null;
            dto.clienteNome = r[2] != null ? r[2].toString() : null;
            if (r[3] instanceof LocalDate ld) {
                dto.dtAberturaOs = ld;
            } else if (r[3] instanceof java.sql.Date sd) {
                dto.dtAberturaOs = sd.toLocalDate();
            }
            dto.idFcu = r[4] != null ? ((Number) r[4]).intValue() : null;
            dto.fcuPn = r[5] != null ? r[5].toString() : null;
            dto.fcuCodigo = r[6] != null ? r[6].toString() : null;
            dto.fcuDescription = r[7] != null ? r[7].toString() : null;
            dto.quantidadeItensKit = 0;
            dto.quantidadeItensConfirmadosEstoque = 0;
            porOsId.put(dto.osId, dto);
            osIds.add(dto.osId);
            resumoList.add(dto);
        }

        if (!osIds.isEmpty()) {
            String prodSelect = "SELECT o.id, p.id, p.productpn, p.name, COALESCE(af.qtd_product, 1), " + confirmacaoSub
                    + " FROM os o "
                    + "INNER JOIN associacao_fcu af ON af.id_fcu = o.id_fcu AND af.tenant_id = :filterTid "
                    + "INNER JOIN product p ON p.id = af.id_product AND p.tenant_id = :filterTid "
                    + "WHERE o.tenant_id = :filterTid AND o.id IN :osIds "
                    + "ORDER BY o.id ASC, af.id ASC ";
            Map<String, Object> prodParams = new HashMap<>();
            prodParams.put("osIds", osIds);
            Query prodQ = nativeQueryTenant.bindFilterTid(em.createNativeQuery(prodSelect), prodParams);
            @SuppressWarnings("unchecked")
            List<Object[]> prodRows = prodQ.getResultList();
            for (Object[] pr : prodRows) {
                Long oid = pr[0] != null ? ((Number) pr[0]).longValue() : null;
                OsKitRastreioResumoDto parent = oid != null ? porOsId.get(oid) : null;
                if (parent == null) {
                    continue;
                }
                KitProdutoPorOsLinhaDto line = new KitProdutoPorOsLinhaDto();
                line.produtoCatalogoId = pr[1] != null ? ((Number) pr[1]).intValue() : null;
                line.productPn = pr[2] != null ? pr[2].toString() : null;
                line.productName = pr[3] != null ? pr[3].toString() : null;
                line.quantidadeKit = pr[4] != null ? ((Number) pr[4]).intValue() : 1;
                boolean conf = false;
                if (pr[5] instanceof Boolean b) {
                    conf = b;
                } else if (pr[5] instanceof Number n) {
                    conf = n.intValue() != 0;
                }
                line.confirmadoEmEstoque = conf;
                line.informacaoLegada = !conf;
                parent.produtosKit.add(line);
                parent.quantidadeItensKit++;
                if (conf) {
                    parent.quantidadeItensConfirmadosEstoque++;
                }
            }
        }

        int totalPages = size > 0 ? (int) Math.ceil(totalOs / (double) size) : 0;
        return new PageResponse<>(resumoList, totalOs, totalPages, page, size, null);
    }

    /**
     * Linhas antigas sem {@code origem_saida} usam o mesmo texto de motivo que {@link OsEstoqueSaidaAutomacaoService}.
     */
    private static String inferOrigemSaidaRastreio(String origemDb, String motivo) {
        if (origemDb != null && !origemDb.isBlank()) {
            return origemDb;
        }
        if (motivo == null) {
            return null;
        }
        if (motivo.startsWith("Kit FCU na OS")) {
            return OsEstoqueSaidaAutomacaoService.ORIGEM_KIT_FCU;
        }
        if (motivo.startsWith("Troca eventual paga")) {
            return OsEstoqueSaidaAutomacaoService.ORIGEM_TROCAS_EVENTUAL;
        }
        return null;
    }
}
