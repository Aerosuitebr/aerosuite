package com.aerosuite.service;

import com.aerosuite.domain.TicketEmailModo;
import com.aerosuite.domain.Usuario;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TicketNotificationPreferenceService {

    public String resolveModo(Long usuarioId) {
        if (usuarioId == null) {
            return TicketEmailModo.INSTANT;
        }
        Usuario u = Usuario.findById(usuarioId.intValue());
        if (u == null) {
            return TicketEmailModo.INSTANT;
        }
        return TicketEmailModo.normalize(u.notifTicketEmailModo);
    }

    public boolean isInstant(Long usuarioId) {
        return TicketEmailModo.INSTANT.equals(resolveModo(usuarioId));
    }

    public boolean isDigestDaily(Long usuarioId) {
        return TicketEmailModo.DIGEST_DAILY.equals(resolveModo(usuarioId));
    }

    public boolean isOff(Long usuarioId) {
        return TicketEmailModo.OFF.equals(resolveModo(usuarioId));
    }
}
