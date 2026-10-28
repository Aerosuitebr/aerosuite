package com.aerosuite.dto;

public class OsJobCardAssinaturaRequest {
    public Boolean substituir;
    public String assinaturaAnteriorSha256;
    /** EXECUCAO ou INSPECAO */
    public String papel;
    /** PNG em base64 (com ou sem prefixo data:image/png;base64,) */
    public String assinaturaPngBase64;
}
