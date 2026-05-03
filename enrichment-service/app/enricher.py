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


async def on_message(message: aio_pika.IncomingMessage) -> None:

    async with message.process(requeue=True):
        try:
            data = json.loads(message.body)
            msg = EnrichmentMessage(**data)
            success = await enrich(msg)

            if not success:
                raise Exception(f"enrich() falló para phrase_id={msg.phrase_id}")

        except Exception as e:
            logger.error(f"Error procesando mensaje: {e}")
            raise


async def on_message(message: aio_pika.IncomingMessage) -> None:
    """
    Process a message from the queue.
    - If enrich() returns True → ACK (message processed, removed from the queue)
    - If enrich() returns False → NACK (message returned to the queue for retry)
    """
    
    async with message.process(requeue=False): 
        try:
            data = json.loads(message.body)
            msg = EnrichmentMessage(**data)
            success = await enrich(msg)
            if not success:
                logger.warning(f"enrich() falló para phrase_id={msg.phrase_id}, descartando mensaje")
        except Exception as e:
            logger.error(f"Error procesando mensaje: {e}")
            raise



async def main() -> None:
    logger.info("enrichemenet service starting...")


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
    settings = get_settings()
    try:
        asyncio.run(main())
    finally:
        asyncio.run(close_mongo())