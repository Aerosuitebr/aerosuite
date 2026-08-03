package com.aerosuite.service;

import com.aerosuite.domain.WhatsAppMessageJob;
import com.aerosuite.i18n.ApiI18nMessages;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.jboss.logging.Logger;

@ApplicationScoped
public class WhatsAppMessageJobService {

    private static final Logger LOG = Logger.getLogger(WhatsAppMessageJobService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    WhatsAppMessageJobService self;

    @Transactional
    public WhatsAppMessageJob enqueue(Long tenantId, String jobType, Map<String, Object> payload) {
        try {
            WhatsAppMessageJob job = new WhatsAppMessageJob();
            job.tenantId = tenantId;
            job.jobType = jobType;
            job.payloadJson = MAPPER.writeValueAsString(payload != null ? payload : Map.of());
            job.status = WhatsAppMessageJob.STATUS_PENDING;
            job.attempts = 0;
            job.maxAttempts = 5;
            job.nextRunAt = LocalDateTime.now();
            job.persist();
            return job;
        } catch (Exception e) {
            throw new IllegalStateException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.EVOLUTION_ENQUEUE_FAILED, e.getMessage()), e);
        }
    }

    public int processPendingBatch(int limit, java.util.function.Consumer<WhatsAppMessageJob> processor) {
        List<Long> ids = self.listPendingJobIds(limit);
        int done = 0;
        for (Long id : ids) {
            if (processOneJob(id, processor)) {
                done++;
            }
        }
        return done;
    }

    @Transactional
    List<Long> listPendingJobIds(int limit) {
        @SuppressWarnings("unchecked")
        List<WhatsAppMessageJob> jobs = (List<WhatsAppMessageJob>) (List<?>) WhatsAppMessageJob.find(
                        "status = ?1 and nextRunAt <= ?2 order by nextRunAt asc",
                        WhatsAppMessageJob.STATUS_PENDING,
                        LocalDateTime.now())
                .page(0, limit)
                .list();
        return jobs.stream().map(j -> j.id).collect(Collectors.toList());
    }

    boolean processOneJob(Long jobId, java.util.function.Consumer<WhatsAppMessageJob> processor) {
        WhatsAppMessageJob snapshot = self.claimJob(jobId);
        if (snapshot == null) {
            return false;
        }
        try {
            processor.accept(snapshot);
            self.completeJob(jobId);
            return true;
        } catch (Exception e) {
            LOG.warnf(e, "Job WhatsApp %d falhou (tentativa %d)", jobId, snapshot.attempts + 1);
            self.failJob(jobId, e.getMessage());
            return false;
        }
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    WhatsAppMessageJob claimJob(Long jobId) {
        WhatsAppMessageJob job = WhatsAppMessageJob.findById(jobId);
        if (job == null || !WhatsAppMessageJob.STATUS_PENDING.equals(job.status)) {
            return null;
        }
        if (job.nextRunAt != null && job.nextRunAt.isAfter(LocalDateTime.now())) {
            return null;
        }
        job.status = WhatsAppMessageJob.STATUS_PROCESSING;
        job.persist();
        return job;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeJob(Long jobId) {
        WhatsAppMessageJob job = WhatsAppMessageJob.findById(jobId);
        if (job == null) {
            return;
        }
        job.status = WhatsAppMessageJob.STATUS_DONE;
        job.processedAt = LocalDateTime.now();
        job.lastError = null;
        job.persist();
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void failJob(Long jobId, String error) {
        WhatsAppMessageJob job = WhatsAppMessageJob.findById(jobId);
        if (job == null) {
            return;
        }
        job.attempts = job.attempts != null ? job.attempts + 1 : 1;
        job.lastError = error != null && error.length() > 1000 ? error.substring(0, 1000) : error;
        if (job.attempts >= job.maxAttempts) {
            job.status = WhatsAppMessageJob.STATUS_DEAD;
            job.processedAt = LocalDateTime.now();
        } else {
            job.status = WhatsAppMessageJob.STATUS_PENDING;
            long backoffMinutes = Math.min(60, (long) Math.pow(2, job.attempts));
            job.nextRunAt = LocalDateTime.now().plusMinutes(backoffMinutes);
        }
        job.persist();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parsePayload(WhatsAppMessageJob job) {
        try {
            if (job.payloadJson == null || job.payloadJson.isBlank()) {
                return new HashMap<>();
            }
            return MAPPER.readValue(job.payloadJson, Map.class);
        } catch (Exception e) {
            throw new IllegalStateException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.EVOLUTION_JOB_PAYLOAD_INVALID, e.getMessage()), e);
        }
    }
}
