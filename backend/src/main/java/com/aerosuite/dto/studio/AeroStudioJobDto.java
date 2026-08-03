package com.aerosuite.dto.studio;

import java.time.LocalDateTime;

public class AeroStudioJobDto {
    public Long id;
    public String templateId;
    public String status;
    public String fileName;
    public String mediaType;
    public boolean hasPreview;
    public String errorMessage;
    public LocalDateTime createdAt;
}
