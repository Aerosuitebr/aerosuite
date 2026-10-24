package com.aerosuite.dto.parts;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class PartsRfqResult {
    public Long id;
    public String number;
    public String status;
    public String title;
    public boolean aog;
    public String notes;
    public LocalDateTime createdAt;
    public List<Item> items;
    public Map<String, BigDecimal> totalsByCurrency;

    public static class Item extends PartsRfqRequest.Item {
        public Long id;
        public BigDecimal lineTotal;
    }
}
