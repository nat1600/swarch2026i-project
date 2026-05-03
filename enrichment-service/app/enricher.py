# app/enricher.py
import asyncio
import json
import logging
import aio_pika
from app.config import get_settings
from app.models import EnrichmentMessage
from app.consumer import enrich
from app.mongo_client import close as close_mongo

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

MAX_RETRIES = 3


async def on_message(message: aio_pika.IncomingMessage) -> None:
    """
    Process a message from the queue.
    - enrich() True  → ACK, mensaje eliminado de la cola
    - enrich() False → reintenta hasta MAX_RETRIES veces con backoff, luego descarta
    """
    headers = message.headers or {}
    retry_count = int(headers.get("x-retry-count", 0))

    async with message.process(requeue=False):
        try:
            data = json.loads(message.body)
            msg = EnrichmentMessage(**data)
            success = await enrich(msg)

            if not success:
                if retry_count < MAX_RETRIES:
                    wait = 2 ** retry_count  # 1s, 2s, 4s
                    logger.warning(
                        f"enrich() falló para phrase_id={msg.phrase_id}, "
                        f"reintento {retry_count + 1}/{MAX_RETRIES} en {wait}s"
                    )
                    await asyncio.sleep(wait)
                    settings = get_settings()
                    channel = message.channel
                    await channel.default_exchange.publish(
                        aio_pika.Message(
                            body=message.body,
                            headers={"x-retry-count": retry_count + 1},
                        ),
                        routing_key=settings.queue_name,
                    )
                else:
                    logger.error(
                        f"phrase_id={msg.phrase_id} falló {MAX_RETRIES} veces, descartando"
                    )

        except Exception as e:
            logger.error(f"Error procesando mensaje: {e}")
            raise


async def main() -> None:
    settings = get_settings()  # ← aquí, dentro de main
    logger.info("enrichment service starting...")

    while True:
        try:
            connection = await aio_pika.connect_robust(settings.rabbitmq_url)
            break
        except Exception as e:
            logger.warning(f"RabbitMQ no disponible, reintentando en 3s: {e}")
            await asyncio.sleep(3)

    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        queue = await channel.declare_queue(
            settings.queue_name,
            durable=True,
        )

        logger.info(f"Escuchando cola '{settings.queue_name}'...")
        await queue.consume(on_message)
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    finally:
        asyncio.run(close_mongo())