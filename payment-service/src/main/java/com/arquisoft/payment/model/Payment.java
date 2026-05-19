package com.arquisoft.payment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String preferenceId;

    @Column(nullable = false)
    private String externalReference;

    @Column(nullable = false)
    private String payerEmail;

    @Column(nullable = false)
    private Double totalAmount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "mercadopago_payment_id")
    private String mercadopagoPaymentId;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @PrePersist
    protected void onCreate() {
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
        PENDING,      // Pendiente de confirmación
        APPROVED,     // Aprobado
        FAILED,       // Rechazado
        CANCELLED,    // Cancelado
        REFUNDED,     // Reembolsado
        IN_PROCESS,   // En proceso
        CHARGEBACK    // Contracargo
    }
}
