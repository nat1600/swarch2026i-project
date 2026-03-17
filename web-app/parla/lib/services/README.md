# Phrases Service - Core Service API Integration

Este servicio proporciona una interfaz TypeScript completa para consumir todos los endpoints del **core-service** (backend de phrases/flashcards).

## 📁 Archivos

- **`phrasesService.ts`** - Servicio principal con todos los métodos
- **`phrasesService.examples.ts`** - Ejemplos de uso de cada método
- **`../types/phrases.ts`** - Tipos TypeScript para requests/responses
- **`../api/coreApiClient.ts`** - Cliente Axios configurado

## 🚀 Configuración

### 1. Variables de entorno

Agrega a tu archivo `.env.local`:

```env
NEXT_PUBLIC_CORE_API_URL=http://localhost:8000
```

### 2. Importar el servicio

```typescript
import { phrasesService } from '@/lib/services/phrasesService';
```

## 📚 Métodos Disponibles

### Phrases (Vocabulario)

#### `getAllPhrases()`
Obtiene todas las frases del usuario.

```typescript
const phrases = await phrasesService.getAllPhrases();
```

#### `createPhrase(data)`
Crea una nueva frase.

```typescript
const phrase = await phrasesService.createPhrase({
  user_id: 1,
  source_language_id: 1,
  target_language_id: 2,
  original_text: 'Hello',
  translated_text: 'Hola',
  pronunciation: '/həˈloʊ/',
});
```

#### `getDuePhrases(userId)`
Obtiene frases que necesitan revisión hoy.

```typescript
const duePhrases = await phrasesService.getDuePhrases(1);
```

#### `getPhraseById(phraseId)`
Obtiene una frase específica.

```typescript
const phrase = await phrasesService.getPhraseById(123);
```

#### `deletePhrase(phraseId)`
Elimina una frase (soft delete).

```typescript
await phrasesService.deletePhrase(123);
```

### Flashcards (Revisión SM-2)

#### `reviewPhrase(phraseId, quality)`
Registra una revisión de flashcard.

```typescript
import { ReviewQuality } from '@/lib/types/phrases';

const result = await phrasesService.reviewPhrase(
  123,
  ReviewQuality.CORRECT_HESITATION // 4
);

console.log(`Next review in ${result.inner_repetition_interval} days`);
```

**Niveles de calidad:**
- `0` - COMPLETE_BLACKOUT (olvidó completamente)
- `1` - INCORRECT_EASY_RECALL (incorrecto pero fácil de recordar)
- `2` - INCORRECT_HARD_RECALL (incorrecto y difícil)
- `3` - CORRECT_DIFFICULT (correcto con dificultad)
- `4` - CORRECT_HESITATION (correcto con dudas)
- `5` - PERFECT (perfecto)

### Traducción

#### `translate(data)`
Traduce texto usando múltiples proveedores.

```typescript
const translation = await phrasesService.translate({
  text: 'Hello, how are you?',
  source_lang: 'en',
  target_lang: 'es',
});

console.log(translation.translated_text); // "Hola, ¿cómo estás?"
console.log(translation.provider); // "deepl" | "libretranslate" | "mymemory"
```

### Historial de Revisión

#### `logReview(data)`
Registra una revisión en el historial (MongoDB).

```typescript
await phrasesService.logReview({
  user_id: 1,
  phrase_id: 123,
  quality: 4,
});
```

#### `getReviewHistoryByUser(userId)`
Obtiene historial de revisiones de un usuario.

```typescript
const history = await phrasesService.getReviewHistoryByUser(1);
```

#### `getReviewHistoryByPhrase(phraseId)`
Obtiene historial de revisiones de una frase.

```typescript
const history = await phrasesService.getReviewHistoryByPhrase(123);
```

## 💡 Ejemplos de Uso Completos

### Ejemplo 1: Capturar palabra desde subtítulo

```typescript
async function captureWord(word: string, userId: number) {
  // 1. Traducir la palabra
  const translation = await phrasesService.translate({
    text: word,
    source_lang: 'en',
    target_lang: 'es',
  });

  // 2. Guardar como frase
  const phrase = await phrasesService.createPhrase({
    user_id: userId,
    source_language_id: 1,
    target_language_id: 2,
    original_text: translation.original,
    translated_text: translation.translated_text,
    pronunciation: translation.pronunciation,
  });

  return phrase;
}
```

### Ejemplo 2: Sesión de flashcards

```typescript
async function flashcardSession(userId: number) {
  // 1. Obtener frases pendientes
  const duePhrases = await phrasesService.getDuePhrases(userId);

  if (duePhrases.length === 0) {
    console.log('No hay frases para revisar');
    return;
  }

  // 2. Revisar cada frase
  for (const phrase of duePhrases) {
    // Mostrar al usuario: phrase.original_text
    // Esperar respuesta del usuario
    const quality = getUserResponse(); // 0-5

    // 3. Registrar revisión
    await phrasesService.reviewPhrase(phrase.id, quality);
    
    // 4. Guardar en historial
    await phrasesService.logReview({
      user_id: userId,
      phrase_id: phrase.id,
      quality,
    });
  }
}
```

### Ejemplo 3: Uso en React Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { phrasesService } from '@/lib/services/phrasesService';
import { Phrase } from '@/lib/types/phrases';

export default function MyPhrases() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPhrases() {
      try {
        const data = await phrasesService.getAllPhrases();
        setPhrases(data);
      } catch (error) {
        console.error('Error loading phrases:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPhrases();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Phrases ({phrases.length})</h1>
      {phrases.map((phrase) => (
        <div key={phrase.id}>
          <p>{phrase.original_text} → {phrase.translated_text}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Manejo de Errores

Todos los métodos lanzan errores del tipo `ApiError`:

```typescript
import { ApiError } from '@/lib/types/phrases';

try {
  const phrase = await phrasesService.getPhraseById(999);
} catch (error) {
  const apiError = error as ApiError;
  console.error(`Error ${apiError.status}: ${apiError.detail}`);
  
  if (apiError.status === 404) {
    console.log('Phrase not found');
  }
}
```

## 🔐 Autenticación (TODO)

Actualmente el servicio no incluye autenticación. Cuando se implemente JWT:

1. Actualizar `coreApiClient.ts` para incluir el token en los headers
2. Obtener el `user_id` desde el token de Auth0
3. Remover el parámetro `user_id` de los métodos que lo requieren

## 📖 Más Ejemplos

Ver `phrasesService.examples.ts` para ejemplos completos de cada método.

## 🐛 Debug

Para ver los logs de las peticiones HTTP, abre la consola del navegador. El interceptor de Axios registra todos los errores automáticamente.
