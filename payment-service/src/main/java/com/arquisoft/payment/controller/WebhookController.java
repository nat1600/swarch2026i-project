package com.arquisoft.payment.controller;

import com.arquisoft.payment.config.MercadoPagoConfiguration;
import com.arquisoft.payment.dto.WebhookPayloadDTO;
import com.arquisoft.payment.model.Payment;
import com.arquisoft.payment.service.MercadoPagoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/webhook")
@Slf4j
public class WebhookController {

    private final MercadoPagoService mercadoPagoService;
    private final MercadoPagoConfiguration mercadoPagoConfiguration;

    public WebhookController(MercadoPagoService mercadoPagoService,
                              MercadoPagoConfiguration mercadoPagoConfiguration) {
        this.mercadoPagoService = mercadoPagoService;
        this.mercadoPagoConfiguration = mercadoPagoConfiguration;
    }

    /**
     * Webhook para notificaciones de MercadoPago (IPN)
     * POST /api/payments/webhook
     *
     * Documentación: https://developers.mercadopago.com/es/docs/checkout-api-reference#ipn-webhooks
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody WebhookPayloadDTO payload,
            @RequestHeader(value = "X-Hub-Signature", required = false) String signature) {

        log.info("Webhook recibido - Tipo: {}, Action: {}, DataId: {}",
                payload.getType(), payload.getAction(), payload.getData().getId());

        try {
            // Validar webhook token (opcional pero recomendado)
            if (signature != null && !validateSignature(signature)) {
                log.warn("Firma de webhook inválida");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Procesar según tipo de evento
            if ("payment".equals(payload.getType())) {
                handlePaymentNotification(payload);
            } else if ("plan".equals(payload.getType())) {
                log.info("Notificación de plan recibida: {}", payload.getAction());
            } else if ("subscription".equals(payload.getType())) {
                log.info("Notificación de suscripción recibida: {}", payload.getAction());
            }

            // Responder con 200 OK a MercadoPago
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Webhook procesado correctamente");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error al procesar webhook: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Procesa notificaciones de pago
     */
    private void handlePaymentNotification(WebhookPayloadDTO payload) {
        String paymentId = payload.getData().getId();
        String action = payload.getAction();

        log.info("Procesando notificación de pago - ID: {}, Action: {}", paymentId, action);

        Payment.PaymentStatus newStatus = mapMercadoPagoStatus(action);
        mercadoPagoService.updatePaymentStatus(paymentId, newStatus);

        // TODO: Enviar notificación a otros servicios (por ejemplo, core-service)
        // TODO: Registrar en logs/auditoría
    }

    /**
     * Mapea el estado de MercadoPago al enum local
     */
    private Payment.PaymentStatus mapMercadoPagoStatus(String mercadoPagoStatus) {
        return switch (mercadoPagoStatus) {
            case "approved" -> Payment.PaymentStatus.APPROVED;
            case "denied", "rejected" -> Payment.PaymentStatus.FAILED;
            case "pending" -> Payment.PaymentStatus.IN_PROCESS;
            case "cancelled" -> Payment.PaymentStatus.CANCELLED;
            case "refunded" -> Payment.PaymentStatus.REFUNDED;
            case "chargeback_notification" -> Payment.PaymentStatus.CHARGEBACK;
            default -> {
                log.warn("Estado desconocido de MercadoPago: {}", mercadoPagoStatus);
                yield Payment.PaymentStatus.IN_PROCESS;
            }
        };
    }

    /**
     * Valida la firma del webhook (opcional)
     * Para mayor seguridad, validar HMAC con el webhook token
     */
    private boolean validateSignature(String signature) {
        // TODO: Implementar validación de firma HMAC si es requerido
        // Por ahora, retornar true
        return true;
    }
}
