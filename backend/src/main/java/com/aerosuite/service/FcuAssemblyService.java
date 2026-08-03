package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.FcuAssemblyDocEntity;
import com.aerosuite.dto.FcuAssemblyDoc;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

@ApplicationScoped
public class FcuAssemblyService {

    @Inject
    ObjectMapper mapper;

    @Transactional
    public Long save(FcuAssemblyDoc doc, Long id) {
        try {
            String json = mapper.writeValueAsString(doc);
            FcuAssemblyDocEntity ent;
            if (id != null) {
                ent = FcuAssemblyDocEntity.findById(id);
                if (ent == null) throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FCU_ASSEMBLY_NOT_FOUND, "id", String.valueOf(id)));
            } else {
                ent = new FcuAssemblyDocEntity();
            }
            ent.title = doc.title;
            ent.pn = doc.pn;
            ent.sn = doc.sn;
            ent.model = doc.model;
            ent.os = doc.os;
            ent.client = doc.client;
            ent.manual = doc.manual;
            ent.revision = doc.revision;
            ent.revisionDate = doc.revisionDate;
            ent.ata = doc.ata;
            ent.pages = doc.pages;
            ent.observations = doc.observations;
            ent.bodyJson = json;

            ent.persist();
            return ent.id;
        } catch (Exception e) {
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_ASSEMBLY_SAVE_FAILED, e.getMessage()), e);
        }
    }

    public FcuAssemblyDoc get(Long id) {
        try {
            FcuAssemblyDocEntity ent = FcuAssemblyDocEntity.findById(id);
            if (ent == null) throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FCU_ASSEMBLY_NOT_FOUND, "id", String.valueOf(id)));
            return mapper.readValue(ent.bodyJson, FcuAssemblyDoc.class);
        } catch (Exception e) {
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_ASSEMBLY_LOAD_FAILED, e.getMessage()), e);
        }
    }

    public List<FcuAssemblyDocEntity> list(int page, int size) {
        return FcuAssemblyDocEntity.findAll().page(Page.of(page, size)).list();
    }
}
