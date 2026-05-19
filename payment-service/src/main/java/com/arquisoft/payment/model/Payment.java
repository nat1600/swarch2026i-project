package com.arquisoft.payment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_sub", nullable = false)
    private String userSub;

    @Column(name = "plan_type", nullable = false)
    private String planType;

    @Column(nullable = false)
    private Integer amount;

    @Column(name = "currency_id", nullable = false, length = 8)
    private String currencyId;

    @Column(name = "preference_id", unique = true, length = 128)
    private String preferenceId;

    @Column(name = "external_reference", unique = true, nullable = false, length = 36)
    private String externalReference;

    @Column(nullable = false)
    private String payerEmail;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(name = "checkout_url", columnDefinition = "TEXT")
    private String checkoutUrl;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "mercadopago_payment_id", unique = true, length = 64)
    private String mercadopagoPaymentId;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @PrePersist
    protected void onCreate() {
        if (this.id == null || this.id.isBlank()) {
            this.id = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = PaymentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum PaymentStatus {
        PENDING,
        APPROVED,
        FAILED,
        CANCELLED,
        REFUNDED,
        IN_PROCESS,
        CHARGEBACK
    }
}
