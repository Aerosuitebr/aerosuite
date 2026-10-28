package com.aerosuite.dto;

/** Metadados públicos do ambiente (banner no frontend, sem dados sensíveis). */
public class DeploymentInfoResponse {

    /** Nome exibido (ex.: Aero Suite PROD). */
    public String environmentName;

    /** production | homolog | staging | development | vazio */
    public String kind;

    public boolean showBanner;

    /** Commit Git incorporado ao artefato pela esteira de publicação. */
    public String commitSha;
}
