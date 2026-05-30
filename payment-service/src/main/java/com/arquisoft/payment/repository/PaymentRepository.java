package com.arquisoft.payment.repository;

import com.arquisoft.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByPreferenceId(String preferenceId);

    Optional<Payment> findByExternalReference(String externalReference);

    Optional<Payment> findByMercadopagoPaymentId(String mercadopagoPaymentId);

    Optional<Payment> findFirstByUserSubAndStatusIn(String userSub, List<Payment.PaymentStatus> statuses);

    List<Payment> findByStatusInAndCreatedAtBefore(List<Payment.PaymentStatus> statuses, LocalDateTime cutoff);
}
