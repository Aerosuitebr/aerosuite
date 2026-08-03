package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.TenantConstants;

import com.aerosuite.domain.Product;
import com.aerosuite.dto.ProductDto;
import com.aerosuite.mapping.ProductMapper;
import com.aerosuite.util.CodigoBarrasUtil;
import com.aerosuite.util.FieldLengthValidator;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.logging.Logger;

@ApplicationScoped
public class ProductService {
    private static final Logger LOGGER = Logger.getLogger(ProductService.class.getName());
    
    @Inject ProductMapper mapper;
    @Inject TenantDataAccess tenantDataAccess;
    @Inject InternalUserContext internalUserContext;

    private long tid() {
        return tenantDataAccess.currentTenantId();
    }

    private Product requireProduct(Integer id) {
        Product e = Product.find("id = ?1", id).firstResult();
        if (e == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NOT_FOUND, "id", String.valueOf(id)));
        }
        return e;
    }

    public record SearchResult(java.util.List<ProductDto> items, long total) {}

    public SearchResult search(Integer page, Integer size, String sort, String q,
                               String status, String local, String pn,
                               Integer invoice, Integer qtyMin, Integer qtyMax,
                               BigDecimal priceMin, BigDecimal priceMax, Boolean isActive) {
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? size : 10;

        Sort sortObj = Sort.by("id").ascending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            boolean desc = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        StringJoiner where = new StringJoiner(" and ");
        Map<String, Object> params = new HashMap<>();

        // null = todos; true = ativos; false = inativos
        if (isActive != null) {
            where.add("isActive = :isActive");
            params.put("isActive", isActive);
        }

        // Busca dinâmica: por ID, nome, descrição, código (productpn) ou data
        if (q != null && !q.isBlank()) {
            String searchTerm = q.trim();
            
            // Tentar identificar se é busca por ID (número inteiro)
            Integer searchId = null;
            try {
                searchId = Integer.parseInt(searchTerm);
            } catch (NumberFormatException ignored) {}
            
            // Tentar identificar se é busca por data (formato dd/MM/yyyy, yyyy-MM-dd, dd.MM.yyyy ou ddMMyyyy)
            java.time.LocalDate searchDate = parseSearchDate(searchTerm);
            
            // Construir busca dinâmica
            StringBuilder searchCondition = new StringBuilder("(");
            List<String> conditions = new ArrayList<>();
            
            // Busca por ID exato (se for número)
            if (searchId != null) {
                conditions.add("id = :searchId");
                params.put("searchId", searchId);
            }
            
            // Busca por texto em nome, descrição, código e código de barras
            String likePattern = "%" + searchTerm.toLowerCase() + "%";
            conditions.add("LOWER(name) like :qText");
            conditions.add("LOWER(description) like :qText");
            conditions.add("LOWER(productpn) like :qText");
            conditions.add("codigoBarras like :qBarcode");
            params.put("qText", likePattern);
            params.put("qBarcode", "%" + searchTerm + "%");
            
            // Busca exata por código de barras (EAN-13)
            if (searchTerm.matches("\\d{8,13}")) {
                conditions.add("codigoBarras = :qBarcodeExact");
                params.put("qBarcodeExact", searchTerm);
            }
            
            // Busca por data de criação (se for data válida)
            if (searchDate != null) {
                conditions.add("CAST(createdAt AS date) = :searchDate");
                params.put("searchDate", searchDate);
            }
            
            searchCondition.append(String.join(" or ", conditions));
            searchCondition.append(")");
            where.add(searchCondition.toString());
        }
        if (status != null && !status.isBlank()) { where.add("status = :status");   params.put("status", status); }
        if (local != null && !local.isBlank())   { where.add("local = :local");     params.put("local", local); }
        if (pn != null && !pn.isBlank())    { where.add("productpn like :pn");     params.put("pn", "%"+pn+"%"); }
        if (invoice != null)                { where.add("invoice = :invoice");     params.put("invoice", invoice); }
        if (qtyMin != null)                 { where.add("quantity >= :qtyMin");    params.put("qtyMin", qtyMin); }
        if (qtyMax != null)                 { where.add("quantity <= :qtyMax");    params.put("qtyMax", qtyMax); }
        if (priceMin != null)               { where.add("price >= :priceMin");     params.put("priceMin", priceMin); }
        if (priceMax != null)               { where.add("price <= :priceMax");     params.put("priceMax", priceMax); }

        PanacheQuery<Product> query = Product.find(where.toString(), sortObj, params);

        long total = query.count();
        java.util.List<ProductDto> items = query.page(Page.of(p, s)).list().stream().map(mapper::toDto).toList();
        
        return new SearchResult(items, total);
    }

    public ProductDto getById(Integer id) {
        Product e = Product.find("id = ?1 and isActive = ?2", id, true).firstResult();
        return e != null ? mapper.toDto(e) : null;
    }

    private static final int MAX_NAME_LEN = 255;
    private static final int MAX_PN_LEN = 64;
    private static final int MAX_DESCRIPTION_LEN = 1000;
    private static final int MAX_LOCAL_LEN = 100;
    private static final Pattern PN_PATTERN = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._-]*$");

    private void assertValidProductPn(String pn) {
        if (pn == null || pn.isBlank()) {
            return;
        }
        String trimmed = pn.trim();
        if (!PN_PATTERN.matcher(trimmed).matches()) {
            throw new jakarta.ws.rs.BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.PRODUCT_PN_INVALID));
        }
    }

    private void validateProductFields(Product e) {
        assertValidProductPn(e.productpn);
        e.name = FieldLengthValidator.trimRequireMax(e.name, MAX_NAME_LEN, "name");
        e.productpn = FieldLengthValidator.trimRequireMax(e.productpn, MAX_PN_LEN, "productpn");
        e.description = FieldLengthValidator.trimRequireMax(e.description, MAX_DESCRIPTION_LEN, "description");
        e.local = FieldLengthValidator.trimRequireMax(e.local, MAX_LOCAL_LEN, "local");
    }

    @Transactional
    public ProductDto create(ProductDto dto) {
        Product e = mapper.toEntity(dto);
        validateProductFields(e);
        
        assertUniqueProductPn(e.productpn, null);
        
        // Definir campos de auditoria automaticamente
        e.createdAt = LocalDateTime.now();
        e.updatedAt = LocalDateTime.now();
        e.createdBy = resolveCreatedBy();
        e.isActive = e.isActive != null ? e.isActive : true;
        e.tenantId = TenantConstants.tenantIdOf(tid());
        
        // Gerar código de barras vinculado ao P/N quando informado
        if (e.productpn != null && !e.productpn.isBlank()) {
            e.codigoBarras = CodigoBarrasUtil.gerarCodigoBarrasPorPn(e.productpn.trim());
        } else if (e.codigoBarras == null || e.codigoBarras.isBlank()) {
            // Tentar gerar código único (pode precisar de algumas tentativas se houver colisão)
            String codigoBarras = null;
            int tentativas = 0;
            while (codigoBarras == null && tentativas < 10) {
                String codigoTentativa = CodigoBarrasUtil.gerarCodigoBarras();
                // Verificar se já existe (pode haver colisão rara)
                Product existente = Product.find("codigoBarras = ?1", codigoTentativa).firstResult();
                if (existente == null) {
                    codigoBarras = codigoTentativa;
                }
                tentativas++;
            }
            
            if (codigoBarras == null) {
                // Se ainda não conseguiu, usar timestamp + random como fallback
                codigoBarras = CodigoBarrasUtil.gerarCodigoBarras();
                LOGGER.warning("Código de barras gerado após múltiplas tentativas: " + codigoBarras);
            }
            
            e.codigoBarras = codigoBarras;
            LOGGER.info("Código de barras gerado automaticamente para novo produto: " + codigoBarras);
        }
        
        e.persist();
        
        // Após persistir, se não havia P/N, opcionalmente usar ID para código estável
        if ((e.productpn == null || e.productpn.isBlank()) && e.id != null && e.codigoBarras != null) {
            // Opcional: Regenerar com base no ID para garantir unicidade baseada no ID
            String codigoPorId = CodigoBarrasUtil.gerarCodigoBarrasPorId(e.id);
            // Verificar se não há colisão
            Product existente = Product.find("codigoBarras = ?1 and id != ?2", codigoPorId, e.id).firstResult();
            if (existente == null) {
                e.codigoBarras = codigoPorId;
                LOGGER.info("Código de barras atualizado para usar ID do produto: " + codigoPorId);
            }
        }
        
        return mapper.toDto(e);
    }

    @Transactional
    public ProductDto update(Integer id, ProductDto dto) {
        Product e = requireProduct(id);
        
        // Se o DTO contém isActive=false, fazer soft delete (inativar)
        if (dto.isActive() != null && !dto.isActive()) {
            e.isActive = false;
            e.updatedAt = LocalDateTime.now();
            return mapper.toDto(e);
        }
        
        if (dto.productpn() != null && !dto.productpn().isBlank()) {
            assertUniqueProductPn(dto.productpn(), id);
        }
        
        // Caso contrário, atualizar normalmente
        // Salvar o valor atual de isActive antes do update
        Boolean currentIsActive = e.isActive;
        e.updatedAt = LocalDateTime.now();
        mapper.updateEntity(dto, e);
        validateProductFields(e);
        // Restaurar o valor de isActive (não permitir alterar diretamente pelo update normal)
        e.isActive = currentIsActive;
        return mapper.toDto(e);
    }

    @Transactional
    public ProductDto delete(Integer id) {
        Product e = requireProduct(id);
        
        // Soft delete - inativar ao invés de deletar fisicamente
        e.isActive = false;
        e.updatedAt = LocalDateTime.now();
        return mapper.toDto(e);
    }
    
    @Transactional
    public ProductDto inactivate(Integer id) {
        return delete(id); // Alias para delete (soft delete)
    }

    @Transactional
    public ProductDto updatePhoto(Integer id, String photoUrl) {
        Product e = requireProduct(id);
        e.photoUrl = photoUrl;
        e.updatedAt = LocalDateTime.now();
        return mapper.toDto(e);
    }
    
    /**
     * Gera códigos de barras para todos os produtos que ainda não possuem
     * @return Map com estatísticas da operação
     */
    @Transactional
    public Map<String, Object> gerarCodigosBarrasParaTodos() {
        LOGGER.info("Iniciando geração de códigos de barras para produtos existentes...");
        
        // Buscar todos os produtos que não têm código de barras
        List<Product> produtosSemCodigo = Product.find("(codigoBarras is null or codigoBarras = '')").list();
        
        int totalProcessados = 0;
        int totalAtualizados = 0;
        int totalErros = 0;
        List<String> erros = new ArrayList<>();
        
        for (Product produto : produtosSemCodigo) {
            try {
                totalProcessados++;
                
                // Gerar código de barras baseado no ID do produto
                String codigoBarras = CodigoBarrasUtil.gerarCodigoBarrasPorId(produto.id);
                
                // Verificar se já existe (colisão rara)
                Product existente = Product.find("codigoBarras = ?1 and id != ?2", codigoBarras, produto.id).firstResult();
                if (existente != null) {
                    // Se houver colisão, gerar um código aleatório
                    codigoBarras = CodigoBarrasUtil.gerarCodigoBarras();
                    // Verificar novamente
                    existente = Product.find("codigoBarras = ?1 and id != ?2", codigoBarras, produto.id).firstResult();
                    if (existente != null) {
                        // Se ainda houver colisão, adicionar sufixo único
                        codigoBarras = codigoBarras.substring(0, 12) + (produto.id % 10);
                    }
                }
                
                produto.codigoBarras = codigoBarras;
                produto.updatedAt = LocalDateTime.now();
                
                totalAtualizados++;
                
                if (totalAtualizados % 100 == 0) {
                    LOGGER.info("Processados " + totalAtualizados + " produtos...");
                }
            } catch (Exception e) {
                totalErros++;
                String erro = "Erro ao processar produto ID " + produto.id + ": " + e.getMessage();
                erros.add(erro);
                LOGGER.warning(erro);
            }
        }
        
        LOGGER.info("Geração de códigos de barras concluída. Total processados: " + totalProcessados + 
                   ", Atualizados: " + totalAtualizados + ", Erros: " + totalErros);
        
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("success", true);
        resultado.put("totalProcessados", totalProcessados);
        resultado.put("totalAtualizados", totalAtualizados);
        resultado.put("totalErros", totalErros);
        resultado.put("erros", erros);
        resultado.put("message", "Códigos de barras gerados com sucesso para " + totalAtualizados + " produtos");
        
        return resultado;
    }

    private String resolveCreatedBy() {
        if (internalUserContext.isAuthenticated()) {
            String email = internalUserContext.getEmail();
            if (email != null && !email.isBlank()) {
                return email.trim();
            }
            String nome = internalUserContext.getNome();
            if (nome != null && !nome.isBlank()) {
                return nome.trim();
            }
        }
        return "system";
    }

    private void assertUniqueProductPn(String pn, Integer excludeId) {
        if (pn == null || pn.isBlank()) {
            return;
        }
        String normalized = pn.trim();
        Product existing =
                excludeId != null
                        ? Product.find(
                                        "productpn = ?1 and isActive = true and id != ?2", normalized, excludeId)
                                .firstResult()
                        : Product.find("productpn = ?1 and isActive = true", normalized).firstResult();
        if (existing != null) {
            throw new BadRequestException(
                    ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_PN_DUPLICATE, "pn", normalized));
        }
    }

    private static java.time.LocalDate parseSearchDate(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return null;
        }
        String t = searchTerm.trim();
        try {
            if (t.contains("/")) {
                return java.time.LocalDate.parse(t, java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }
            if (t.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return java.time.LocalDate.parse(t);
            }
            if (t.matches("\\d{2}\\.\\d{2}\\.\\d{4}")) {
                return java.time.LocalDate.parse(t, java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy"));
            }
            if (t.matches("\\d{8}")) {
                return java.time.LocalDate.parse(t, java.time.format.DateTimeFormatter.ofPattern("ddMMyyyy"));
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }
}
