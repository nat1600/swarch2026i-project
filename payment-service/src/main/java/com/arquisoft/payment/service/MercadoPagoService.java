package com.arquisoft.payment.service;

import com.arquisoft.payment.config.MercadoPagoConfiguration;
import com.arquisoft.payment.dto.PaymentRequestDTO;
import com.arquisoft.payment.dto.PaymentResponseDTO;
import com.arquisoft.payment.model.Payment;
import com.arquisoft.payment.repository.PaymentRepository;
import com.mercadopago.client.preference.PreferenceBackUrlRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.resources.preference.Preference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class MercadoPagoService {

    private final PreferenceClient preferenceClient;
    private final PaymentRepository paymentRepository;
    private final MercadoPagoConfiguration mercadoPagoConfiguration;

    public MercadoPagoService(PaymentRepository paymentRepository,
                               MercadoPagoConfiguration mercadoPagoConfiguration) {
        this.preferenceClient = new PreferenceClient();
        this.paymentRepository = paymentRepository;
        this.mercadoPagoConfiguration = mercadoPagoConfiguration;
    }

    /**
     * Crea una preferencia de pago en MercadoPago
     * @param paymentRequest DTO con detalles del pago
     * @return PaymentResponseDTO con URL de checkout
     */
    public PaymentResponseDTO createPaymentPreference(PaymentRequestDTO paymentRequest) {
        try {
            log.info("Creando preferencia de pago para: {}", paymentRequest.getExternalReference());

            // Construir items
            List<PreferenceItemRequest> items = buildItems(paymentRequest.getItems());

            // Construir URLs de retorno
            PreferenceBackUrlRequest backUrls = PreferenceBackUrlRequest.builder()
                    .success(paymentRequest.getBackUrls().getSuccess())
                    .failure(paymentRequest.getBackUrls().getFailure())
                    .pending(paymentRequest.getBackUrls().getPending())
                    .build();

            // Construir preferencia
            PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                    .externalReference(paymentRequest.getExternalReference())
                    .items(items)
                    .payerEmail(paymentRequest.getPayerEmail())
                    .backUrls(backUrls)
                    .notificationUrl(paymentRequest.getNotificationUrl())
                    .statementDescriptor("ARQUISOFT PAYMENT")
                    .build();

            // Crear preferencia en MercadoPago
            Preference preference = preferenceClient.create(preferenceRequest);

            // Calcular total
            Double total = paymentRequest.getItems().stream()
                    .mapToDouble(item -> item.getQuantity() * item.getUnitPrice())
                    .sum();

            // Guardar en base de datos
            Payment payment = Payment.builder()
                    .preferenceId(preference.getId())
                    .externalReference(paymentRequest.getExternalReference())
                    .payerEmail(paymentRequest.getPayerEmail())
                    .totalAmount(total)
                    .status(Payment.PaymentStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();

            paymentRepository.save(payment);

            log.info("Preferencia creada exitosamente: {}", preference.getId());

            return PaymentResponseDTO.builder()
                    .preferenceId(preference.getId())
                    .initPoint(preference.getInitPoint())
                    .sandboxInitPoint(preference.getSandboxInitPoint())
                    .externalReference(paymentRequest.getExternalReference())
                    .status("CREATED")
                    .createdAt(LocalDateTime.now())
                    .total(total)
                    .message("Preferencia de pago creada exitosamente")
                    .build();

        } catch (Exception e) {
            log.error("Error al crear preferencia: {}", e.getMessage(), e);
            return PaymentResponseDTO.builder()
                    .status("ERROR")
                    .message("Error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Obtiene el estado de un pago
     * @param preferenceId ID de la preferencia
     * @return Payment con estado actual
     */
    public Payment getPaymentStatus(String preferenceId) {
        return paymentRepository.findByPreferenceId(preferenceId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado: " + preferenceId));
    }

    /**
     * Actualiza el estado de un pago
     * @param mercadopagoPaymentId ID del pago en MercadoPago
     * @param status Nuevo estado
     */
    public void updatePaymentStatus(String mercadopagoPaymentId, Payment.PaymentStatus status) {
        paymentRepository.findByMercadopagoPaymentId(mercadopagoPaymentId)
                .ifPresentOrElse(payment -> {
                    payment.setStatus(status);
                    payment.setUpdatedAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                    log.info("Pago {} actualizado a estado {}", mercadopagoPaymentId, status);
                }, () -> {
                    log.warn("Pago {} no encontrado para actualizar", mercadopagoPaymentId);
                });
    }

    /**
     * Construye lista de items desde DTO
     */
    private List<PreferenceItemRequest> buildItems(List<PaymentRequestDTO.PaymentItemDTO> itemDtos) {
        List<PreferenceItemRequest> items = new ArrayList<>();

        for (PaymentRequestDTO.PaymentItemDTO itemDto : itemDtos) {
            PreferenceItemRequest item = PreferenceItemRequest.builder()
                    .id(itemDto.getId())
                    .title(itemDto.getTitle())
                    .description(itemDto.getDescription())
                    .quantity(itemDto.getQuantity())
                    .unitPrice(new BigDecimal(itemDto.getUnitPrice()))
                    .currency(itemDto.getCurrency())
                    .build();
            items.add(item);
        }

        return items;
    }
}
