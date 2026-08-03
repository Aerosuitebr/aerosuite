package com.aerosuite.integration.bling;

import java.util.List;

public class BlingContactPageDto {
    public List<BlingContactDto> items;
    public boolean enabled;
    public boolean configured;
    public String message;

    public BlingContactPageDto() {}

    public BlingContactPageDto(List<BlingContactDto> items) {
        this.items = items;
    }
}
