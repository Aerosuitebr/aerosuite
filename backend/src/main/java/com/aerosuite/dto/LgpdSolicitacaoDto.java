package com.aerosuite.dto;

import java.time.LocalDateTime;

public class LgpdSolicitacaoDto {
    public Long id;
    public String tipo;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime processedAt;
    public String resultArtifact;
    public String errorMessage;
    public boolean downloadAvailable;
}
