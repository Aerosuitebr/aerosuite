package com.aerosuite.dto;

import java.util.List;

public class PlatformBillingListDto {
    public List<PlatformBillingRowDto> items;
    public PlatformBillingSummaryDto summary;

    public PlatformBillingListDto() {}

    public PlatformBillingListDto(List<PlatformBillingRowDto> items, PlatformBillingSummaryDto summary) {
        this.items = items;
        this.summary = summary;
    }
}
