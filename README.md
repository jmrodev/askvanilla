# AskVanilla 🍦

Una aplicación de chat con IA usando Google Gemini, construida con Node.js y arquitectura modular.

## 📋 Descripción

AskVanilla es una aplicación de línea de comandos que permite interactuar con Google Gemini AI de múltiples formas: chat interactivo, con/sin memoria, procesamiento de archivos, y síntesis de voz (TTS). La aplicación está diseñada con **dos enfoques arquitectónicos completamente separados**.

## 🏗️ Arquitectura del Proyecto

El proyecto está organizado en **dos enfoques completamente independientes**:

### 🔧 Enfoque Funcional (src/)
- **Filosofía**: Funciones simples y procedurales
- **Ideal para**: Scripts rápidos y desarrollo ágil
- **Estructura**:
  ```
  src/
  ├── index.js                    # Punto de entrada funcional
  ├── controllers/                # Controladores funcionales
  ├── utils/                      # Utilidades y helpers
  ├── services/                   # Servicios funcionales
  ├── config/                     # Configuraciones
  └── client/                     # Cliente de IA
  ```

### 🏛️ Enfoque Orientado a Objetos (src/modern/)
- **Filosofía**: Arquitectura limpia con clases y objetos
- **Ideal para**: Aplicaciones complejas y mantenibles
- **Estructura**:
  ```
  src/modern/
  ├── domain/                     # Entidades y casos de uso
  ├── application/                # Servicios de aplicación
  ├── infrastructure/             # Implementaciones técnicas
  ├── adapters/                   # Adaptadores para repositorios
  ├── core/                       # Contenedor de dependencias
  ├── controllers/                # Controladores específicos
  ├── utils/                      # Utilidades copiadas
  ├── modern-index.js             # Punto de entrada POO
  └── [otros archivos...]
  ```

## 🚀 Características Principales

- **Múltiples modos de chat**: Interactivo, con memoria, sin memoria
- **Procesamiento de archivos**: Adjunta y analiza archivos en las conversaciones
- **Síntesis de voz (TTS)**: Convierte respuestas de texto a audio
- **Gestión de contexto**: Mantiene contexto global y local para conversaciones
- **Historial persistente**: Guarda y carga conversaciones anteriores
- **Modo debug**: Información detallada para desarrollo
- **Dos enfoques arquitectónicos**: Funcional y orientado a objetos

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd askvanilla
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Configurar API Key de Gemini**
   ```bash
   export GEMINI_API_KEY="tu-api-key-aqui"
   ```

## 🎯 Uso

### Enfoque Funcional
```bash
# Ejecutar la aplicación funcional
node src/index.js

# Modo debug
node src/index.js --debug
```

### Enfoque Orientado a Objetos
```bash
# Ejecutar la aplicación con arquitectura limpia
node src/modern/modern-index.js

# Modo debug
node src/modern/modern-index.js --debug
```

### Uso con Archivos (ambos enfoques)
```bash
# Procesar un archivo con prompt
node src/index.js --file ruta/al/archivo.js "Explica este código"
node src/modern/modern-index.js --file ruta/al/archivo.js "Explica este código"

# Solo procesar archivo sin prompt adicional
node src/index.js --file ruta/al/archivo.txt
node src/modern/modern-index.js --file ruta/al/archivo.txt
```

## 🎮 Modos de Operación

Ambos enfoques ofrecen los mismos modos de operación:

### 1. **Modo Interactivo**
- Chat simple de una sola pregunta
- No mantiene historial
- Ideal para consultas rápidas

### 2. **Chat con Memoria**
- Mantiene historial de conversación
- Guarda automáticamente en `chat_history.json`
- Permite conversaciones largas y contextuales

### 3. **Chat sin Memoria**
- Cada mensaje es independiente
- No guarda historial
- Útil para consultas aisladas

### 4. **Chat con Memoria + Archivos**
- Como el modo 2, pero permite adjuntar archivos
- Selector interactivo de archivos
- Procesa contenido junto con el prompt

### 5. **Chat sin Memoria + Archivos**
- Como el modo 3, pero con soporte para archivos
- Cada interacción es independiente

### 6. **TTS Directo**
- Convierte texto directamente a audio
- Sin interacción con IA
- Útil para síntesis de voz pura

### 7. **Gestión de Contexto e Historial**
- Administra contexto global y local
- Visualiza y edita historiales guardados
- Configuración avanzada

## 🔧 Configuración

### Configuración de Gemini
```javascript
// src/config/genaiConfig.js o src/modern/config/genaiConfig.js
export const config = {
  thinkingConfig: {
    thinkingBudget: -1,  // Sin límite de "pensamiento"
  },
  responseMimeType: 'text/plain',
}

export const model = 'gemini-2.5-flash'
```

### Constantes Globales
```javascript
// src/utils/constants.js o src/modern/utils/constants.js
export const TTS_CHARACTER_LIMIT = 4500
export const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts'
```

## 📚 Documentación Adicional

- **Enfoque Funcional**: Ver `src/` para implementación procedural
- **Enfoque POO**: Ver `src/modern/README.md` para arquitectura limpia
- **Arquitectura**: Ver `docs/architecture.md` para detalles técnicos

## 🤝 Contribución

Al contribuir, especifica claramente si tu cambio es para:
- **Enfoque Funcional**: Modificaciones en `src/`
- **Enfoque POO**: Modificaciones en `src/modern/`
- **Ambos**: Cambios que afectan a ambos enfoques

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.