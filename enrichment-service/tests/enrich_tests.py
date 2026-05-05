import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Test to consume enrichment messages (async, with mocks

from app.consumer import get_content_words


class TestGetContentWords:
    """get_content_words filtra stop-words y devuelve palabras únicas en minúsculas."""

    def test_elimina_stop_words_en_ingles(self):
        result = get_content_words("The cat sat on the mat", "english")
        assert "the" not in result
        assert "on" not in result
        assert "cat" in result
        assert "sat" in result
        assert "mat" in result

    def test_sin_duplicados(self):
        result = get_content_words("cat cat cat", "english")
        assert result.count("cat") == 1

    def test_limpia_puntuacion(self):
        result = get_content_words("Hello, world!", "english")
        assert "hello" in result
        assert "world" in result

    def test_texto_vacio_devuelve_lista_vacia(self):
        assert get_content_words("", "english") == []

    def test_idioma_desconocido_no_explota(self):
        # Si el idioma no existe en NLTK, debe devolver las palabras sin filtrar
        result = get_content_words("hello world", "klingon")
        assert "hello" in result
        assert "world" in result

    def test_todo_stop_words_devuelve_lista_vacia(self):
        result = get_content_words("the a an", "english")
        assert result == []



# Test to enrich words with LLM

from app.consumer import enrich
from app.models import EnrichmentMessage


def make_msg(**kwargs):
    defaults = dict(phrase_id=1, original_text="The dog barked", level="B1", language="english")
    return EnrichmentMessage(**{**defaults, **kwargs})


@pytest.mark.asyncio
async def test_enrich_guarda_palabras_nuevas():
    """Si la palabra no existe, llama al LLM y la guarda."""
    msg = make_msg()

    with (
        patch("app.consumer.word_exists", new_callable=AsyncMock, return_value=False),
        patch("app.consumer.enrich_word", new_callable=AsyncMock, return_value={
            "sentence": "The ___ barked loudly.",
            "distractors": ["cat", "bird", "fish"],
        }),
        patch("app.consumer.save", new_callable=AsyncMock) as mock_save,
    ):
        result = await enrich(msg)

    assert result is True
    assert mock_save.called


@pytest.mark.asyncio
async def test_enrich_salta_palabras_existentes():
    """Si la palabra ya existe, no llama al LLM."""
    msg = make_msg()

    with (
        patch("app.consumer.word_exists", new_callable=AsyncMock, return_value=True),
        patch("app.consumer.enrich_word", new_callable=AsyncMock) as mock_llm,
    ):
        await enrich(msg)

    mock_llm.assert_not_called()


@pytest.mark.asyncio
async def test_enrich_retorna_false_si_texto_vacio():
    """Texto sin palabras de contenido → False."""
    msg = make_msg(original_text="the a an")  # solo stop-words en inglés
    result = await enrich(msg)
    assert result is False


@pytest.mark.asyncio
async def test_enrich_retorna_false_si_llm_falla():
    """Si el LLM devuelve None, la palabra se salta y el resultado es False."""
    msg = make_msg(original_text="dog")

    with (
        patch("app.consumer.word_exists", new_callable=AsyncMock, return_value=False),
        patch("app.consumer.enrich_word", new_callable=AsyncMock, return_value=None),
        patch("app.consumer.save", new_callable=AsyncMock) as mock_save,
    ):
        result = await enrich(msg)

    assert result is False
    mock_save.assert_not_called()










# Tests to call llm

from app.llm_client import enrich_word


def _mock_llm_response(text: str):
    """Crea un mock de la respuesta de Anthropic."""
    content_block = MagicMock()
    content_block.text = text
    response = MagicMock()
    response.content = [content_block]
    return response


@pytest.mark.asyncio
async def test_enrich_word_respuesta_valida():
    valid_json = '{"sentence": "The ___ barked.", "distractors": ["cat", "bird", "fish"]}'

    mock_client = AsyncMock()
    mock_client.messages.create = AsyncMock(return_value=_mock_llm_response(valid_json))

    with patch("app.llm_client.get_client", return_value=mock_client):
        result = await enrich_word("dog", "B1", "english")

    assert result is not None
    assert "___" in result["sentence"]
    assert len(result["distractors"]) == 3


@pytest.mark.asyncio
async def test_enrich_word_json_invalido_retorna_none():
    mock_client = AsyncMock()
    mock_client.messages.create = AsyncMock(return_value=_mock_llm_response("not json at all"))

    with patch("app.llm_client.get_client", return_value=mock_client):
        result = await enrich_word("dog", "B1", "english")

    assert result is None


@pytest.mark.asyncio
async def test_enrich_word_frase_sin_blank_retorna_none():
    bad_json = '{"sentence": "The dog barked.", "distractors": ["cat", "bird", "fish"]}'

    mock_client = AsyncMock()
    mock_client.messages.create = AsyncMock(return_value=_mock_llm_response(bad_json))

    with patch("app.llm_client.get_client", return_value=mock_client):
        result = await enrich_word("dog", "B1", "english")

    assert result is None


@pytest.mark.asyncio
async def test_enrich_word_distractores_incorrectos_retorna_none():
    bad_json = '{"sentence": "The ___ barked.", "distractors": ["cat", "bird"]}'  # solo 2

    mock_client = AsyncMock()
    mock_client.messages.create = AsyncMock(return_value=_mock_llm_response(bad_json))

    with patch("app.llm_client.get_client", return_value=mock_client):
        result = await enrich_word("dog", "B1", "english")

    assert result is None


# Tests for models

from app.models import EnrichmentMessage, EnrichedPhrase


class TestModels:
    def test_enrichment_message_defaults(self):
        msg = EnrichmentMessage(phrase_id=1, original_text="hello")
        assert msg.level == "B1"
        assert msg.language == "english"

    def test_enrichment_message_custom(self):
        msg = EnrichmentMessage(phrase_id=42, original_text="bonjour", level="A1", language="french")
        assert msg.phrase_id == 42
        assert msg.language == "french"

    def test_enriched_phrase_campos(self):
        phrase = EnrichedPhrase(
            phrase_id=1,
            word="dog",
            sentence="The ___ barked.",
            correct_answer="dog",
            distractors=["cat", "bird", "fish"],
            level="B1",
            language="english",
        )
        assert phrase.correct_answer == "dog"
        assert len(phrase.distractors) == 3