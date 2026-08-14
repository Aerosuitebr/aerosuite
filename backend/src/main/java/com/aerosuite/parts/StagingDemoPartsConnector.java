package com.aerosuite.parts;

import com.aerosuite.dto.parts.PartsFinderResult;
import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/** Catálogo sintético exclusivo de homologação. Nunca representa disponibilidade comercial real. */
@ApplicationScoped
public class StagingDemoPartsConnector implements PartsFinderConnector {
    @ConfigProperty(name = "aero.suite.parts-finder.demo-enabled", defaultValue = "false")
    boolean enabled;

    @Override public String source() { return "STAGING_DEMO"; }

    @Override
    public List<PartsFinderResult> search(PartsFinderSearchRequest request) {
        if (!enabled) return List.of();
        String pn = request.partNumber.trim().toUpperCase(Locale.ROOT);
        return List.of(
                offer(pn, "FCU / componente aeronáutico", "OH", "8", "12450.00", "Demo Aviation USA", "US", "FAA 8130-3", "Miami, FL", "APROVADO"),
                offer(pn, "Componente aeronáutico intercambiável", "SV", "3", "10980.00", "Demo Global Rotables", "GB", "EASA Form 1", "London, UK", "PENDENTE"),
                offer(pn, "Peça aeronáutica rastreável", "NEW", "12", "15600.00", "Demo Aero Supply", "BR", "FAA 8130-3 / NFe", "São Paulo, BR", "APROVADO"),
                offer(pn, "Unidade revisada com documentação", "OH", "2", null, "Demo MRO Exchange", "CA", "TCCA Form One", "Toronto, CA", "PENDENTE")
        ).stream()
                .filter(r -> request.quantity == null || r.quantity.compareTo(request.quantity) >= 0)
                .filter(r -> matches(r.condition, request.condition))
                .filter(r -> matches(r.country, request.country))
                .filter(r -> matches(r.certification, request.certification))
                .toList();
    }

    private PartsFinderResult offer(String pn, String description, String condition, String quantity,
                                    String price, String supplier, String country, String certification,
                                    String location, String asl) {
        PartsFinderResult r = new PartsFinderResult();
        r.partNumber = pn; r.description = description; r.condition = condition;
        r.quantity = new BigDecimal(quantity); r.currency = "USD";
        r.unitPrice = price == null ? null : new BigDecimal(price);
        r.supplier = supplier; r.supplierEmail = "rfq@example.invalid"; r.supplierAslStatus = asl;
        r.country = country; r.certification = certification; r.location = location;
        r.source = source(); r.lastUpdatedAt = LocalDateTime.now();
        return r;
    }

    private boolean matches(String value, String filter) {
        return filter == null || filter.isBlank()
                || value != null && value.toUpperCase(Locale.ROOT).contains(filter.trim().toUpperCase(Locale.ROOT));
    }
}
