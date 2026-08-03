package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fcu_assembly_doc")
public class FcuAssemblyDocEntity extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "title", length = 255)
    public String title;

    @Column(name = "pn", length = 64)
    public String pn;

    @Column(name = "sn", length = 64)
    public String sn;

    @Column(name = "model", length = 64)
    public String model;

    @Column(name = "os_code", length = 64)
    public String os;

    @Column(name = "client", length = 128)
    public String client;

    @Column(name = "manual_ref", length = 128)
    public String manual;

    @Column(name = "revision", length = 32)
    public String revision;

    @Column(name = "revision_date", length = 64)
    public String revisionDate;

    @Column(name = "ata", length = 64)
    public String ata;

    @Column(name = "pages")
    public Integer pages;

    @Column(name = "observations", columnDefinition = "TEXT")
    public String observations;

    @Column(name = "body_json", columnDefinition = "JSON")
    public String bodyJson;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
