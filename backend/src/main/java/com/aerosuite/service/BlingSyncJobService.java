package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.BlingSyncJob;
import com.aerosuite.domain.BlingWebhookEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.aerosuite.integration.bling.BlingDeadJobsActionResultDto;
import com.aerosuite.integration.bling.BlingSyncJobViewDto;
import org.jboss.logging.Logger;

@ApplicationScoped
public class BlingSyncJobService {

    private static final Logger LOG = Logger.getLogger(BlingSyncJobService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static final String TYPE_WEBHOOK_EVENT = "WEBHOOK_EVENT";
    public static final String TYPE_IMPORT_CONTATO = "IMPORT_CONTATO";

    @Inject
    BlingSyncJobService self;

    @Transactional
    public BlingSyncJob enqueue(Long tenantId, String jobType, Map<String, Object> payload, Long sourceEventId) {
        try {
            BlingSyncJob job = new BlingSyncJob();
            job.tenantId = tenantId;
            job.jobType = jobType;
            job.payloadJson = MAPPER.writeValueAsString(payload != null ? payload : Map.of());
            job.status = BlingSyncJob.STATUS_PENDING;
            job.attempts = 0;
            job.maxAttempts = 5;
            job.nextRunAt = LocalDateTime.now();
            job.sourceEventId = sourceEventId;
            job.persist();
            return job;
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_ENQUEUE_JOB_FAILED, e.getMessage()), e);
        }
    }

    /** Processor corre fora de transação JTA para não reverter retry/markDone. */
    public int processPendingBatch(int limit, java.util.function.Consumer<BlingSyncJob> processor) {
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
        List<BlingSyncJob> jobs = (List<BlingSyncJob>) (List<?>) BlingSyncJob.find(
                        "status = ?1 and nextRunAt <= ?2 order by nextRunAt asc",
                        BlingSyncJob.STATUS_PENDING,
                        LocalDateTime.now())
                .page(0, limit)
                .list();
        return jobs.stream().map(job -> job.id).collect(Collectors.toList());
    }

    boolean processOneJob(Long jobId, java.util.function.Consumer<BlingSyncJob> processor) {
        BlingSyncJob snapshot = self.claimJob(jobId);
        if (snapshot == null) {
            return false;
        }
        try {
            processor.accept(snapshot);
            self.completeJob(jobId);
            return true;
        } catch (Exception e) {
            LOG.warnf(e, "Job Bling %d falhou (tentativa %d)", jobId, snapshot.attempts + 1);
            self.failJob(jobId, e.getMessage());
            return false;
        }
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    BlingSyncJob claimJob(Long jobId) {
        BlingSyncJob job = BlingSyncJob.findById(jobId);
        if (job == null || !BlingSyncJob.STATUS_PENDING.equals(job.status)) {
            return null;
        }
        if (job.nextRunAt != null && job.nextRunAt.isAfter(LocalDateTime.now())) {
            return null;
        }
        job.status = BlingSyncJob.STATUS_PROCESSING;
        job.persist();
        return job;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeJob(Long jobId) {
        BlingSyncJob job = BlingSyncJob.findById(jobId);
        if (job == null) {
            return;
        }
        job.status = BlingSyncJob.STATUS_DONE;
        job.processedAt = LocalDateTime.now();
        job.lastError = null;
        job.persist();
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void failJob(Long jobId, String error) {
        BlingSyncJob job = BlingSyncJob.findById(jobId);
        if (job == null) {
            return;
        }
        job.attempts = job.attempts + 1;
        job.lastError = truncate(error, 1000);
        job.status = BlingSyncJob.STATUS_PENDING;
        if (job.attempts >= job.maxAttempts) {
            job.status = BlingSyncJob.STATUS_DEAD;
            job.processedAt = LocalDateTime.now();
        } else {
            int delaySec = Math.min(300, 30 * (1 << Math.min(job.attempts, 4)));
            job.nextRunAt = LocalDateTime.now().plusSeconds(delaySec);
        }
        job.persist();
    }

    public Map<String, Long> countByStatusForTenant(long tenantId) {
        Map<String, Long> out = new HashMap<>();
        out.put("pending", BlingSyncJob.count("tenantId = ?1 and status = ?2", tenantId, BlingSyncJob.STATUS_PENDING));
        out.put("failed", BlingSyncJob.count("tenantId = ?1 and status = ?2", tenantId, BlingSyncJob.STATUS_FAILED));
        out.put("dead", BlingSyncJob.count("tenantId = ?1 and status = ?2", tenantId, BlingSyncJob.STATUS_DEAD));
        return out;
    }

    public List<BlingSyncJobViewDto> listDeadJobs(long tenantId) {
        @SuppressWarnings("unchecked")
        List<BlingSyncJob> jobs = (List<BlingSyncJob>) (List<?>) BlingSyncJob.find(
                        "tenantId = ?1 and status = ?2 order by processedAt desc, createdAt desc",
                        tenantId,
                        BlingSyncJob.STATUS_DEAD)
                .list();
        return jobs.stream().map(this::toViewDto).collect(Collectors.toList());
    }

    @Transactional
    public BlingDeadJobsActionResultDto reprocessDeadJob(long tenantId, long jobId) {
        BlingSyncJob job = findDeadJobForTenant(tenantId, jobId);
        job.status = BlingSyncJob.STATUS_PENDING;
        job.attempts = 0;
        job.nextRunAt = LocalDateTime.now();
        job.lastError = null;
        job.processedAt = null;
        job.persist();
        BlingDeadJobsActionResultDto dto = new BlingDeadJobsActionResultDto();
        dto.affected = 1;
        dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_REQUEUED);
        return dto;
    }

    @Transactional
    public BlingDeadJobsActionResultDto discardDeadJob(long tenantId, long jobId) {
        BlingSyncJob job = findDeadJobForTenant(tenantId, jobId);
        job.delete();
        BlingDeadJobsActionResultDto dto = new BlingDeadJobsActionResultDto();
        dto.affected = 1;
        dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_REMOVED);
        return dto;
    }

    @Transactional
    public BlingDeadJobsActionResultDto reprocessAllDeadJobs(long tenantId) {
        @SuppressWarnings("unchecked")
        List<BlingSyncJob> jobs = (List<BlingSyncJob>) (List<?>) BlingSyncJob.find(
                        "tenantId = ?1 and status = ?2", tenantId, BlingSyncJob.STATUS_DEAD)
                .list();
        for (BlingSyncJob job : jobs) {
            job.status = BlingSyncJob.STATUS_PENDING;
            job.attempts = 0;
            job.nextRunAt = LocalDateTime.now();
            job.lastError = null;
            job.processedAt = null;
            job.persist();
        }
        BlingDeadJobsActionResultDto dto = new BlingDeadJobsActionResultDto();
        dto.affected = jobs.size();
        dto.message = jobs.isEmpty()
                ? ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_NONE_DEAD)
                : ApiI18nMessages.encode(ApiI18nMessages.BLING_JOBS_REQUEUED);
        return dto;
    }

    @Transactional
    public BlingDeadJobsActionResultDto discardAllDeadJobs(long tenantId) {
        long deleted = BlingSyncJob.delete("tenantId = ?1 and status = ?2", tenantId, BlingSyncJob.STATUS_DEAD);
        BlingDeadJobsActionResultDto dto = new BlingDeadJobsActionResultDto();
        dto.affected = (int) Math.min(deleted, Integer.MAX_VALUE);
        dto.message = deleted == 0
                ? ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_NONE_DEAD_TO_REMOVE)
                : ApiI18nMessages.encode(ApiI18nMessages.BLING_JOBS_REMOVED);
        return dto;
    }

    private BlingSyncJob findDeadJobForTenant(long tenantId, long jobId) {
        BlingSyncJob job = BlingSyncJob.findById(jobId);
        if (job == null || job.tenantId == null || job.tenantId != tenantId || !BlingSyncJob.STATUS_DEAD.equals(job.status)) {
            throw new jakarta.ws.rs.NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.BLING_SYNC_JOB_NOT_FOUND));
        }
        return job;
    }

    private BlingSyncJobViewDto toViewDto(BlingSyncJob job) {
        BlingSyncJobViewDto dto = new BlingSyncJobViewDto();
        dto.id = job.id;
        dto.jobType = job.jobType;
        dto.status = job.status;
        dto.attempts = job.attempts != null ? job.attempts : 0;
        dto.maxAttempts = job.maxAttempts != null ? job.maxAttempts : 0;
        dto.lastError = job.lastError;
        dto.createdAt = job.createdAt != null ? job.createdAt.toString() : null;
        dto.processedAt = job.processedAt != null ? job.processedAt.toString() : null;
        if (job.sourceEventId != null) {
            BlingWebhookEvent event = BlingWebhookEvent.findById(job.sourceEventId);
            if (event != null) {
                dto.eventType = event.eventType;
                dto.resourceId = event.resourceId;
            }
        }
        return dto;
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
    }
}
