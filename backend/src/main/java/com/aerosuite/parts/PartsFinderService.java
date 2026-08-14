package com.aerosuite.parts;

import com.aerosuite.dto.parts.PartsFinderResult;
import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import com.aerosuite.domain.PartsSearch;
import com.aerosuite.domain.PartsRfq;
import com.aerosuite.domain.PartsRfqItem;
import com.aerosuite.dto.parts.PartsRfqRequest;
import com.aerosuite.dto.parts.PartsRfqResult;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.StreamSupport;

@ApplicationScoped
public class PartsFinderService {
    @Inject Instance<PartsFinderConnector> connectors;
    @Inject TenantDataAccess tenantDataAccess;
    @Inject InternalUserContext internalUserContext;

    @Transactional
    public List<PartsFinderResult> search(PartsFinderSearchRequest request) {
        if (request == null || normalizePartNumber(request.partNumber).isBlank()) {
            throw new BadRequestException("Part number is required");
        }
        if (request.quantity != null && request.quantity.signum() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
        List<PartsFinderResult> results = StreamSupport.stream(connectors.spliterator(), false)
                .flatMap(connector -> connector.search(request).stream())
                .sorted(resultOrder(request.aog))
                .toList();
        recordSearch(request, results.size());
        return results;
    }

    static Comparator<PartsFinderResult> resultOrder(boolean aog) {
        Comparator<PartsFinderResult> order = aog
                ? Comparator.comparing((PartsFinderResult r) -> !Boolean.TRUE.equals(r.aogAvailable))
                    .thenComparing(r -> r.estimatedLeadTimeHours == null ? Integer.MAX_VALUE : r.estimatedLeadTimeHours)
                    .thenComparing(r -> r.source)
                : Comparator.comparing((PartsFinderResult r) -> r.source);
        return order.thenComparing(r -> r.supplier == null ? "" : r.supplier);
    }

    @Transactional
    public PartsRfqResult createRfq(PartsRfqRequest request) {
        if (request == null || request.items == null || request.items.isEmpty()) {
            throw new BadRequestException("At least one RFQ item is required");
        }
        PartsRfq rfq = new PartsRfq();
        rfq.tenantId = tenantDataAccess.currentTenantIdStr();
        rfq.userId = internalUserContext.getUserId() == null ? null : internalUserContext.getUserId().longValue();
        rfq.number = "RFQ-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        rfq.title = request.title == null || request.title.isBlank() ? "Cotação de peças" : request.title.trim();
        rfq.aog = request.aog;
        rfq.notes = request.notes;
        rfq.persistAndFlush();

        int lineNumber = 1;
        for (PartsRfqRequest.Item input : request.items) {
            validateRfqItem(input);
            PartsRfqItem item = new PartsRfqItem();
            item.tenantId = rfq.tenantId; item.rfqId = rfq.id; item.lineNumber = lineNumber++;
            item.inventoryItemId = input.inventoryItemId; item.partNumber = input.partNumber.trim();
            item.description = input.description; item.condition = input.condition; item.quantity = input.quantity;
            item.currency = input.currency == null ? null : input.currency.toUpperCase(Locale.ROOT);
            item.unitPrice = input.unitPrice;
            item.lineTotal = input.unitPrice == null ? null : input.unitPrice.multiply(input.quantity).setScale(4, RoundingMode.HALF_UP);
            item.supplier = input.supplier; item.supplierEmail = input.supplierEmail; item.certification = input.certification;
            item.country = input.country; item.source = input.source; item.estimatedLeadTimeHours = input.estimatedLeadTimeHours;
            item.aogAvailable = input.aogAvailable;
            item.persist();
        }
        return toRfqResult(rfq, PartsRfqItem.<PartsRfqItem>find("rfqId = ?1 order by lineNumber", rfq.id).list());
    }

    private void validateRfqItem(PartsRfqRequest.Item item) {
        if (item == null || item.partNumber == null || item.partNumber.isBlank()) throw new BadRequestException("Part number is required for every RFQ item");
        if (item.quantity == null || item.quantity.signum() <= 0) throw new BadRequestException("RFQ item quantity must be greater than zero");
        if (item.unitPrice != null && item.unitPrice.signum() < 0) throw new BadRequestException("RFQ item unit price cannot be negative");
    }

    private PartsRfqResult toRfqResult(PartsRfq rfq, List<PartsRfqItem> entities) {
        PartsRfqResult result = new PartsRfqResult();
        result.id = rfq.id; result.number = rfq.number; result.status = rfq.status; result.title = rfq.title;
        result.aog = rfq.aog; result.notes = rfq.notes; result.createdAt = rfq.createdAt;
        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        result.items = entities.stream().map(entity -> {
            PartsRfqResult.Item item = new PartsRfqResult.Item();
            item.id = entity.id; item.inventoryItemId = entity.inventoryItemId; item.partNumber = entity.partNumber;
            item.description = entity.description; item.condition = entity.condition; item.quantity = entity.quantity;
            item.currency = entity.currency; item.unitPrice = entity.unitPrice; item.lineTotal = entity.lineTotal;
            item.supplier = entity.supplier; item.supplierEmail = entity.supplierEmail; item.certification = entity.certification;
            item.country = entity.country; item.source = entity.source; item.estimatedLeadTimeHours = entity.estimatedLeadTimeHours;
            item.aogAvailable = entity.aogAvailable;
            if (entity.currency != null && entity.lineTotal != null) totals.merge(entity.currency, entity.lineTotal, BigDecimal::add);
            return item;
        }).toList();
        result.totalsByCurrency = totals;
        return result;
    }

    private void recordSearch(PartsFinderSearchRequest request, int resultCount) {
        PartsSearch search = new PartsSearch();
        search.tenantId = tenantDataAccess.currentTenantIdStr();
        search.userId = internalUserContext.getUserId() == null ? null : internalUserContext.getUserId().longValue();
        search.partNumber = request.partNumber.trim();
        search.normalizedPartNumber = normalizePartNumber(request.partNumber);
        search.requestedQuantity = request.quantity;
        search.requestedCondition = request.condition;
        search.requestedCountry = request.country;
        search.requestedCertification = request.certification;
        search.aog = request.aog;
        search.resultCount = resultCount;
        search.persist();
    }

    public static String normalizePartNumber(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
    }
}
