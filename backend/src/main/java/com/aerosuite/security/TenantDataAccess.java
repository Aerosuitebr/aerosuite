package com.aerosuite.security;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OSFile;
import com.aerosuite.domain.TenantConstants;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

/**
 * Tenant do pedido autenticado (JWT {@code tid} + {@link InternalUserContext}).
 * Usar em serviços para filtrar dados por instância lógica.
 */
@ApplicationScoped
public class TenantDataAccess {

    @Inject
    InternalUserContext internalUserContext;

    public long currentTenantId() {
        Long t = internalUserContext.getTenantId();
        return t != null ? t : TenantConstants.DEFAULT_TENANT_ID;
    }

    public boolean matchesTenant(String entityTenantId) {
        return entityTenantId != null
                && entityTenantId.equals(TenantConstants.tenantIdOf(currentTenantId()));
    }

    public String currentTenantIdStr() {
        return TenantConstants.tenantIdOf(currentTenantId());
    }

    public OS requireOS(Long id) {
        if (id == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.OS_NOT_FOUND));
        }
        OS entity = OS.find("id = ?1", id).firstResult();
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.OS_NOT_FOUND_BY_ID, "id", String.valueOf(id)));
        }
        return entity;
    }

    public OS requireOSByIdOs(Integer idOs) {
        if (idOs == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.OS_NOT_FOUND));
        }
        OS entity = OS.find("idOs = ?1", idOs).firstResult();
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.OS_NOT_FOUND_BY_ID_OS, "idOs", String.valueOf(idOs)));
        }
        return entity;
    }

    /** Garante que o ficheiro pertence a uma OS do tenant atual. */
    public OSFile requireActiveOSFile(Long fileId) {
        if (fileId == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_NOT_FOUND_GENERIC));
        }
        OSFile file = OSFile.findById(fileId);
        if (file == null || (file.isActive != null && !file.isActive)) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_NOT_FOUND, "id", String.valueOf(fileId)));
        }
        // osId=0 representa um documento avulso. O @TenantId do próprio arquivo
        // já garante o isolamento; arquivos de OS também validam a OS vinculada.
        if (file.osId == null || file.osId != 0L) {
            requireOS(file.osId);
        }
        return file;
    }
}
