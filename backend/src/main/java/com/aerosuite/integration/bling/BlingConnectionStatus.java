package com.aerosuite.integration.bling;

import com.aerosuite.i18n.ApiI18nMessages;

public class BlingConnectionStatus {
    public boolean enabled;
    public boolean configured;
    public boolean connected;
    public boolean oauthConfigured;
    public boolean ok;
    public String message;
    public Integer httpStatus;
    public String connectedAt;
    /** Diagnóstico por recurso (contatos, pedidos, NF-e, …). */
    public java.util.List<BlingScopeCheckDto> scopeChecks;

    public static BlingConnectionStatus disabled() {
        BlingConnectionStatus s = new BlingConnectionStatus();
        s.enabled = false;
        s.configured = false;
        s.connected = false;
        s.ok = false;
        s.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_INTEGRATION_DISABLED);
        return s;
    }

    public static BlingConnectionStatus notConfigured(boolean oauthConfigured) {
        BlingConnectionStatus s = new BlingConnectionStatus();
        s.enabled = true;
        s.configured = false;
        s.connected = false;
        s.oauthConfigured = oauthConfigured;
        s.ok = false;
        s.message = oauthConfigured
                ? ApiI18nMessages.encode(ApiI18nMessages.BLING_STATUS_NO_ACCOUNT)
                : ApiI18nMessages.encode(ApiI18nMessages.BLING_STATUS_OAUTH_NOT_CONFIGURED);
        return s;
    }
}
