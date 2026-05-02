from pydantic import BaseModel
class EnrichmentMessage(BaseModel):
    """a mesage that is sent from core service via RabbitMQ"""
    phrase_id: int
    original_text: str
    word: str

class EnrichedPhrase(BaseModel):
    """document to be stores in Mongodb"""
    phrase_id: int
    sentence: str
    correct_answer: str
    distractors: list[str]


