package com.aerosuite.dto.studio;

public class AeroStudioJobStartedDto {
    public Long jobId;
    public String status;
    public boolean async;

    public AeroStudioJobStartedDto() {}

    public AeroStudioJobStartedDto(Long jobId, String status, boolean async) {
        this.jobId = jobId;
        this.status = status;
        this.async = async;
    }
}
