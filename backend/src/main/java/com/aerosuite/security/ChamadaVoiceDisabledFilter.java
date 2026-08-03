package com.aerosuite.security;

import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Bloqueia API de chamadas de voz do chat quando desligada (chat só texto).
 */
@Provider
@Priority(Priorities.AUTHORIZATION + 20)
public class ChamadaVoiceDisabledFilter implements ContainerRequestFilter {

    @ConfigProperty(name = "aero.suite.chat.voice-calls-enabled", defaultValue = "false")
    boolean voiceCallsEnabled;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if (voiceCallsEnabled) {
            return;
        }
        String path = requestContext.getUriInfo().getPath();
        if (path != null && path.contains("/chamadas")) {
            requestContext.abortWith(
                    Response.status(Response.Status.NOT_FOUND)
                            .entity("{\"message\":\"" + ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_VOICE_DISABLED) + "\"}")
                            .type("application/json")
                            .build());
        }
    }
}
