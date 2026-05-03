# app/models.py
from pydantic import BaseModel

class EnrichmentMessage(BaseModel):
    """Message sent from core service via RabbitMQ"""
    phrase_id: int
    original_text: str
    word: str
    level: str = "B1"  # A1, A2, B1, B2, C1, C2

class EnrichedPhrase(BaseModel):
    """Document to be stored in MongoDB"""
    phrase_id: int
    sentence: str
    correct_answer: str
    distractors: list[str]
    level: str