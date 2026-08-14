package com.aerosuite.parts;

import com.aerosuite.domain.ItemEstoque;
import com.aerosuite.dto.parts.PartsFinderResult;
import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class InternalInventoryPartsConnector implements PartsFinderConnector {
    @Inject TenantDataAccess tenantDataAccess;

    @Override
    public String source() { return "AEROSUITE_INTERNAL"; }

    @Override
    public List<PartsFinderResult> search(PartsFinderSearchRequest request) {
        String normalized = PartsFinderService.normalizePartNumber(request.partNumber);
        String tenantId = tenantDataAccess.currentTenantIdStr();
        List<ItemEstoque> items = ItemEstoque.<ItemEstoque>list(
                "tenantId = ?1 and isActive = true and status = ?2 order by updatedAt desc",
                tenantId, ItemEstoque.StatusItemEstoque.DISPONIVEL);
        return items.stream()
                .filter(item -> normalize(item.partNumber).equals(normalized))
                .filter(item -> request.quantity == null || item.quantidade == null
                        || item.quantidade.compareTo(request.quantity) >= 0)
                .map(this::toResult)
                .filter(result -> containsIgnoreCase(result.country, request.country))
                .filter(result -> containsIgnoreCase(result.certification, request.certification))
                .toList();
    }

    private PartsFinderResult toResult(ItemEstoque item) {
        PartsFinderResult result = new PartsFinderResult();
        result.inventoryItemId = item.id;
        result.partNumber = item.partNumber;
        result.description = item.descricao;
        result.condition = item.status == null ? null : item.status.name();
        result.quantity = item.quantidade;
        result.currency = item.valorUnitarioUsd != null ? "USD" : item.valorUnitarioBrl != null ? "BRL" : null;
        result.unitPrice = item.valorUnitarioUsd != null ? item.valorUnitarioUsd : item.valorUnitarioBrl;
        result.supplier = item.fornecedor == null ? null : item.fornecedor.razaoSocial;
        result.supplierEmail = item.fornecedor == null ? null : item.fornecedor.email;
        result.supplierAslStatus = item.fornecedor == null ? null : item.fornecedor.aslStatus;
        result.country = item.fornecedor == null ? null : item.fornecedor.paisOrigem;
        result.certification = item.certTipo != null ? item.certTipo : item.certificadoConformidade;
        result.source = source();
        result.location = item.localizacao;
        result.aogAvailable = item.quantidade != null && item.quantidade.signum() > 0;
        result.estimatedLeadTimeHours = result.aogAvailable ? 2 : null;
        result.lastUpdatedAt = item.updatedAt;
        return result;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
    }

    private static boolean containsIgnoreCase(String value, String filter) {
        return filter == null || filter.isBlank()
                || value != null && value.toUpperCase(Locale.ROOT).contains(filter.trim().toUpperCase(Locale.ROOT));
    }
}
