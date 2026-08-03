package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.ItemEstoqueDto;
import com.aerosuite.dto.ItemEstoquePublicPeekDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

import java.util.Locale;

@ApplicationScoped
public class EstoquePublicConsultaService {

    @Inject
    EstoqueService estoqueService;

    @Inject
    InternalUserContext internalUserContext;

    public ItemEstoquePublicPeekDto consultarPorCodigo(String tenantCodigo, String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new NotFoundException(ApiI18nMessages.encode("estoque.error.codigo_nao_informado"));
        }
        long tenantId = resolveTenantId(tenantCodigo);
        internalUserContext.setProvisioningTenant(tenantId);
        try {
            ItemEstoqueDto item = estoqueService.buscarItemPorCodigoRastreio(codigo.trim());
            return toPublicPeek(item);
        } finally {
            internalUserContext.clearProvisioningTenant();
        }
    }

    private static long resolveTenantId(String tenantCodigo) {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return TenantConstants.DEFAULT_TENANT_ID;
        }
        Tenant t = Tenant.find("codigo = ?1 and ativo = true", tenantCodigo.trim().toLowerCase(Locale.ROOT))
                .firstResult();
        if (t == null || t.id == null) {
            throw new NotFoundException(ApiI18nMessages.encode("estoque.error.organizacao_not_found"));
        }
        return t.id;
    }

    private static ItemEstoquePublicPeekDto toPublicPeek(ItemEstoqueDto item) {
        ItemEstoquePublicPeekDto dto = new ItemEstoquePublicPeekDto();
        dto.codigoRastreio = item.codigoRastreio;
        dto.partNumber = item.partNumber;
        dto.serialNumber = item.serialNumber;
        dto.descricao = item.descricao;
        dto.unidade = item.unidade;
        dto.status = item.status;
        dto.fornecedorNome = item.fornecedorNome;
        dto.fornecedorPais = item.fornecedorPais;
        dto.invoiceNumero = item.invoiceNumero;
        dto.loteCodigo = item.loteCodigo;
        dto.localizacao = item.localizacao;
        dto.prateleira = item.prateleira;
        dto.gaveta = item.gaveta;
        dto.certificadoConformidade = item.certificadoConformidade;
        dto.dataFabricacao = item.dataFabricacao;
        dto.dataValidade = item.dataValidade;
        dto.shelfLifeMeses = item.shelfLifeMeses;
        return dto;
    }
}
