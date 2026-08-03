package com.aerosuite.dto;

import java.util.List;

public class AccessAuditPageDto {
    public List<AccessAuditEntryDto> items;
    public long total;

    public AccessAuditPageDto() {}

    public AccessAuditPageDto(List<AccessAuditEntryDto> items, long total) {
        this.items = items;
        this.total = total;
    }
}
