# Payment Service 💳

Servicio de pagos robusto y escalable con integración a **MercadoPago** usando Spring Boot 3.x y Maven.

Parte del ecosistema de microservicios Arquisoft 2026.

## Características

✅ Integración completa con MercadoPago SDK  
✅ Creación de preferencias de pago (checkout)  
✅ Notificaciones en tiempo real (webhooks/IPN)  
✅ Persistencia en PostgreSQL con JPA  
✅ API REST con validación de entrada  
✅ Manejo de errores y logging  
✅ Docker ready  
✅ Postman collection incluida

## Estructura del Proyecto

```
payment-service/
├── src/
│   ├── main/
│   │   ├── java/com/arquisoft/payment/
│   │   │   ├── PaymentServiceApplication.java    # Clase principal
│   │   │   ├── config/
│   │   │   │   └── MercadoPagoConfiguration.java # Config SDK
│   │   │   ├── controller/
│   │   │   │   ├── PaymentController.java        # Endpoints de pago
│   │   │   │   └── WebhookController.java        # Webhook IPN
│   │   │   ├── service/
│   │   │   │   └── MercadoPagoService.java       # Lógica de negocio
│   │   │   ├── model/
│   │   │   │   └── Payment.java                  # Entidad JPA
│   │   │   ├── repository/
│   │   │   │   └── PaymentRepository.java        # Data access
│   │   │   └── dto/
│   │   │       ├── PaymentRequestDTO.java
│   │   │       ├── PaymentResponseDTO.java
│   │   │       └── WebhookPayloadDTO.java
│   │   └── resources/
│   │       ├── application.properties            # Config base
│   │       └── application-dev.properties        # Config desarrollo
│   └── test/
├── pom.xml                                        # Maven dependencies
├── Dockerfile                                     # Para containerización
├── postman-collection.json                        # Para pruebas API
├── QUICKSTART.md                                  # Inicio rápido
└── README.md                                      # Este archivo
```

## Requisitos

- **Java 17+** ([Descargar Eclipse Temurin](https://adoptium.net/))
- **Maven 3.9+** ([Descargar Maven](https://maven.apache.org/download.cgi))
- **PostgreSQL 12+** ([Descargar PostgreSQL](https://www.postgresql.org/download/)) O **Docker**
- **MercadoPago** Cuenta (obtener credenciales en [developers.mercadopago.com](https://www.mercadopago.com.ar/developers/panel))

## Instalación y Configuración

### Opción A: Con Docker Compose ⭐ (Recomendado)

El `docker-compose.yml` del proyecto automáticamente:
- ✅ Crea la base de datos `payment_db`
- ✅ Ejecuta migraciones (crea tablas con Hibernate)
- ✅ Inicia el servicio en puerto 8005

```bash
# Desde el directorio raíz del proyecto
cp payment-service/.env.example payment-service/.env
# Editar payment-service/.env con credenciales MercadoPago si es necesario

docker-compose up -d payment-service

# Verificar que está corriendo
curl http://localhost:8005/api/payments/health/check
```

### Opción B: Ejecución Local

**1. Configurar variables de entorno**
```bash
cd payment-service
cp .env.example .env.local
nano .env.local
```

**2. Crear base de datos**
```bash
psql -U postgres -c "CREATE DATABASE payment_db;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE payment_db TO postgres;"
```

**3. Ejecutar**
```bash
# Con Maven (compila automáticamente)
mvn spring-boot:run

# O empaquetar JAR
mvn clean package
java -jar target/payment-service-1.0.0.jar
```

El servicio estará disponible en: **http://localhost:8005**

**Nota:** Hibernate creará las tablas automáticamente gracias a `spring.jpa.hibernate.ddl-auto=update`

## Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/payments/create` | Crear preferencia de pago |
| GET | `/api/payments/{preferenceId}` | Obtener estado de pago |
| POST | `/api/payments/webhook` | Webhook de MercadoPago (IPN) |
| GET | `/api/payments/health/check` | Health check |

## Flujo de Pago

```
1. Cliente solicita crear pago → POST /api/payments/create
2. Backend retorna init_point (URL MercadoPago)
3. Cliente redirige a URL de checkout
4. Usuario completa pago en MercadoPago
5. MercadoPago notifica → POST /api/payments/webhook
6. Backend actualiza estado en BD
7. Usuario redirigido a back_url (success/failure/pending)
```

## Testing con Postman

Importar `postman-collection.json`:

```bash
# Opción 1: Manual
# Abrir Postman → Import → Seleccionar postman-collection.json

# Opción 2: CLI
postman-cli run postman-collection.json
```

## Docker

### Build de Imagen

```bash
docker build -t payment-service:1.0.0 .
```

### Ejecutar Contenedor

```bash
docker run -p 8005:8005 \
  -e MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx \
  -e MERCADOPAGO_WEBHOOK_TOKEN=xxx \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/payment_db \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=postgres \
  payment-service:1.0.0
```

### Con Docker Compose

```bash
# Desde el directorio raíz del proyecto
docker-compose up -d payment-service
```

## Configuración Detallada

Consultar [QUICKSTART.md](QUICKSTART.md) para:
- Setup detallado con credenciales MercadoPago
- Tarjetas de prueba (sandbox)
- Troubleshooting
- Validación de webhooks
- Configuración de producción

## Referencias

- **MercadoPago SDK Java**: https://developers.mercadopago.com/es/docs/sdks/java/
- **Preferencias de Pago**: https://developers.mercadopago.com/es/docs/checkout-api-reference#preference
- **Notificaciones IPN**: https://developers.mercadopago.com/es/docs/checkout-api-reference#ipn-webhooks
- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **Spring Data JPA**: https://spring.io/projects/spring-data-jpa

## Stack Tecnológico

- **Framework**: Spring Boot 3.2.5
- **Lenguaje**: Java 17
- **Build**: Maven 3.9
- **Base de Datos**: PostgreSQL 12+
- **ORM**: Spring Data JPA + Hibernate
- **Logging**: SLF4J + Logback
- **API Payment**: MercadoPago SDK
- **Containerización**: Docker

## Desarrollado por

Arquisoft Team - 2026

## Licencia

Arquisoft 2026
