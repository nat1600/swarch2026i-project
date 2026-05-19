## Guía de Inicio Rápido - Payment Service

### Docker Compose (Recomendado)

El `docker-compose.yml` del proyecto automáticamente:
✅ Crea la base de datos `payment_db`
✅ Ejecuta migraciones (crea tablas)
✅ Inicia el servicio en puerto 8005

```bash
# Desde el directorio raíz del proyecto
cp payment-service/.env.example payment-service/.env
# Editar payment-service/.env con credenciales MercadoPago

docker-compose up -d payment-service

# Verificar que está corriendo
curl http://localhost:8005/api/payments/health/check
```

### Pasos para Obtener Credenciales de MercadoPago

1. **Crear cuenta en MercadoPago**:
   - Ir a [https://www.mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel)
   - Registrarse o iniciar sesión

2. **Obtener Access Token**:
   - En el panel, ir a **Credenciales** → **Producción** (o **Sandbox**)
   - Copiar el `Access Token`
   - Usarlo en `MERCADOPAGO_ACCESS_TOKEN`

3. **Configurar Webhook**:
   - En el panel, ir a **Webhooks**
   - Crear un nuevo webhook apuntando a: `http://tu-dominio.com/api/payments/webhook`
   - Copiar el `Webhook Token` para validaciones (opcional)

### Ejecutar en Desarrollo

```bash
# Compilar
mvn clean compile

# Ejecutar con Mavens Spring Boot plugin
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.additional-location=file:./.env.local"

# O ejecutar con JAR
mvn clean package
java -jar target/payment-service-1.0.0.jar --spring.config.additional-location=file:./.env.local
```

El servicio estará disponible en: **http://localhost:8005**

### Crear Base de Datos

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE payment_db;
GRANT ALL PRIVILEGES ON DATABASE payment_db TO postgres;

-- Spring Boot creará las tablas automáticamente al startup
```

### Probar Endpoints

Importar `postman-collection.json` en Postman y ejecutar:

1. **POST /api/payments/create** → Crear preferencia de pago
   - Respuesta incluirá `sandbox_init_point` (URL de checkout en sandbox)

2. **GET /api/payments/{preference_id}** → Ver estado del pago

3. **POST /api/payments/webhook** → Simular notificación de MercadoPago

### Flujo de Pago Típico

1. **Frontend** solicita crear pago → `POST /api/payments/create`
2. **Backend** retorna `sandbox_init_point` (URL de checkout)
3. **Usuario** hace clic en URL y se redirige a MercadoPago
4. **Usuario** completa el pago en MercadoPago
5. **MercadoPago** notifica a tu webhook → `POST /api/payments/webhook`
6. **Backend** actualiza estado del pago en BD
7. **MercadoPago** redirige a usuario a `back_urls.success` (o failure/pending)

### Modo Sandbox vs Producción

**Sandbox** (para pruebas):
- Access Token: `APP_USR-...` (credenciales sandbox)
- URL de checkout: `sandbox_init_point`
- No se cobran dinero real

**Producción** (dinero real):
- Access Token: `APP_USR-...` (credenciales producción)
- URL de checkout: `init_point`
- Se cobran transacciones reales

### Tarjetas de Prueba (Sandbox)

MercadoPago proporciona tarjetas de prueba:

| Tipo | Número | Vencimiento | CVV |
|------|--------|-------------|-----|
| VISA | 4111 1111 1111 1111 | 12/25 | 123 |
| Mastercard | 5555 5555 5555 4444 | 12/25 | 123 |
| AMEX | 3782 822463 10005 | 12/25 | 1234 |

**Nombre**: Cualquiera
**Email**: Cualquiera (requiere ser válido para cuotas)

Para pagos exitosos: Usar cualquier documento de identidad
Para pagos rechazados: Usar documento finalizando en número par (ej: 12345678)

### Referencia de APIs MercadoPago

- [Crear Preferencia](https://developers.mercadopago.com/es/docs/checkout-api-reference#preference)
- [Notificaciones IPN](https://developers.mercadopago.com/es/docs/checkout-api-reference#ipn-webhooks)
- [Status de Pagos](https://developers.mercadopago.com/es/docs/checkout-api-reference#payment-status)

### Troubleshooting

**Error: Access Token inválido**
- Verificar que `MERCADOPAGO_ACCESS_TOKEN` está configurada correctamente
- Confirmar que el token corresponde al seller correcto

**Error: Webhook no recibe notificaciones**
- Asegurar que la URL pública es accesible desde internet
- Si está en localhost, usar ngrok: `ngrok http 8005`
- Configurar webhook URL en panel MercadoPago: `http://xxx.ngrok.io/api/payments/webhook`

**Error: Base de datos no encontrada**
- Crear base de datos: `CREATE DATABASE payment_db;`
- Verificar credenciales en `application.properties`

