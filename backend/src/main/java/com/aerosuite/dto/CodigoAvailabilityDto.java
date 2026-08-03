package com.aerosuite.dto;

public class CodigoAvailabilityDto {
    public String codigo;
    public boolean available;
    public String reason;
    public String suggestion;

    public CodigoAvailabilityDto() {}

    public CodigoAvailabilityDto(String codigo, boolean available, String reason, String suggestion) {
        this.codigo = codigo;
        this.available = available;
        this.reason = reason;
        this.suggestion = suggestion;
    }
}
