package com.arquisoft.payment.service;

import com.arquisoft.payment.dto.PaymentRequestDTO;
import com.arquisoft.payment.dto.PaymentResponseDTO;
import com.arquisoft.payment.model.Payment;
import com.arquisoft.payment.repository.PaymentRepository;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferencePayerRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.resources.preference.Preference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class MercadoPagoService {

    private final PreferenceClient preferenceClient;
    private final PaymentRepository paymentRepository;

    public MercadoPagoService(PaymentRepository paymentRepository) {
        this.preferenceClient = new PreferenceClient();
        this.paymentRepository = paymentRepository;
    }

    /**
     * Crea una preferencia de pago en MercadoPago
     * @param paymentRequest DTO con detalles del pago
     * @return PaymentResponseDTO con URL de checkout
     */
    public PaymentResponseDTO createPaymentPreference(PaymentRequestDTO paymentRequest) {
        return createPaymentPreference(paymentRequest, null);
    }

    public PaymentResponseDTO createPaymentPreference(PaymentRequestDTO paymentRequest, String userSub) {
        try {
            log.info("Creando preferencia de pago para: {}", paymentRequest.getExternalReference());

            if (userSub == null || userSub.isBlank()) {
                return PaymentResponseDTO.builder()
                        .status("ERROR")
                        .message("Missing user subject")
                        .build();
            }

            if (paymentRequest.getItems() == null || paymentRequest.getItems().isEmpty()) {
                return PaymentResponseDTO.builder()
                        .status("ERROR")
                        .message("Payment items are required")
                        .build();
            }

            // Construir items
            List<PreferenceItemRequest> items = buildItems(paymentRequest.getItems());
            PaymentRequestDTO.PaymentItemDTO primaryItem = paymentRequest.getItems().get(0);
            String normalizedExternalReference = normalizeExternalReference(paymentRequest.getExternalReference());

            // Si ya existe un pago con esta externalReference, devolverlo en lugar de intentar insertar de nuevo
            Optional<Payment> existing = paymentRepository.findByExternalReference(normalizedExternalReference);
            if (existing.isPresent()) {
                Payment p = existing.get();
                log.info("External reference ya existe, devolviendo preferencia existente: {}", p.getPreferenceId());
                return PaymentResponseDTO.builder()
                        .preferenceId(p.getPreferenceId())
                        .initPoint(p.getCheckoutUrl())
                        .sandboxInitPoint(null)
                        .externalReference(normalizedExternalReference)
                        .status(p.getStatus() != null ? p.getStatus().name() : "PENDING")
                        .createdAt(p.getCreatedAt() != null ? p.getCreatedAt() : LocalDateTime.now())
                        .total(p.getTotalAmount())
                        .message("Existing payment returned")
                        .build();
            }
            Double total = paymentRequest.getItems().stream()
                    .mapToDouble(item -> item.getQuantity() * item.getUnitPrice())
                    .sum();
            Integer amount = (int) Math.round(total * 100);
            String currencyId = primaryItem.getCurrency() != null ? primaryItem.getCurrency() : "USD";
            String planType = primaryItem.getId() != null && !primaryItem.getId().isBlank()
                    ? primaryItem.getId()
                    : "vip-plan";

            // Construir URLs de retorno
                PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success(paymentRequest.getBackUrls().getSuccess())
                    .failure(paymentRequest.getBackUrls().getFailure())
                    .pending(paymentRequest.getBackUrls().getPending())
                    .build();

            // Construir preferencia
            PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                    .externalReference(normalizedExternalReference)
                    .items(items)
                    .payer(PreferencePayerRequest.builder()
                        .email(paymentRequest.getPayerEmail())
                        .build())
                    .backUrls(backUrls)
                    .notificationUrl(paymentRequest.getNotificationUrl())
                    .statementDescriptor("PARLA VIP")
                    .build();

            // Crear preferencia en MercadoPago
            Preference preference = preferenceClient.create(preferenceRequest);

            // Guardar en base de datos
            Payment payment = Payment.builder()
                    .userSub(userSub)
                    .planType(planType)
                    .amount(amount)
                    .currencyId(currencyId)
                    .preferenceId(preference.getId())
                    .externalReference(normalizedExternalReference)
                    .payerEmail(paymentRequest.getPayerEmail())
                    .totalAmount(total)
                    .status(Payment.PaymentStatus.PENDING)
                    .checkoutUrl(preference.getInitPoint())
                    .build();

            paymentRepository.save(payment);

            log.info("Preferencia creada exitosamente: {}", preference.getId());

            return PaymentResponseDTO.builder()
                    .preferenceId(preference.getId())
                    .initPoint(preference.getInitPoint())
                    .sandboxInitPoint(preference.getSandboxInitPoint())
                    .externalReference(normalizedExternalReference)
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
                    .currencyId(itemDto.getCurrency())
                    .build();
            items.add(item);
        }

        return items;
    }

    private String normalizeExternalReference(String externalReference) {
        if (externalReference == null || externalReference.isBlank()) {
            return UUID.randomUUID().toString();
        }

        // If the provided external reference fits the DB column, keep it.
        if (externalReference.length() <= 36) {
            return externalReference;
        }

        // Avoid truncation collisions: derive a deterministic UUID from the full string.
        return UUID.nameUUIDFromBytes(externalReference.getBytes()).toString();
    }
}
