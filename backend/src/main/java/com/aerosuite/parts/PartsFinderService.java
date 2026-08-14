package com.aerosuite.parts;

import com.aerosuite.dto.parts.PartsFinderResult;
import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.StreamSupport;

@ApplicationScoped
public class PartsFinderService {
    @Inject Instance<PartsFinderConnector> connectors;

    public List<PartsFinderResult> search(PartsFinderSearchRequest request) {
        if (request == null || normalizePartNumber(request.partNumber).isBlank()) {
            throw new BadRequestException("Part number is required");
        }
        if (request.quantity != null && request.quantity.signum() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
        return StreamSupport.stream(connectors.spliterator(), false)
                .flatMap(connector -> connector.search(request).stream())
                .sorted(Comparator.comparing((PartsFinderResult r) -> r.source)
                        .thenComparing(r -> r.supplier == null ? "" : r.supplier))
                .toList();
    }

    public static String normalizePartNumber(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
    }
}
