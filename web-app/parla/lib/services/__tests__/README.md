# PhrasesService Unit Tests

Suite completa de pruebas unitarias para el servicio de phrases del core-service.

## 📊 Cobertura de Pruebas

### Métodos Probados

- ✅ `getAllPhrases()` - 3 tests
- ✅ `createPhrase()` - 2 tests
- ✅ `getDuePhrases()` - 2 tests
- ✅ `getPhraseById()` - 2 tests
- ✅ `deletePhrase()` - 2 tests
- ✅ `reviewPhrase()` - 3 tests
- ✅ `translate()` - 3 tests
- ✅ `logReview()` - 1 test
- ✅ `getReviewHistoryByUser()` - 2 tests
- ✅ `getReviewHistoryByPhrase()` - 1 test
- ✅ Error Handling - 3 tests
- ✅ Service Instance - 2 tests

**Total: 26 pruebas unitarias**

## 🚀 Ejecutar Pruebas

### Instalar dependencias

```bash
pnpm install
```

### Ejecutar todos los tests

```bash
pnpm test
```

### Ejecutar tests en modo watch

```bash
pnpm test:watch
```

### Generar reporte de cobertura

```bash
pnpm test:coverage
```

## 📝 Estructura de las Pruebas

### 1. Setup y Mocks

Cada test utiliza mocks de Axios para simular las respuestas del API:

```typescript
jest.mock('@/lib/api/coreApiClient');
const mockedAxios = coreApiClient as jest.Mocked<typeof coreApiClient>;
```

### 2. BeforeEach Hook

Limpia los mocks antes de cada test para evitar interferencias:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 3. Casos de Prueba

Cada método tiene pruebas para:
- ✅ Caso exitoso (happy path)
- ❌ Manejo de errores
- 🔍 Casos edge (arrays vacíos, valores nulos, etc.)

## 🧪 Ejemplos de Tests

### Test de caso exitoso

```typescript
it('should fetch all phrases successfully', async () => {
  const mockPhrases: Phrase[] = [...];
  mockedAxios.get.mockResolvedValueOnce({ data: mockPhrases });

  const result = await phrasesService.getAllPhrases();

  expect(mockedAxios.get).toHaveBeenCalledWith('/phrases/');
  expect(result).toEqual(mockPhrases);
});
```

### Test de manejo de errores

```typescript
it('should handle 404 error when phrase not found', async () => {
  const mockError = {
    response: { status: 404, data: { detail: 'Phrase not found' } }
  } as AxiosError;

  mockedAxios.get.mockRejectedValueOnce(mockError);

  await expect(phrasesService.getPhraseById(999)).rejects.toMatchObject({
    detail: 'Phrase not found',
    status: 404,
  });
});
```

## 📋 Checklist de Pruebas

### Métodos CRUD
- [x] GET all phrases
- [x] POST create phrase
- [x] GET phrase by ID
- [x] DELETE phrase
- [x] GET due phrases

### Flashcards (SM-2)
- [x] POST review phrase
- [x] Diferentes niveles de calidad (0-5)
- [x] Validación de quality score

### Traducción
- [x] POST translate
- [x] Múltiples proveedores (deepl, libretranslate, mymemory)
- [x] Manejo de errores de servicio

### Historial de Revisión
- [x] POST log review
- [x] GET review history by user
- [x] GET review history by phrase

### Manejo de Errores
- [x] Errores HTTP (400, 404, 500, 503)
- [x] Errores de red
- [x] Errores inesperados
- [x] Timeouts

### Otros
- [x] Singleton instance
- [x] Crear nuevas instancias

## 🎯 Objetivos de Cobertura

- **Líneas**: > 90%
- **Funciones**: 100%
- **Branches**: > 85%
- **Statements**: > 90%

## 🔧 Configuración

### jest.config.js

Configuración de Jest con soporte para Next.js y TypeScript.

### jest.setup.js

Setup global para tests, incluye:
- `@testing-library/jest-dom`
- Variables de entorno mockeadas

### tsconfig.test.json

Configuración de TypeScript específica para tests.

## 📚 Tecnologías Utilizadas

- **Jest** - Framework de testing
- **@testing-library/jest-dom** - Matchers adicionales
- **ts-jest** - Soporte TypeScript
- **jest-environment-jsdom** - Entorno DOM para tests

## 🐛 Debugging Tests

### Ver output detallado

```bash
pnpm test -- --verbose
```

### Ejecutar un test específico

```bash
pnpm test -- phrasesService.test.ts
```

### Ejecutar solo tests que coincidan con un patrón

```bash
pnpm test -- -t "getAllPhrases"
```

## 📊 Reporte de Cobertura

Después de ejecutar `pnpm test:coverage`, el reporte estará disponible en:

```
coverage/
├── lcov-report/
│   └── index.html  # Reporte HTML interactivo
└── lcov.info       # Datos de cobertura
```

Abre `coverage/lcov-report/index.html` en tu navegador para ver el reporte detallado.

## ✅ Validaciones

Cada test valida:

1. **Llamadas correctas al API**
   - Endpoint correcto
   - Parámetros correctos
   - Número de llamadas

2. **Respuestas esperadas**
   - Estructura de datos
   - Valores específicos
   - Tipos correctos

3. **Manejo de errores**
   - Códigos de estado HTTP
   - Mensajes de error
   - Propagación de errores

## 🔄 Integración Continua

Estos tests están diseñados para ejecutarse en CI/CD pipelines. Asegúrate de:

1. Instalar dependencias: `pnpm install`
2. Ejecutar tests: `pnpm test`
3. Verificar cobertura: `pnpm test:coverage`
4. Fallar el build si la cobertura es < 80%

## 📝 Notas

- Los tests usan mocks de Axios, no hacen llamadas reales al API
- Cada test es independiente y aislado
- Los mocks se limpian antes de cada test
- Las variables de entorno se mockean en `jest.setup.js`
