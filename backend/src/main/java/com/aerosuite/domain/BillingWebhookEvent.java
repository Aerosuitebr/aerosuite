package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "billing_webhook_event")
@IdClass(BillingWebhookEvent.Key.class)
public class BillingWebhookEvent extends PanacheEntityBase {

    @Id
    @Column(name = "provider", length = 16)
    public String provider;

    @Id
    @Column(name = "event_id", length = 128)
    public String eventId;

    @Column(name = "event_type", length = 64)
    public String eventType;

    @Column(name = "processed_at")
    public LocalDateTime processedAt;

    public static boolean exists(String provider, String eventId) {
        return count("provider = ?1 and eventId = ?2", provider, eventId) > 0;
    }

    public static class Key implements Serializable {
        public String provider;
        public String eventId;

        public Key() {}

        public Key(String provider, String eventId) {
            this.provider = provider;
            this.eventId = eventId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof Key key)) {
                return false;
            }
            return Objects.equals(provider, key.provider) && Objects.equals(eventId, key.eventId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(provider, eventId);
        }
    }
}
