package com.aerosuite.dto.parts;

import java.math.BigDecimal;
import java.util.List;

public class PartsRfqRequest {
    public String title;
    public boolean aog;
    public String notes;
    public List<Item> items;

    public static class Item {
        public Long inventoryItemId;
        public String partNumber;
        public String description;
        public String condition;
        public BigDecimal quantity;
        public String currency;
        public BigDecimal unitPrice;
        public String supplier;
        public String supplierEmail;
        public String certification;
        public String country;
        public String source;
        public Integer estimatedLeadTimeHours;
        public Boolean aogAvailable;
    }
}
