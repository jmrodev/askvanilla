// Para ejecutar este script:
// 1. Guarda el contenido en un archivo, por ejemplo, `list_files.js`.
// 2. Abre tu terminal, navega hasta el directorio donde guardaste el archivo.
// 3. Ejecuta: `node list_files.js`

import { promises as fs } from 'fs'
import path from 'path'

// --- CONFIGURACIÓN DE RENDIMIENTO Y EXCLUSIÓN ---
// Ajusta estas configuraciones según tus necesidades.

// Define la cantidad máxima de bytes a leer de un archivo para intentar determinar si es binario.
// Si un archivo es más grande que esto, no se intentará leerlo para la detección binaria.
const MAX_FILE_READ_FOR_BINARY_CHECK_BYTES = 1 * 1024 * 1024 // 1 MB

// Define la cantidad máxima de bytes del contenido de un archivo a mostrar en la consola
// para ARCHIVOS DE TEXTO NO JAVASCRIPT.
const DEFAULT_MAX_FILE_CONTENT_DISPLAY_BYTES = 2 * 1024 // 2 KB

// Define la cantidad máxima de bytes del contenido de un archivo JavaScript a mostrar en la consola.
// Se ha aumentado significativamente para mostrar el contenido completo de la mayoría de los archivos JS.
const JS_MAX_CONTENT_DISPLAY_BYTES = 10 * 1024 * 1024 // 10 MB

// Límite de profundidad de recursión para evitar recorrer estructuras de directorios excesivamente profundas.
const MAX_RECURSION_DEPTH = 7

// Lista de directorios a excluir del recorrido.
// Es CRÍTICO excluir 'node_modules' y '.git' para evitar el bloqueo del sistema
// debido a la gran cantidad de archivos y profundidad.
const EXCLUDE_DIRS = [
  'node_modules', // Dependencias de Node.js (cientos/miles de archivos)
  '.git', // Historial de control de versiones (puede ser grande)
  '.vscode', // Configuración de VS Code
  'dist', // Salidas de build
  'build', // Salidas de build
  'temp', // Temporales
  'tmp', // Temporales
  'coverage', // Informes de cobertura de tests
  '__pycache__', // Para proyectos Python
  '.idea', // Para proyectos IntelliJ/WebStorm
  'test', // Directorios de pruebas (pueden ser grandes si tienen muchos fixtures)
  'docs', // Documentación (a veces contiene muchos archivos)
]

// Lista de extensiones de archivo a excluir.
// Estos son típicamente archivos binarios o muy grandes cuyo contenido no es útil en consola.
// Asegúrate de que .js, .jsx, .mjs, .cjs NO estén en esta lista.
const EXCLUDE_FILE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.svg',
  '.webp', // Imágenes
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.aac', // Audio
  '.mp4',
  '.avi',
  '.mov',
  '.webm', // Video
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z', // Archivos comprimidos
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx', // Documentos de oficina
  '.exe',
  '.dll',
  '.bin',
  '.so',
  '.dylib', // Ejecutables/Librerías
  '.DS_Store', // Archivos de macOS
  '.log', // Archivos de log (pueden ser muy grandes)
  '.map', // Archivos de mapa de código (grandes)
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot', // Fuentes
  '.sqlite',
  '.db',
  '.dat', // Bases de datos y archivos de datos genéricos
  '.lock', // Archivos de lock (ej. package-lock.json, pnpm-lock.yaml)
  '.json', // Puedes excluir si tus JSONs son muy grandes o solo quieres código. Por ahora, no lo excluyo.
  '.yaml',
  '.yml', // Puedes excluir si tus YAMLs son muy grandes. Por ahora, no lo excluyo.
]

// --- FUNCIONES PRINCIPALES ---

/**
 * Función recursiva para listar el contenido de un directorio.
 * @param {string} currentPath La ruta del directorio actual a escanear.
 * @param {string} indent La cadena de indentación para la salida de la consola.
 * @param {number} currentDepth La profundidad de recursión actual.
 */
async function listDirectoryContents(
  currentPath,
  indent = '',
  currentDepth = 0
) {
  // 1. Comprobar límite de profundidad
  if (currentDepth >= MAX_RECURSION_DEPTH) {
    console.log(
      `${indent}📁 ... (Profundidad máxima alcanzada en ${path.basename(
        currentPath
      )}. Saltando contenido.)`
    )
    return
  }

  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const dirent of entries) {
      const fullPath = path.join(currentPath, dirent.name)

      if (dirent.isDirectory()) {
        // Si es un directorio
        if (EXCLUDE_DIRS.includes(dirent.name)) {
          console.log(
            `${indent}📁 ${dirent.name}/ (Excluido por configuración)`
          )
          continue // Saltar este directorio
        }
        console.log(`${indent}📁 ${dirent.name}/`)
        // Llamada recursiva para los subdirectorios
        await listDirectoryContents(fullPath, indent + '  ', currentDepth + 1)
      } else if (dirent.isFile()) {
        // Si es un archivo
        const fileExtension = path.extname(dirent.name).toLowerCase()
        if (EXCLUDE_FILE_EXTENSIONS.includes(fileExtension)) {
          console.log(
            `${indent}📄 ${dirent.name} (Excluido por configuración - tipo: ${fileExtension})`
          )
          continue // Saltar este archivo
        }

        let contentPreview = ''
        let fileSize = 0
        let currentMaxDisplayBytes = DEFAULT_MAX_FILE_CONTENT_DISPLAY_BYTES

        // Determinar el límite de visualización basado en la extensión
        if (['.js', '.jsx', '.mjs', '.cjs'].includes(fileExtension)) {
          currentMaxDisplayBytes = JS_MAX_CONTENT_DISPLAY_BYTES
        }

        try {
          const stats = await fs.stat(fullPath)
          fileSize = stats.size

          // Si el archivo es demasiado grande para la lectura binaria o para mostrar la vista previa
          if (
            fileSize > MAX_FILE_READ_FOR_BINARY_CHECK_BYTES &&
            fileExtension !== '.js'
          ) {
            // Excepción para JS
            // Para JS, si es enorme, aún así intentaremos leer una parte considerable.
            // Para otros archivos, si son muy grandes, no los leemos.
            contentPreview = `<Contenido demasiado grande para leer (${fileSize} bytes). No se leyó completo.>`
          } else {
            const buffer = await fs.readFile(fullPath)
            // Heurística para detectar si es binario:
            const hasNullBytes = buffer.includes(0) // Comprueba si el buffer contiene el byte nulo (0x00)

            if (hasNullBytes) {
              contentPreview = `<Contenido binario detectado (${fileSize} bytes). No se puede mostrar como texto legible.>`
            } else {
              // Intentar decodificar como UTF-8
              try {
                const textContent = buffer.toString('utf8')
                // Aplica el límite de visualización específico para la extensión
                contentPreview = textContent.substring(
                  0,
                  currentMaxDisplayBytes
                )
                if (textContent.length > currentMaxDisplayBytes) {
                  contentPreview += '...<truncado>'
                }
              } catch (decodeErr) {
                // Si falla la decodificación UTF-8, es definitivamente un encoding no soportado o binario.
                contentPreview = `<Contenido no-UTF8 o binario (${fileSize} bytes). Error de decodificación.>`
              }
            }
          }
        } catch (readErr) {
          contentPreview = `<Error al leer archivo: ${readErr.message}>`
        }

        console.log(`${indent}📄 ${dirent.name} (${fileSize} bytes)`)
        console.log(`${indent}   --- INICIO CONTENIDO ---`)
        console.log(contentPreview)
        console.log(`${indent}   --- FIN CONTENIDO ---`)
      }
      // Ignorar otros tipos de entradas como symlinks, sockets, FIFOs, etc.
    }
  } catch (error) {
    // Capturar errores como permisos denegados o directorios que no existen.
    console.error(
      `${indent}Error al acceder a ${currentPath}: ${error.message}`
    )
  }
}

// --- FUNCIÓN PRINCIPAL DE EJECUCIÓN ---
async function main() {
  const startPath = process.cwd() // Obtiene el directorio actual de ejecución
  console.log(`\n--- Listando archivos y directorios desde: ${startPath} ---\n`)
  console.log(
    `Nota: Se aplica un límite de profundidad de ${MAX_RECURSION_DEPTH} y se excluyen directorios/extensiones comunes (ver configuración).`
  )
  console.log(
    `Para archivos JS (.js, .jsx, .mjs, .cjs), se intenta mostrar hasta ${
      JS_MAX_CONTENT_DISPLAY_BYTES / (1024 * 1024)
    }MB de contenido.`
  )
  console.log(
    `Para otros archivos de texto, se muestra un máximo de ${
      DEFAULT_MAX_FILE_CONTENT_DISPLAY_BYTES / 1024
    }KB.`
  )
  await listDirectoryContents(startPath)
  console.log('\n--- Script Finalizado ---')
}

// Inicia la ejecución del script
main()
