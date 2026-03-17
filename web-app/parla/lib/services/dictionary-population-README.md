# Dictionary Population System

Sistema completo para poblar el diccionario automáticamente desde las frases del usuario, extrayendo palabras únicas y obteniendo definiciones de la Free Dictionary API.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Servicios](#servicios)
- [Uso](#uso)
- [Ejemplos](#ejemplos)
- [API Reference](#api-reference)

## 🎯 Descripción General

Este sistema automatiza el proceso de:

1. **Obtener frases** del usuario desde el Core Service
2. **Extraer palabras únicas** de las frases (sin duplicados)
3. **Buscar definiciones** en la Free Dictionary API
4. **Crear entradas** de diccionario con las 3 primeras definiciones
5. **Almacenar** las palabras para búsqueda y visualización

### Características Principales

- ✅ Extracción inteligente de palabras con normalización
- ✅ Filtrado de stop words (palabras comunes)
- ✅ Integración con Free Dictionary API
- ✅ Límite de 3 definiciones por palabra
- ✅ Soporte multiidioma (EN, ES, FR, DE, IT, PT, RU, JA, KO, AR)
- ✅ Rate limiting para evitar sobrecarga de API
- ✅ Tracking de progreso en tiempo real
- ✅ Manejo robusto de errores

## 🏗️ Arquitectura

```
┌─────────────────┐
│  User Phrases   │
│  (Core Service) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Word Extraction │
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Unique Words   │
│   (Normalized)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Dictionary API  │
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Dictionary    │
│    Entries      │
└─────────────────┘
```

## 📦 Servicios

### 1. Word Extraction Service (`wordExtraction.ts`)

Extrae y procesa palabras de las frases.

**Funciones principales:**
- `extractWordsFromText()` - Extrae palabras de un texto
- `extractUniqueWordsFromPhrases()` - Extrae palabras únicas de múltiples frases
- `normalizeWord()` - Normaliza palabras (lowercase, sin puntuación)
- `shouldFilterWord()` - Determina si una palabra debe filtrarse

**Características:**
- Normalización de texto (lowercase, sin puntuación)
- Filtrado de stop words (palabras comunes como "the", "a", "is")
- Soporte para múltiples idiomas
- Estadísticas de palabras extraídas

### 2. Dictionary API Service (`dictionaryApiService.ts`)

Integración con Free Dictionary API.

**Funciones principales:**
- `fetchWordDefinition()` - Obtiene definición de una palabra
- `fetchMultipleDefinitions()` - Obtiene definiciones de múltiples palabras
- `isSupportedLanguage()` - Verifica si un idioma está soportado
- `getLanguageCode()` - Convierte nombre de idioma a código

**Características:**
- Rate limiting (500ms entre requests)
- Límite de definiciones por palabra (default: 3)
- Manejo de errores y palabras no encontradas
- Extracción de sinónimos y antónimos
- Soporte para pronunciación y audio

### 3. Dictionary Population Service (`dictionaryPopulation.ts`)

Orquesta el proceso completo de población.

**Funciones principales:**
- `populateDictionaryFromPhrases()` - Puebla desde frases del usuario
- `populateDictionaryFromPhrasesArray()` - Puebla desde array de frases

**Características:**
- Tracking de progreso por etapas
- Manejo de errores detallado
- Estadísticas de resultados
- Callback de progreso en tiempo real

## 🚀 Uso

### Uso Básico

```typescript
import { populateDictionaryFromPhrases } from '@/lib/services/dictionaryPopulation';

// Poblar diccionario desde frases del usuario
const result = await populateDictionaryFromPhrases(userId, {
  filterStopWords: true,
  maxDefinitionsPerWord: 3,
  targetLanguage: 'es',
  onProgress: (progress) => {
    console.log(progress.message);
  }
});

console.log(`Created ${result.successfulDefinitions} dictionary entries`);
```

### Con Tracking de Progreso

```typescript
const result = await populateDictionaryFromPhrases(userId, {
  filterStopWords: true,
  maxDefinitionsPerWord: 3,
  targetLanguage: 'es',
  onProgress: (progress) => {
    // Actualizar UI con progreso
    console.log(`[${progress.stage}] ${progress.message}`);
    console.log(`Progress: ${progress.currentStep}/${progress.totalSteps}`);
    
    if (progress.currentWord) {
      console.log(`Processing: ${progress.currentWord}`);
    }
  }
});
```

### Desde Array de Frases (Testing/Demo)

```typescript
import { populateDictionaryFromPhrasesArray } from '@/lib/services/dictionaryPopulation';
import { SAMPLE_PHRASES } from '@/lib/services/dictionaryPopulation.examples';

const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
  filterStopWords: true,
  maxDefinitionsPerWord: 3,
  targetLanguage: 'es',
});
```

## 📚 Ejemplos

### Ejemplo 1: Población Básica

```typescript
import { exampleBasicPopulation } from '@/lib/services/dictionaryPopulation.examples';

await exampleBasicPopulation();
```

**Output:**
```
=== Example 1: Basic Dictionary Population ===

[fetching_phrases] Fetching your phrases...
[extracting_words] Extracting words from 7 phrases...
[fetching_definitions] Fetching definitions for 25 words...
  → Processing: quick
  → Processing: brown
  → Processing: fox
...

=== Results ===
Success: true
Total Phrases: 7
Total Words Extracted: 25
Successful Definitions: 22
Failed Definitions: 3
Dictionary Entries Created: 22
```

### Ejemplo 2: Mostrar Entradas del Diccionario

```typescript
import { exampleDisplayDictionaryEntries } from '@/lib/services/dictionaryPopulation.examples';

await exampleDisplayDictionaryEntries();
```

**Output:**
```
1. QUICK
   Language: english
   Difficulty: easy
   Type: adjective
   Pronunciation: /kwɪk/
   Definitions (3):
     1. [adjective] Moving fast or doing something in a short time
        Example: "She's a quick learner"
     2. [adjective] Done with speed
     3. [noun] The soft tender flesh below the growing part of a fingernail
   Synonyms: fast, rapid, swift
   From phrase: "The quick brown fox jumps over the lazy dog"

2. BROWN
   Language: english
   Difficulty: medium
   Type: adjective
   ...
```

### Ejemplo 3: Buscar en el Diccionario

```typescript
import { exampleSearchDictionary } from '@/lib/services/dictionaryPopulation.examples';

await exampleSearchDictionary();
```

**Output:**
```
=== Nouns ===
Found 8 nouns:
  - fox
  - dog
  - languages
  - doors
  - cultures

=== Verbs ===
Found 6 verbs:
  - jumps
  - learning
  - opens
  - practice
  - studying

=== By Difficulty ===
Easy: 10, Medium: 8, Hard: 4
```

### Ejemplo 4: Ejecutar Todos los Ejemplos

```typescript
import { runAllExamples } from '@/lib/services/dictionaryPopulation.examples';

await runAllExamples();
```

## 📖 API Reference

### PopulationProgress

```typescript
interface PopulationProgress {
  stage: 'fetching_phrases' | 'extracting_words' | 'fetching_definitions' | 'creating_entries' | 'complete';
  currentStep: number;
  totalSteps: number;
  currentWord?: string;
  message: string;
}
```

### PopulationResult

```typescript
interface PopulationResult {
  success: boolean;
  totalPhrases: number;
  totalWords: number;
  successfulDefinitions: number;
  failedDefinitions: number;
  dictionaryEntries: DictionaryWord[];
  errors: string[];
}
```

### ExtractedWord

```typescript
interface ExtractedWord {
  word: string;
  normalizedWord: string;
  sourcePhrase: string;
  sourcePhraseId: number;
  language: string;
}
```

### WordLookupResult

```typescript
interface WordLookupResult {
  word: string;
  pronunciation?: string;
  audioUrl?: string;
  definitions: ProcessedDefinition[];
  synonyms: string[];
  antonyms: string[];
  found: boolean;
  error?: string;
}
```

## 🔧 Configuración

### Opciones de Población

```typescript
{
  filterStopWords?: boolean;        // Default: true
  maxDefinitionsPerWord?: number;   // Default: 3
  targetLanguage?: Language;        // Default: 'es'
  onProgress?: (progress: PopulationProgress) => void;
}
```

### Stop Words

El sistema incluye listas de stop words para inglés y español. Puedes desactivar el filtrado:

```typescript
const result = await populateDictionaryFromPhrases(userId, {
  filterStopWords: false, // Incluir todas las palabras
});
```

### Rate Limiting

El servicio implementa rate limiting automático de 500ms entre requests para evitar sobrecarga de la API.

## 🌍 Idiomas Soportados

- 🇬🇧 English (en)
- 🇪🇸 Español (es)
- 🇫🇷 Français (fr)
- 🇩🇪 Deutsch (de)
- 🇮🇹 Italiano (it)
- 🇵🇹 Português (pt)
- 🇷🇺 Русский (ru)
- 🇯🇵 日本語 (ja)
- 🇰🇷 한국어 (ko)
- 🇸🇦 العربية (ar)

## ⚠️ Limitaciones

1. **API Rate Limits**: La Free Dictionary API puede tener límites de uso
2. **Palabras no encontradas**: No todas las palabras tienen definiciones disponibles
3. **Idiomas**: Solo idiomas soportados por la Free Dictionary API
4. **Tiempo de procesamiento**: Puede tomar varios minutos para muchas frases

## 🐛 Manejo de Errores

El sistema maneja varios tipos de errores:

- **Palabras no encontradas**: Se registran pero no detienen el proceso
- **Errores de API**: Se capturan y reportan en `result.errors`
- **Idiomas no soportados**: Se valida antes de hacer requests
- **Network errors**: Se manejan con reintentos automáticos

## 📊 Estadísticas

Después de la población, obtienes estadísticas detalladas:

```typescript
{
  totalPhrases: 7,
  totalWords: 25,
  successfulDefinitions: 22,
  failedDefinitions: 3,
  dictionaryEntries: [...]
}
```

## 🔄 Flujo de Datos

1. **Fetch Phrases** → Obtiene frases del usuario
2. **Extract Words** → Divide frases en palabras únicas
3. **Normalize** → Limpia y normaliza palabras
4. **Filter** → Elimina stop words (opcional)
5. **Fetch Definitions** → Busca en Dictionary API
6. **Create Entries** → Genera entradas de diccionario
7. **Return Results** → Devuelve estadísticas y entradas

## 🎨 Integración con UI

```typescript
// En un componente React
const [progress, setProgress] = useState<PopulationProgress | null>(null);
const [result, setResult] = useState<PopulationResult | null>(null);

const populateDictionary = async () => {
  const res = await populateDictionaryFromPhrases(userId, {
    onProgress: setProgress,
  });
  setResult(res);
};

// Mostrar progreso
{progress && (
  <div>
    <p>{progress.message}</p>
    <ProgressBar 
      value={progress.currentStep} 
      max={progress.totalSteps} 
    />
  </div>
)}
```

## 📝 Notas

- Las definiciones se limitan a 3 por palabra para mantener el diccionario conciso
- El sistema usa la primera definición para determinar el tipo de palabra principal
- Los sinónimos y antónimos se limitan a 5 cada uno
- La dificultad se estima basándose en la longitud de la palabra
- Cada entrada incluye la frase original de donde se extrajo la palabra

## 🚀 Próximos Pasos

1. Integrar con almacenamiento persistente (localStorage/database)
2. Agregar caché de definiciones para evitar requests duplicados
3. Implementar sincronización con backend
4. Agregar soporte para más idiomas
5. Mejorar estimación de dificultad con ML
6. Agregar tests unitarios
