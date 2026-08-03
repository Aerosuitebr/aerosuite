package com.aerosuite.integration.bling;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.I18nMessageCodec;

import java.util.ArrayList;
import java.util.List;

/** Diagnóstico de permissões OAuth vs. endpoints usados pela Aero Suite. */
public class BlingScopesStatusDto {
    public boolean allOk;
    public String message;
    public List<BlingScopeCheckDto> checks = new ArrayList<>();
    public List<String> requiredBlingAppPermissions = BlingRequiredPermissions.panelChecklist();
    public String reconnectHint = I18nMessageCodec.encode(ApiI18nMessages.BLING_SCOPE_RECONNECT_HINT);
}
