import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

export const ASK_VANILLA_DIR = path.join(os.homedir(), '.askvanilla')
export const GENERAL_CONTEXT_FILE_PATH = path.join(
  ASK_VANILLA_DIR,
  'general_context.json'
)
export const LOCAL_CONTEXT_FILE_NAME = '.askvanilla_context.json'

async function ensureAskVanillaDir() {
  try {
    await fs.mkdir(ASK_VANILLA_DIR, { recursive: true })
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.error(`Error al crear el directorio de AskVanilla: ${e.message}`)
      throw e
    }
  }
}

/**
 * Carga el contexto de un archivo JSON.
 * @param {string} filePath La ruta completa al archivo de contexto.
 * @returns {Promise<string>} El contenido del contexto como string, o una cadena vacía si no existe/error.
 */
async function loadContext(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK)
    const data = await fs.readFile(filePath, 'utf-8')
    const json = JSON.parse(data)
    return json.text || ''
  } catch (e) {
    if (e.code === 'ENOENT') {
      return ''
    }
    console.error(`Error al cargar el contexto desde ${filePath}: ${e.message}`)
    return ''
  }
}

/**
 * Guarda el contexto en un archivo JSON.
 * @param {string} filePath La ruta completa al archivo de contexto.
 * @param {string} content El contenido del contexto como string.
 */
async function saveContext(filePath, content) {
  try {
    const data = JSON.stringify({ text: content.trim() }, null, 2)
    await fs.writeFile(filePath, data, 'utf-8')
    console.log(`Contexto guardado en: ${filePath}`)
  } catch (e) {
    console.error(`Error al guardar el contexto en ${filePath}: ${e.message}`)
    throw e
  }
}

/**
 * Elimina un archivo de contexto.
 * @param {string} filePath La ruta completa al archivo de contexto.
 */
async function deleteContext(filePath) {
  try {
    await fs.unlink(filePath)
    console.log(`Contexto eliminado: ${filePath}`)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(
        `Error al eliminar el contexto de ${filePath}: ${e.message}`
      )
      throw e
    }
    console.log(`El contexto en ${filePath} no existe para eliminar.`)
  }
}

export async function getGeneralContext() {
  await ensureAskVanillaDir()
  return await loadContext(GENERAL_CONTEXT_FILE_PATH)
}

export async function saveGeneralContext(content) {
  await ensureAskVanillaDir()
  await saveContext(GENERAL_CONTEXT_FILE_PATH, content)
}

export async function deleteGeneralContext() {
  await deleteContext(GENERAL_CONTEXT_FILE_PATH)
}

export function getLocalContextFilePath() {
  return path.join(process.cwd(), LOCAL_CONTEXT_FILE_NAME)
}

export async function getLocalContext() {
  return await loadContext(getLocalContextFilePath())
}

export async function saveLocalContext(content) {
  await saveContext(getLocalContextFilePath(), content)
}

export async function deleteLocalContext() {
  await deleteContext(getLocalContextFilePath())
}
