# Arquitectura de AskVanilla

## 📐 Visión General

AskVanilla sigue una arquitectura modular basada en **separación de responsabilidades**, donde cada componente tiene un propósito específico y bien definido.

## 🏗️ Capas de la Aplicación

```
┌─────────────────────────────────────────┐
│              PUNTO DE ENTRADA           │
│                (index.js)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              CONTROLADORES              │
│   (interactive, chatWithMemory, etc.)   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│               SERVICIOS                 │
│     (generateContent, generateTTS)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              UTILIDADES                 │
│  (chatHelpers, chatHistory, context)    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│               CLIENTE                   │
│            (genaiClient)                │
└─────────────────────────────────────────┘
```

## 🎯 Responsabilidades por Capa

### 1. Punto de Entrada (`src/index.js`)

**Responsabilidad**: Orquestación principal y despacho de modos

```javascript
// Flujo principal
async function main() {
  // 1. Inicializar cliente AI
  const ai = createGenAIClient(process.env.GEMINI_API_KEY)
  
  // 2. Parsear argumentos CLI
  const parsed = await parseArgs(process.argv)
  
  // 3. Despachar según entrada
  if (fileContent) {
    await handlePromptWithFile({...})  // Procesamiento directo
  } else {
    const mode = await selectConversationMode()
    await handleConversationMode({...})  // Modo interactivo
  }
}
```

**Funciones clave**:
- Inicialización del cliente GenAI
- Parsing de argumentos de línea de comandos
- Despacho a controladores específicos
- Manejo de archivos desde CLI

### 2. Controladores (`src/controllers/`)

**Responsabilidad**: Lógica específica de cada modo de interacción

#### Patrón Común de Controladores

```javascript
export async function modoController(ai, generateContent) {
  // 1. Configurar interfaz de usuario
  const rl = readline.createInterface({...})
  
  // 2. Configurar gestión de estado (historial, contexto)
  let history = await loadHistory(...)
  
  // 3. Configurar handlers específicos
  const sigintHandler = registerHistorySigintHandler(...)
  
  // 4. Ejecutar lógica principal
  await chatAsk({
    getPrompt: () => getUserPrompt(rl),
    buildContents,
    generateContent,
    ai,
    history,
    // ... configuración específica
  })
  
  // 5. Limpieza
  rl.close()
  process.off('SIGINT', sigintHandler)
}
```

#### Controladores Específicos

| Controlador | Propósito | Características |
|-------------|-----------|-----------------|
| `interactive.js` | Chat simple | Una pregunta, sin historial |
| `chatWithMemory.js` | Chat persistente | Historial en archivo, Ctrl+C handler |
| `chatNoMemory.js` | Chat temporal | Historial solo en memoria |
| `chatWithMemoryFile.js` | Chat + archivos persistente | Memoria + selector de archivos |
| `chatNoMemoryFile.js` | Chat + archivos temporal | Sin memoria + archivos |
| `pureTTS.js` | Solo TTS | Texto a voz directo |
| `contextHistoryManager.js` | Gestión | CRUD de contexto e historial |

### 3. Servicios (`src/services/`)

**Responsabilidad**: Lógica de negocio y comunicación con APIs externas

#### `generateContent.js`
```javascript
export async function* generateContent(ai, contents, debug = false) {
  const response = await ai.models.generateContentStream({
    model,      // Desde config
    config,     // Configuración de generación
    contents,   // Array de mensajes
  })
  
  // Procesar stream y yield texto
  for await (const chunk of response) {
    if (debug) console.dir(chunk, { depth: 10 })
    const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) yield text
  }
}
```

**Características**:
- Streaming de respuestas
- Configuración centralizada
- Modo debug integrado
- Manejo de errores de API

#### `generateTTS.js`
```javascript
export async function generateTTS(text, options = {}) {
  // Validar límites de caracteres
  if (text.length > TTS_CHARACTER_LIMIT) {
    throw new Error(`Texto demasiado largo: ${text.length} caracteres`)
  }
  
  // Llamar a API TTS
  const response = await ai.models.generateContent({
    model: GEMINI_TTS_MODEL,
    contents: [{ role: 'user', parts: [{ text }] }]
  })
  
  // Procesar respuesta de audio
  return response.audioData
}
```

### 4. Utilidades (`src/utils/`)

**Responsabilidad**: Funciones auxiliares reutilizables

#### `chatHelpers.js` - Funciones Core

```javascript
// Construcción de payload para API
export function buildContents(userPrompt, history, fileContent, combinedContext, debug) {
  const contents = []
  
  // 1. Añadir contexto si existe
  if (combinedContext.trim()) {
    contents.push({ role: 'user', parts: [{ text: combinedContext }] })
  }
  
  // 2. Añadir historial
  if (history && history.length > 0) {
    contents.push(...history)
  }
  
  // 3. Añadir mensaje actual
  const currentUserParts = [{ text: userPrompt }]
  if (fileContent.trim()) {
    currentUserParts.push({
      text: `\\`\\`\\`file_content\\n${fileContent}\\n\\`\\`\\``
    })
  }
  contents.push({ role: 'user', parts: currentUserParts })
  
  return contents
}

// Bucle principal de chat
export async function runChatLoop({
  getPrompt,
  buildContents,
  generateContent,
  ai,
  history,
  saveHistory,
  // ... más parámetros
}) {
  const loop = async () => {
    // 1. Obtener entrada del usuario
    const userPrompt = await getPrompt()
    
    // 2. Manejar salida
    if (await handleExit(userPrompt, saveHistory, history)) return
    
    // 3. Validar entrada
    if (!hasValidPromptOrFile(userPrompt, fileContent)) {
      logWarning('Por favor, ingresa un prompt o selecciona un archivo.')
      return loop()
    }
    
    // 4. Procesar turno
    await processUserTurn({...})
    
    // 5. Continuar bucle
    await loop()
  }
  await loop()
}
```

#### `chatHistory.js` - Gestión de Historial

```javascript
// Estructura de mensaje
const messageStructure = {
  role: 'user' | 'model',
  parts: [{ text: string }],
  timestamp: string,
  filePath?: string  // Solo para mensajes de usuario con archivo
}

// Funciones principales
export async function loadHistory(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []  // Historial vacío si no existe
  }
}

export async function saveHistory(filePath, history) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(history, null, 2))
}
```

#### `contextManager.js` - Gestión de Contexto

```javascript
// Tipos de contexto
const contextTypes = {
  global: 'context/global_context.txt',    // Aplicado siempre
  local: 'context/local_context.txt'       // Específico de sesión
}

export async function getCombinedContext() {
  const globalContext = await loadGlobalContext()
  const localContext = await loadLocalContext()
  
  return [globalContext, localContext]
    .filter(ctx => ctx.trim())
    .join('\\n\\n')
}
```

### 5. Cliente (`src/client/`)

**Responsabilidad**: Abstracción del cliente GenAI

```javascript
export function createGenAIClient(apiKey) {
  return new GoogleGenAI({ apiKey })
}
```

**Características**:
- Inicialización simple
- Validación de API key
- Configuración centralizada

## 🔄 Flujo de Datos

### Flujo Típico de Chat

```
1. Usuario ejecuta: node src/index.js
   ↓
2. index.js inicializa cliente AI
   ↓
3. parseArgs() procesa argumentos CLI
   ↓
4. selectConversationMode() muestra menú
   ↓
5. handleConversationMode() despacha a controlador
   ↓
6. Controlador configura interfaz y estado
   ↓
7. chatAsk() ejecuta bucle principal
   ↓
8. runChatLoop() maneja interacción usuario
   ↓
9. buildContents() prepara payload API
   ↓
10. generateContent() llama a Gemini
    ↓
11. printModelResponse() muestra respuesta
    ↓
12. addUserMessage/addModelMessage() actualiza historial
    ↓
13. Volver a paso 8 hasta salir
```

### Flujo de Procesamiento de Archivos

```
1. Usuario: node src/index.js --file archivo.txt \"prompt\"
   ↓
2. parseArgs() detecta --file y lee contenido
   ↓
3. handlePromptWithFile() procesa directamente
   ↓
4. buildContents() incluye contenido de archivo
   ↓
5. generateContent() envía a Gemini
   ↓
6. Respuesta se muestra y termina
```

## 🎛️ Configuración y Constantes

### Configuración de GenAI (`src/config/genaiConfig.js`)

```javascript
export const config = {
  thinkingConfig: {
    thinkingBudget: -1,  // Sin límite de \"pensamiento\"
  },
  responseMimeType: 'text/plain',
}

export const model = 'gemini-2.5-flash'
```

### Constantes Globales (`src/utils/constants.js`)

```javascript
// Límites técnicos
export const TTS_CHARACTER_LIMIT = 4500
export const MAX_LLM_FILE_PART_LINES = 1000
export const MAX_LLM_FILE_PART_CHARS = 10000

// Configuración de UI
export const MENU_CHOICES = [...]
export const OUTPUT_MODE_CHOICES = [...]
```

## 🔌 Puntos de Extensión

### Añadir Nuevo Modo de Chat

1. **Crear controlador** en `src/controllers/nuevoModo.js`
2. **Añadir opción** en `MENU_CHOICES`
3. **Registrar en despacho** en `handleConversationMode()`

### Añadir Nuevo Servicio

1. **Crear servicio** en `src/services/nuevoServicio.js`
2. **Importar en controladores** que lo necesiten
3. **Configurar en** `src/config/` si requiere configuración

### Añadir Nueva Utilidad

1. **Crear en** `src/utils/nuevaUtilidad.js`
2. **Exportar funciones** específicas
3. **Importar donde** se necesite

## 🛡️ Principios de Diseño

### 1. Separación de Responsabilidades
- Cada módulo tiene una responsabilidad clara
- No hay lógica de negocio en controladores de UI
- Servicios no manejan interfaz de usuario

### 2. Composición sobre Herencia
- Funciones puras cuando es posible
- Configuración por inyección de dependencias
- Reutilización por composición de funciones

### 3. Manejo de Errores Consistente
- Validación en puntos de entrada
- Propagación controlada de errores
- Mensajes de error descriptivos

### 4. Configuración Centralizada
- Constantes en archivos dedicados
- Configuración de API separada
- Variables de entorno para secretos

### 5. Extensibilidad
- Puntos de extensión bien definidos
- Patrones consistentes para nuevos componentes
- Configuración flexible

## ��� Métricas y Monitoreo

### Modo Debug
- Activar con `--debug`
- Muestra chunks de API
- Información de historial
- Payload completo a Gemini

### Logging
- Mensajes informativos con emojis
- Advertencias para validación
- Errores con contexto completo

### Persistencia
- Historial en JSON estructurado
- Contexto en archivos de texto
- Backups automáticos con timestamp

---

Esta arquitectura permite que AskVanilla sea **mantenible**, **extensible** y **fácil de entender**, siguiendo principios sólidos de ingeniería de software.