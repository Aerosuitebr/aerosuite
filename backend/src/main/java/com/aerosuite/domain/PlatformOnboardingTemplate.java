package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_onboarding_template")
public class PlatformOnboardingTemplate extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "code", nullable = false, length = 64, unique = true)
    public String code;

    @Column(name = "channel", nullable = false, length = 16)
    public String channel = "EMAIL";

    @Column(name = "name_label", nullable = false, length = 120)
    public String nameLabel;

    @Column(name = "subject_template", nullable = false, length = 500)
    public String subjectTemplate;

    @Column(name = "body_template", nullable = false, columnDefinition = "MEDIUMTEXT")
    public String bodyTemplate;

    @Column(name = "active", nullable = false)
    public Boolean active = true;

    @Column(name = "sort_order", nullable = false)
    public Integer sortOrder = 0;
}
