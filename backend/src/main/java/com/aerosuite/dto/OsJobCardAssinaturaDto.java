package com.aerosuite.dto;

public class OsJobCardAssinaturaDto {
    public Long id;
    public String papel;
    public String assinadoEm;
    public String usuarioNome;
    public boolean presente;
    public String assinaturaSha256;
    public String assinaturaTimestampServer;
    /** true=hash OK, false=tamper, null=legado sem hash */
    public Boolean integridadeOk;
}
