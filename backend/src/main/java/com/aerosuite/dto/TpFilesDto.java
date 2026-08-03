package com.aerosuite.dto;

import java.time.LocalDateTime;

public class TpFilesDto {
    
    public Long id;
    public String fileName;
    public String originalName;
    public String filePath;
    public Long fileSize;
    public String contentType;
    public String fileExtension;
    public String description;
    public Integer tipoServicoId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public String createdBy;
    public Boolean isActive;
    
    // Informações do tipo de serviço relacionado
    public String tipoServicoNome;
    
    // Construtor padrão
    public TpFilesDto() {}
    
    // Construtor com parâmetros
    public TpFilesDto(Long id, String fileName, String originalName, String filePath, 
                     Long fileSize, String contentType, String fileExtension, 
                     String description, Integer tipoServicoId, LocalDateTime createdAt, 
                     LocalDateTime updatedAt, String createdBy, Boolean isActive) {
        this.id = id;
        this.fileName = fileName;
        this.originalName = originalName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.fileExtension = fileExtension;
        this.description = description;
        this.tipoServicoId = tipoServicoId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
        this.isActive = isActive;
    }
}
