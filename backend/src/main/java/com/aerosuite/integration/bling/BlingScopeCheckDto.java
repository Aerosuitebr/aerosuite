package com.aerosuite.integration.bling;

/** Resultado de um probe HTTP contra um recurso da API Bling v3. */
public class BlingScopeCheckDto {
    public String resource;
    public String label;
    public boolean ok;
    public Integer httpStatus;
    public String message;
    /** Permissão esperada no cadastro do app Bling (aba Escopos). */
    public String blingAppPermission;
}
