package com.aerosuite.parts;

import com.aerosuite.dto.parts.PartsFinderResult;
import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import com.aerosuite.domain.PartsSearch;
import com.aerosuite.domain.PartsRfq;
import com.aerosuite.domain.PartsRfqItem;
import com.aerosuite.dto.parts.PartsRfqRequest;
import com.aerosuite.dto.parts.PartsRfqResult;
import com.aerosuite.dto.parts.PartsRfqSendRequest;
import com.aerosuite.integration.evolution.EvolutionService;
import com.aerosuite.integration.evolution.dto.TenantWhatsAppConnectionViewDto;
import com.aerosuite.integration.evolution.dto.WhatsAppQrCodeDto;
import com.aerosuite.service.EmailService;
import com.aerosuite.util.HtmlToPdfConverter;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
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
import java.util.Base64;
import java.util.stream.StreamSupport;

@ApplicationScoped
public class PartsFinderService {
    @Inject Instance<PartsFinderConnector> connectors;
    @Inject TenantDataAccess tenantDataAccess;
    @Inject InternalUserContext internalUserContext;
    @Inject HtmlToPdfConverter pdfConverter;
    @Inject EmailService emailService;
    @Inject EvolutionService evolutionService;

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

    @Transactional
    public List<PartsRfqResult> listRfqs(String query) {
        String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return PartsRfq.<PartsRfq>find("order by createdAt desc").page(0, 100).list().stream()
                .map(rfq -> toRfqResult(rfq, PartsRfqItem.<PartsRfqItem>find("rfqId = ?1 order by lineNumber", rfq.id).list()))
                .filter(rfq -> needle.isBlank() || rfqMatches(rfq, needle))
                .toList();
    }

    @Transactional
    public PartsRfqResult getRfq(Long id) {
        PartsRfq rfq = PartsRfq.findById(id);
        if (rfq == null) throw new NotFoundException("RFQ not found");
        return toRfqResult(rfq, PartsRfqItem.<PartsRfqItem>find("rfqId = ?1 order by lineNumber", id).list());
    }

    public byte[] generateRfqPdf(Long id) {
        try { return pdfConverter.toPdf(rfqHtml(getRfq(id))); }
        catch (Exception error) { throw new IllegalStateException("Could not generate RFQ PDF", error); }
    }

    @Transactional
    public Map<String, Object> sendRfqEmail(Long id, PartsRfqSendRequest request) {
        if (request == null || request.destination == null || request.destination.isBlank()) throw new BadRequestException("Destination email is required");
        PartsRfqResult rfq = getRfq(id);
        byte[] pdf = generateRfqPdf(id);
        String subject = request.subject == null || request.subject.isBlank() ? rfq.number + " - " + rfq.title : request.subject;
        String message = request.message == null || request.message.isBlank() ? "Segue em anexo nossa solicitação de cotação." : request.message;
        boolean sent = emailService.sendEmail(request.destination.trim(), subject, "<p>" + HtmlToPdfConverter.escapeHtml(message) + "</p>", message, pdf, rfq.number + ".pdf");
        if (!sent) throw new IllegalStateException("Email delivery failed");
        markRfqSent(id);
        return Map.of("success", true, "channel", "EMAIL", "destination", request.destination);
    }

    @Transactional
    public Map<String, Object> sendRfqWhatsApp(Long id, PartsRfqSendRequest request) {
        if (request == null || request.destination == null || request.destination.replaceAll("\\D", "").length() < 10) throw new BadRequestException("Valid WhatsApp number is required");
        PartsRfqResult rfq = getRfq(id);
        String message = request.message == null || request.message.isBlank() ? "Solicitação de cotação " + rfq.number + " - " + rfq.title : request.message;
        try {
            evolutionService.sendMediaForTenant(tenantDataAccess.currentTenantId(), request.destination, message, null,
                    Base64.getEncoder().encodeToString(generateRfqPdf(id)), rfq.number + ".pdf", "application/pdf");
            markRfqSent(id);
            return Map.of("success", true, "channel", "WHATSAPP", "destination", request.destination, "disconnected", true);
        } finally {
            try { evolutionService.disconnect(); } catch (Exception ignored) { }
        }
    }

    public TenantWhatsAppConnectionViewDto whatsappStatus() { return evolutionService.getConnectionView(true); }
    public TenantWhatsAppConnectionViewDto activateWhatsapp() { return evolutionService.activateWhatsApp(); }
    public WhatsAppQrCodeDto whatsappQrCode() { return evolutionService.fetchQrCode(); }
    public void disconnectWhatsapp() { evolutionService.disconnect(); }

    private void markRfqSent(Long id) {
        PartsRfq rfq = PartsRfq.findById(id);
        if (rfq != null) { rfq.status = "SENT"; rfq.persist(); }
    }

    private boolean rfqMatches(PartsRfqResult rfq, String needle) {
        if ((rfq.number + " " + rfq.title + " " + rfq.status).toLowerCase(Locale.ROOT).contains(needle)) return true;
        return rfq.items.stream().anyMatch(item -> (String.valueOf(item.partNumber) + " " + String.valueOf(item.description) + " " + String.valueOf(item.supplier) + " " + String.valueOf(item.country)).toLowerCase(Locale.ROOT).contains(needle));
    }

    private String rfqHtml(PartsRfqResult rfq) {
        StringBuilder rows = new StringBuilder();
        for (PartsRfqResult.Item item : rfq.items) rows.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(item.partNumber)).append("</td><td>").append(HtmlToPdfConverter.escapeHtml(item.description)).append("</td><td>").append(HtmlToPdfConverter.escapeHtml(item.supplier)).append("</td><td>").append(item.quantity).append("</td><td>").append(item.currency == null ? "" : item.currency).append(" ").append(item.unitPrice == null ? "Sob consulta" : item.unitPrice).append("</td><td>").append(item.currency == null ? "" : item.currency).append(" ").append(item.lineTotal == null ? "Sob consulta" : item.lineTotal).append("</td></tr>");
        StringBuilder totals = new StringBuilder();
        rfq.totalsByCurrency.forEach((currency, total) -> totals.append("<div><b>Total ").append(currency).append(":</b> ").append(currency).append(" ").append(total).append("</div>"));
        return "<html><head><style>@page{margin:22mm}body{font-family:Arial;color:#17324d}h1{font-size:22px}small{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0f2d4a;color:white;padding:9px;font-size:10px;text-align:left}td{padding:9px;border-bottom:1px solid #dbe4ee;font-size:10px}.totals{text-align:right;margin-top:20px;font-size:14px}</style></head><body><small>AEROSUITE · REQUEST FOR QUOTATION</small><h1>" + HtmlToPdfConverter.escapeHtml(rfq.number) + "</h1><p>" + HtmlToPdfConverter.escapeHtml(rfq.title) + "</p><table><thead><tr><th>P/N</th><th>Descrição</th><th>Fornecedor</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead><tbody>" + rows + "</tbody></table><div class='totals'>" + totals + "</div><p><small>Valores sujeitos à confirmação, impostos e frete.</small></p></body></html>";
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
