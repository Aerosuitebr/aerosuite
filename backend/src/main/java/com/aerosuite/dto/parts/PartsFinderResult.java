package com.aerosuite.dto.parts;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PartsFinderResult {
    public Long inventoryItemId;
    public String partNumber;
    public String description;
    public String condition;
    public BigDecimal quantity;
    public String currency;
    public BigDecimal unitPrice;
    public String supplier;
    public String supplierEmail;
    public String supplierAslStatus;
    public String country;
    public String certification;
    public String source;
    public String location;
    public Boolean aogAvailable;
    public Integer estimatedLeadTimeHours;
    public LocalDateTime lastUpdatedAt;
}
