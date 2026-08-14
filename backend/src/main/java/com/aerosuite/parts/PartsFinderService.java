package com.aerosuite.parts;

import com.aerosuite.dto.parts.PartsFinderResult;
import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import com.aerosuite.domain.PartsSearch;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.transaction.Transactional;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
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
