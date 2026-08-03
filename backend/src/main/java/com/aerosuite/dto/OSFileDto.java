package com.aerosuite.dto;

import java.time.LocalDateTime;

public class OSFileDto {
    public Long id;
    public Long osId;
    public String fileName;
    public String originalName;
    public String filePath;
    public Long fileSize;
    public String contentType;
    public String fileExtension;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Boolean isActive;
    public Boolean isAvulso; // Indica se é um documento avulso (pasta diversos)
}

