package com.arquisoft.payment.controller;

import com.arquisoft.payment.dto.PaymentRequestDTO;
import com.arquisoft.payment.dto.PaymentResponseDTO;
import com.arquisoft.payment.model.Payment;
import com.arquisoft.payment.service.MercadoPagoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class PaymentController {

    private final MercadoPagoService mercadoPagoService;

    public PaymentController(MercadoPagoService mercadoPagoService) {
        this.mercadoPagoService = mercadoPagoService;
    }

    /**
     * Crear preferencia de pago
    * POST /create
     */
    @PostMapping("/create")
    public ResponseEntity<PaymentResponseDTO> createPayment(
            @RequestHeader(value = "X-User-Sub", required = false) String userSub,
            @RequestBody PaymentRequestDTO paymentRequest) {
        log.info("Solicitud de creación de pago: {}", paymentRequest.getExternalReference());

        if (userSub == null || userSub.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(PaymentResponseDTO.builder()
                    .status("ERROR")
                    .message("Missing X-User-Sub header")
                    .build());
        }

        try {
            PaymentResponseDTO response = mercadoPagoService.createPaymentPreference(paymentRequest, userSub);

            if ("ERROR".equals(response.getStatus())) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al crear pago: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PaymentResponseDTO.builder()
                            .status("ERROR")
                            .message("Error interno del servidor: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Obtener estado de un pago
    * GET /{preferenceId}
     */
    @GetMapping("/{preferenceId}")
    public ResponseEntity<Payment> getPaymentStatus(@PathVariable String preferenceId) {
        log.info("Consultando estado de pago: {}", preferenceId);

        try {
            Payment payment = mercadoPagoService.getPaymentStatus(preferenceId);
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            log.error("Pago no encontrado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error al obtener estado: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check
    * GET /health/check
     */
    @GetMapping("/health/check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Payment service is running");
    }
}
