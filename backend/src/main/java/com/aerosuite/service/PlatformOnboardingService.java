package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.TransactionalEmailMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.util.ServerUrlUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class PlatformOnboardingService {

    private static final List<String> DEFAULT_REQUIREMENTS = List.of(
            "IDENTITY_CONFIRMED",
            "ADMIN_CONTACT",
            "SUPPORT_EMAIL",
            "BILLING_CONTACT",
            "COMMERCIAL_TERMS",
            "TECHNICAL_KICKOFF",
            "CREDENTIALS_DELIVERED",
            "ACCESS_ENABLED");

    private static final Set<String> ALLOWED_STATUS = Set.of(
            "PENDING_INFO", "IN_PROGRESS", "READY", "COMPLETED", "ON_HOLD");

    @Inject
    ServerUrlUtil serverUrlUtil;

    @Inject
    TenantProvisioningService tenantProvisioningService;

    @Inject
    EmailService emailService;

    @Inject
    InternalUserContext internalUserContext;

    private static final SecureRandom TOKEN_RANDOM = new SecureRandom();

    @Transactional
    public PlatformOnboardingHubDto listHub() {
        tenantProvisioningService.requirePlatformOperator();
        List<Tenant> tenants = Tenant.listAll();
        PlatformOnboardingHubDto hub = new PlatformOnboardingHubDto();
        hub.total = tenants.size();
        for (Tenant tenant : tenants) {
            if (TenantConstants.DEFAULT_TENANT_ID == tenant.id) {
                continue;
            }
            PlatformTenantOnboarding row = ensureOnboardingRow(tenant);
            ensureRequirements(tenant.id);
            hub.items.add(toRowDto(tenant, row));
            switch (row.status) {
                case "IN_PROGRESS" -> hub.inProgress++;
                case "READY" -> hub.ready++;
                case "COMPLETED" -> hub.completed++;
                default -> hub.pendingInfo++;
            }
        }
        hub.items.sort(Comparator.comparing((PlatformOnboardingRowDto r) -> r.tenantNome, String.CASE_INSENSITIVE_ORDER));
        return hub;
    }

    public List<PlatformOnboardingTemplateDto> listTemplates() {
        tenantProvisioningService.requirePlatformOperator();
        return PlatformOnboardingTemplate.<PlatformOnboardingTemplate>list("active = true order by sortOrder")
                .stream()
                .map(this::toTemplateDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PlatformOnboardingDetailDto getDetail(long tenantId) {
        tenantProvisioningService.requirePlatformOperator();
        Tenant tenant = requireTenant(tenantId);
        PlatformTenantOnboarding onboarding = ensureOnboardingRow(tenant);
        ensureRequirements(tenantId);
        PlatformOnboardingDetailDto dto = new PlatformOnboardingDetailDto();
        dto.tenantId = tenant.id;
        dto.tenantCodigo = tenant.codigo;
        dto.tenantNome = tenant.nome;
        dto.tenantAtivo = Boolean.TRUE.equals(tenant.ativo);
        dto.status = onboarding.status;
        dto.primaryContactName = onboarding.primaryContactName;
        dto.primaryContactEmail = onboarding.primaryContactEmail;
        dto.primaryContactPhone = onboarding.primaryContactPhone;
        dto.notes = onboarding.notes;
        dto.publicFormUrl = buildPublicFormUrl(ensurePublicToken(onboarding));
        dto.publicSubmittedAt = onboarding.publicSubmittedAt;
        dto.legalName = onboarding.legalName;
        dto.legalDocument = onboarding.legalDocument;
        dto.adminEmail = onboarding.adminEmail;
        dto.supportEmail = onboarding.supportEmail;
        dto.billingContactName = onboarding.billingContactName;
        dto.billingContactEmail = onboarding.billingContactEmail;
        dto.updatedAt = onboarding.updatedAt;
        dto.requirements = PlatformOnboardingRequirement.listForTenant(tenantId).stream()
                .map(this::toRequirementDto)
                .collect(Collectors.toList());
        dto.messages = PlatformOnboardingMessage.listForTenant(tenantId, 50).stream()
                .map(this::toMessageDto)
                .collect(Collectors.toList());
        return dto;
    }

    @Transactional
    public PlatformOnboardingDetailDto updateOnboarding(long tenantId, PlatformOnboardingUpdateRequest request) {
        tenantProvisioningService.requirePlatformOperator();
        Tenant tenant = requireTenant(tenantId);
        PlatformTenantOnboarding onboarding = ensureOnboardingRow(tenant);
        if (request != null) {
            if (request.status != null && !request.status.isBlank()) {
                String status = request.status.trim().toUpperCase(Locale.ROOT);
                if (!ALLOWED_STATUS.contains(status)) {
                    throw new BadRequestException("Invalid onboarding status");
                }
                onboarding.status = status;
            }
            if (request.primaryContactName != null) {
                onboarding.primaryContactName = blankToNull(request.primaryContactName);
            }
            if (request.primaryContactEmail != null) {
                onboarding.primaryContactEmail = blankToNull(request.primaryContactEmail);
            }
            if (request.primaryContactPhone != null) {
                onboarding.primaryContactPhone = blankToNull(request.primaryContactPhone);
            }
            if (request.notes != null) {
                onboarding.notes = blankToNull(request.notes);
            }
        }
        onboarding.persist();
        return getDetail(tenantId);
    }

    @Transactional
    public PlatformOnboardingDetailDto updateRequirement(
            long tenantId, String requirementKey, PlatformOnboardingRequirementUpdateRequest request) {
        tenantProvisioningService.requirePlatformOperator();
        requireTenant(tenantId);
        ensureRequirements(tenantId);
        PlatformOnboardingRequirement req = PlatformOnboardingRequirement
                .find("tenantId = ?1 and requirementKey = ?2", tenantId, requirementKey)
                .firstResult();
        if (req == null) {
            throw new NotFoundException();
        }
        if (request != null) {
            if (request.fulfilled != null) {
                req.fulfilled = request.fulfilled;
                req.fulfilledAt = request.fulfilled ? LocalDateTime.now() : null;
            }
            if (request.operatorNotes != null) {
                req.operatorNotes = blankToNull(request.operatorNotes);
            }
        }
        req.persist();
        recomputeStatus(tenantId);
        return getDetail(tenantId);
    }

    @Transactional
    public PlatformOnboardingSendMessageResultDto sendMessage(
            long tenantId, PlatformOnboardingSendMessageRequest request) {
        tenantProvisioningService.requirePlatformOperator();
        Tenant tenant = requireTenant(tenantId);
        PlatformTenantOnboarding onboarding = ensureOnboardingRow(tenant);
        if (request == null) {
            throw new BadRequestException("request required");
        }
        String channel = !blank(request.channel)
                ? request.channel.trim().toUpperCase(Locale.ROOT)
                : "EMAIL";
        if ("WHATSAPP".equals(channel) && blank(request.recipientPhone)) {
            throw new BadRequestException("recipientPhone required for WhatsApp");
        }
        if ("EMAIL".equals(channel) && blank(request.recipientEmail)) {
            throw new BadRequestException("recipientEmail required for email");
        }
        String templateCode = blankToNull(request.templateCode);
        PlatformOnboardingTemplate template = null;
        if (templateCode != null) {
            template = PlatformOnboardingTemplate.find("code", templateCode).firstResult();
            if (template == null) {
                throw new BadRequestException("Unknown template");
            }
            channel = template.channel != null ? template.channel.toUpperCase(Locale.ROOT) : channel;
        }
        Map<String, String> vars = buildVars(tenant, onboarding, request);
        String subject = !blank(request.subjectOverride)
                ? request.subjectOverride.trim()
                : applyTemplate(template != null ? template.subjectTemplate : "Aero Suite — {{organizacaoNome}}", vars);
        String body = !blank(request.bodyOverride)
                ? OnboardingTemplateHeroUtil.expandForSend(request.bodyOverride.trim(), vars)
                : applyTemplate(
                        template != null
                                ? OnboardingTemplateHeroUtil.expandForSend(template.bodyTemplate, vars)
                                : "<p>{{contatoNome}}</p>",
                        vars);

        boolean sent = false;
        String deliveryStatus = "FAILED";
        String whatsappUrl = null;

        if ("WHATSAPP".equals(channel)) {
            String plainBody = htmlToPlain(body);
            whatsappUrl = buildWhatsAppUrl(request.recipientPhone.trim(), plainBody);
            sent = whatsappUrl != null;
            deliveryStatus = "LINK_READY";
        } else {
            try {
                emailService.sendBrandedHtmlDirect(
                        request.recipientEmail.trim(),
                        new TransactionalEmailMessages.EmailContent(subject, body));
                sent = true;
                deliveryStatus = "SENT";
            } catch (RuntimeException ex) {
                deliveryStatus = "FAILED";
            }
        }

        PlatformOnboardingMessage msg = new PlatformOnboardingMessage();
        msg.tenantId = tenantId;
        msg.templateCode = templateCode;
        msg.channel = channel;
        msg.recipientEmail = blankToNull(request.recipientEmail);
        msg.recipientPhone = blankToNull(request.recipientPhone);
        msg.recipientName = blankToNull(request.recipientName);
        msg.subject = subject;
        msg.bodyHtml = body;
        msg.deliveryStatus = deliveryStatus;
        msg.operatorEmail = internalUserContext.isAuthenticated() ? internalUserContext.getEmail() : null;
        msg.persist();

        if (sent && "PENDING_INFO".equals(onboarding.status)) {
            onboarding.status = "IN_PROGRESS";
            onboarding.persist();
        }

        PlatformOnboardingSendMessageResultDto result = new PlatformOnboardingSendMessageResultDto();
        result.sent = sent;
        result.message = deliveryStatus;
        result.whatsappUrl = whatsappUrl;
        result.record = toMessageDto(msg);
        return result;
    }

    @Transactional
    public PlatformOnboardingTemplateDto updateTemplate(
            String code, PlatformOnboardingTemplateUpdateRequest request) {
        tenantProvisioningService.requirePlatformOperator();
        if (blank(code)) {
            throw new BadRequestException("code required");
        }
        PlatformOnboardingTemplate template = PlatformOnboardingTemplate.find("code", code.trim()).firstResult();
        if (template == null) {
            throw new NotFoundException();
        }
        if (request != null) {
            if (!blank(request.nameLabel)) {
                template.nameLabel = request.nameLabel.trim();
            }
            if (request.subjectTemplate != null) {
                template.subjectTemplate = request.subjectTemplate;
            }
            if (request.bodyTemplate != null) {
                template.bodyTemplate = request.bodyTemplate;
            }
        }
        template.persist();
        return toTemplateDto(template);
    }

    public WelcomeEmailResponse resendWelcomeEmail(long tenantId, WelcomeEmailRequest request) {
        tenantProvisioningService.requirePlatformOperator();
        return tenantProvisioningService.resendWelcomeEmail(tenantId, request);
    }

    @Transactional
    public String getPublicFormUrlForTenant(long tenantId) {
        Tenant tenant = requireTenant(tenantId);
        PlatformTenantOnboarding onboarding = ensureOnboardingRow(tenant);
        return buildPublicFormUrl(ensurePublicToken(onboarding));
    }

    public PublicOnboardingFormDto getPublicForm(String token) {
        PlatformTenantOnboarding onboarding = requireOnboardingByToken(token);
        Tenant tenant = requireTenant(onboarding.tenantId);
        PublicOnboardingFormDto dto = new PublicOnboardingFormDto();
        dto.organizacaoNome = tenant.nome;
        dto.organizacaoCodigo = tenant.codigo;
        dto.alreadySubmitted = onboarding.publicSubmittedAt != null;
        dto.submittedAt = onboarding.publicSubmittedAt;
        dto.contactName = onboarding.primaryContactName;
        dto.contactEmail = onboarding.primaryContactEmail;
        dto.contactPhone = onboarding.primaryContactPhone;
        dto.legalName = onboarding.legalName;
        dto.legalDocument = onboarding.legalDocument;
        dto.adminEmail = onboarding.adminEmail;
        dto.supportEmail = onboarding.supportEmail;
        dto.billingContactName = onboarding.billingContactName;
        dto.billingContactEmail = onboarding.billingContactEmail;
        return dto;
    }

    @Transactional
    public void submitPublicForm(String token, PublicOnboardingSubmitRequest request) {
        if (request == null) {
            throw new BadRequestException("request required");
        }
        if (blank(request.contactName) || blank(request.contactEmail)) {
            throw new BadRequestException("contactName and contactEmail required");
        }
        PlatformTenantOnboarding onboarding = requireOnboardingByToken(token);
        Tenant tenant = requireTenant(onboarding.tenantId);

        onboarding.primaryContactName = request.contactName.trim();
        onboarding.primaryContactEmail = request.contactEmail.trim();
        onboarding.primaryContactPhone = blankToNull(request.contactPhone);
        onboarding.legalName = blankToNull(request.legalName);
        onboarding.legalDocument = blankToNull(request.legalDocument);
        onboarding.adminEmail = blankToNull(request.adminEmail);
        onboarding.supportEmail = blankToNull(request.supportEmail);
        onboarding.billingContactName = blankToNull(request.billingContactName);
        onboarding.billingContactEmail = blankToNull(request.billingContactEmail);
        onboarding.publicSubmittedAt = LocalDateTime.now();
        if ("PENDING_INFO".equals(onboarding.status)) {
            onboarding.status = "IN_PROGRESS";
        }
        onboarding.persist();

        ensureRequirements(tenant.id);
        fulfillIfPresent(tenant.id, "IDENTITY_CONFIRMED", onboarding.legalName);
        fulfillIfPresent(tenant.id, "ADMIN_CONTACT", onboarding.adminEmail);
        fulfillIfPresent(tenant.id, "SUPPORT_EMAIL", onboarding.supportEmail);
        fulfillIfPresent(tenant.id, "BILLING_CONTACT", onboarding.billingContactEmail);
        recomputeStatus(tenant.id);
    }

    private void fulfillIfPresent(long tenantId, String key, String value) {
        if (blank(value)) {
            return;
        }
        PlatformOnboardingRequirement req = PlatformOnboardingRequirement
                .find("tenantId = ?1 and requirementKey = ?2", tenantId, key)
                .firstResult();
        if (req != null && !Boolean.TRUE.equals(req.fulfilled)) {
            req.fulfilled = true;
            req.fulfilledAt = LocalDateTime.now();
            req.persist();
        }
    }

    private PlatformTenantOnboarding requireOnboardingByToken(String token) {
        PlatformTenantOnboarding onboarding = PlatformTenantOnboarding.findByPublicToken(token);
        if (onboarding == null) {
            throw new NotFoundException();
        }
        return onboarding;
    }

    private String ensurePublicToken(PlatformTenantOnboarding onboarding) {
        if (!blank(onboarding.publicToken)) {
            return onboarding.publicToken;
        }
        String token = generatePublicToken();
        onboarding.publicToken = token;
        onboarding.persist();
        return token;
    }

    private String generatePublicToken() {
        byte[] bytes = new byte[24];
        TOKEN_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String buildPublicFormUrl(String token) {
        String base = serverUrlUtil.getFrontendUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/onboarding/" + token;
    }

    private String buildWhatsAppUrl(String phone, String text) {
        String digits = phone.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return null;
        }
        String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8);
        return "https://wa.me/" + digits + "?text=" + encoded;
    }

    private static String htmlToPlain(String html) {
        if (html == null) {
            return "";
        }
        return html
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("(?i)</p>", "\n")
                .replaceAll("(?i)</li>", "\n")
                .replaceAll("<[^>]+>", "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .trim();
    }

    private void recomputeStatus(long tenantId) {
        PlatformTenantOnboarding onboarding = PlatformTenantOnboarding.findByTenant(tenantId);
        if (onboarding == null) {
            return;
        }
        List<PlatformOnboardingRequirement> reqs = PlatformOnboardingRequirement.listForTenant(tenantId);
        long fulfilled = reqs.stream().filter(r -> Boolean.TRUE.equals(r.fulfilled)).count();
        if (fulfilled == reqs.size() && !reqs.isEmpty()) {
            onboarding.status = "READY";
        } else if (fulfilled > 0) {
            onboarding.status = "IN_PROGRESS";
        }
        onboarding.persist();
    }

    private PlatformTenantOnboarding ensureOnboardingRow(Tenant tenant) {
        PlatformTenantOnboarding existing = PlatformTenantOnboarding.findByTenant(tenant.id);
        if (existing != null) {
            return existing;
        }
        PlatformTenantOnboarding row = new PlatformTenantOnboarding();
        row.tenantId = tenant.id;
        row.status = Boolean.TRUE.equals(tenant.ativo) ? "IN_PROGRESS" : "PENDING_INFO";
        row.publicToken = generatePublicToken();
        row.persist();
        return row;
    }

    private void ensureRequirements(long tenantId) {
        for (String key : DEFAULT_REQUIREMENTS) {
            PlatformOnboardingRequirement existing = PlatformOnboardingRequirement
                    .find("tenantId = ?1 and requirementKey = ?2", tenantId, key)
                    .firstResult();
            if (existing == null) {
                PlatformOnboardingRequirement req = new PlatformOnboardingRequirement();
                req.tenantId = tenantId;
                req.requirementKey = key;
                req.fulfilled = false;
                req.persist();
            }
        }
    }

    private Map<String, String> buildVars(
            Tenant tenant, PlatformTenantOnboarding onboarding, PlatformOnboardingSendMessageRequest request) {
        Map<String, String> vars = new HashMap<>();
        vars.put("organizacaoNome", tenant.nome != null ? tenant.nome : "");
        vars.put("organizacaoCodigo", tenant.codigo != null ? tenant.codigo : "");
        String contactName = !blank(request.recipientName)
                ? request.recipientName.trim()
                : (onboarding.primaryContactName != null ? onboarding.primaryContactName : "equipe");
        vars.put("contatoNome", contactName);
        vars.put("portalUrl", serverUrlUtil.getFrontendUrl());
        vars.put("onboardingFormUrl", buildPublicFormUrl(ensurePublicToken(onboarding)));
        String operatorName = internalUserContext.isAuthenticated() && internalUserContext.getEmail() != null
                ? internalUserContext.getEmail()
                : "Equipe Aero Suite";
        vars.put("operadorNome", operatorName);
        vars.put("operadorEmail", operatorName);
        return vars;
    }

    private String applyTemplate(String template, Map<String, String> vars) {
        String out = template != null ? template : "";
        for (Map.Entry<String, String> e : vars.entrySet()) {
            out = out.replace("{{" + e.getKey() + "}}", e.getValue() != null ? e.getValue() : "");
        }
        return out;
    }

    private PlatformOnboardingRowDto toRowDto(Tenant tenant, PlatformTenantOnboarding onboarding) {
        List<PlatformOnboardingRequirement> reqs = PlatformOnboardingRequirement.listForTenant(tenant.id);
        List<PlatformOnboardingMessage> msgs = PlatformOnboardingMessage.listForTenant(tenant.id, 1);
        PlatformOnboardingRowDto dto = new PlatformOnboardingRowDto();
        dto.tenantId = tenant.id;
        dto.tenantCodigo = tenant.codigo;
        dto.tenantNome = tenant.nome;
        dto.tenantAtivo = Boolean.TRUE.equals(tenant.ativo);
        dto.status = onboarding.status;
        dto.primaryContactName = onboarding.primaryContactName;
        dto.primaryContactEmail = onboarding.primaryContactEmail;
        dto.requirementsTotal = reqs.size();
        dto.requirementsFulfilled = (int) reqs.stream().filter(r -> Boolean.TRUE.equals(r.fulfilled)).count();
        dto.lastMessageAt = msgs.isEmpty() ? null : msgs.get(0).createdAt;
        dto.updatedAt = onboarding.updatedAt;
        return dto;
    }

    private PlatformOnboardingTemplateDto toTemplateDto(PlatformOnboardingTemplate t) {
        PlatformOnboardingTemplateDto dto = new PlatformOnboardingTemplateDto();
        dto.id = t.id;
        dto.code = t.code;
        dto.channel = t.channel;
        dto.nameLabel = t.nameLabel;
        dto.subjectTemplate = t.subjectTemplate;
        dto.bodyTemplate = t.bodyTemplate;
        return dto;
    }

    private PlatformOnboardingRequirementDto toRequirementDto(PlatformOnboardingRequirement r) {
        PlatformOnboardingRequirementDto dto = new PlatformOnboardingRequirementDto();
        dto.requirementKey = r.requirementKey;
        dto.fulfilled = Boolean.TRUE.equals(r.fulfilled);
        dto.fulfilledAt = r.fulfilledAt;
        dto.operatorNotes = r.operatorNotes;
        return dto;
    }

    private PlatformOnboardingMessageDto toMessageDto(PlatformOnboardingMessage m) {
        PlatformOnboardingMessageDto dto = new PlatformOnboardingMessageDto();
        dto.id = m.id;
        dto.templateCode = m.templateCode;
        dto.channel = m.channel;
        dto.recipientEmail = m.recipientEmail;
        dto.recipientPhone = m.recipientPhone;
        dto.recipientName = m.recipientName;
        dto.subject = m.subject;
        dto.deliveryStatus = m.deliveryStatus;
        dto.operatorEmail = m.operatorEmail;
        dto.createdAt = m.createdAt;
        return dto;
    }

    private Tenant requireTenant(long tenantId) {
        Tenant tenant = Tenant.findById(tenantId);
        if (tenant == null) {
            throw new NotFoundException();
        }
        return tenant;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static String blankToNull(String s) {
        return blank(s) ? null : s.trim();
    }
}
