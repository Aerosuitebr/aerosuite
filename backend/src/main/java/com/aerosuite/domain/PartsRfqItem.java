package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "parts_rfq_item")
public class PartsRfqItem extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false, length = 64) public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
    @Column(name = "rfq_id", nullable = false) public Long rfqId;
    @Column(name = "inventory_item_id") public Long inventoryItemId;
    @Column(name = "line_number", nullable = false) public int lineNumber;
    @Column(name = "part_number", nullable = false, length = 100) public String partNumber;
    @Column(length = 500) public String description;
    @Column(name = "item_condition", length = 32) public String condition;
    @Column(nullable = false, precision = 15, scale = 3) public BigDecimal quantity;
    @Column(length = 3) public String currency;
    @Column(name = "unit_price", precision = 19, scale = 4) public BigDecimal unitPrice;
    @Column(name = "line_total", precision = 19, scale = 4) public BigDecimal lineTotal;
    @Column(length = 255) public String supplier;
    @Column(name = "supplier_email", length = 255) public String supplierEmail;
    @Column(length = 255) public String certification;
    @Column(length = 100) public String country;
    @Column(length = 60) public String source;
    @Column(name = "estimated_lead_time_hours") public Integer estimatedLeadTimeHours;
    @Column(name = "aog_available") public Boolean aogAvailable;
}
