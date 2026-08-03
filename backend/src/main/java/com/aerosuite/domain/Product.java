package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "product",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_product_tenant_codigo_barras",
                columnNames = {"tenant_id", "codigo_barras"}))
public class Product extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    public String description;
    public Integer invoice;
    @Column(length = 255)
    public String name;
    public BigDecimal price;
    public String productpn;
    public Integer quantity;
    public String status;
    public String local;
    
    // Novos campos adicionados
    @Column(name = "photo_url")
    public String photoUrl;
    
    @Column(name = "id_fabricante")
    public Integer idFabricante;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    public String createdBy;
    
    @Column(name = "is_active", nullable = false)
    public Boolean isActive = true; // Valor padrão true para novos registros
    
    @Column(name = "codigo_barras", length = 50)
    public String codigoBarras; // Código de barras EAN-13 ou Code128
    
    // Relacionamento com fabricante
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_fabricante", insertable = false, updatable = false)
    public Fabricante fabricante;
}
