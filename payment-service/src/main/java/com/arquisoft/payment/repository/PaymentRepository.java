package com.arquisoft.payment.repository;

import com.arquisoft.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPreferenceId(String preferenceId);

    Optional<Payment> findByExternalReference(String externalReference);

    Optional<Payment> findByMercadopagoPaymentId(String mercadopagoPaymentId);
}
