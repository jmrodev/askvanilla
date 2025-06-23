import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.askvanilla_config')
const GLOBAL_CONTEXT_FILE = path.join(GLOBAL_CONFIG_DIR, 'global_context.txt')

/**
 * Asegura que el directorio de configuración global exista.
 */
async function ensureGlobalConfigDirExists() {
  try {
    await fs.mkdir(GLOBAL_CONFIG_DIR, { recursive: true })
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.error(
        'Error al crear el directorio de configuración global:',
        e.message
      )
      throw e
    }
  }
}

/**
 * Carga el contexto global del sistema.
 * @returns {Promise<string>} Contenido del contexto global o cadena vacía si no existe/error.
 */
export async function loadGlobalContext() {
  try {
    await fs.access(GLOBAL_CONTEXT_FILE, fs.constants.F_OK)
    return await fs.readFile(GLOBAL_CONTEXT_FILE, 'utf-8')
  } catch (e) {
    if (e.code === 'ENOENT') {
      return ''
    }
    console.error('Error al cargar el contexto global:', e.message)
    return ''
  }
}

/**
 * Guarda el contexto global del sistema.
 * @param {string} contextText - El texto a guardar como contexto global.
 * @returns {Promise<void>}
 */
export async function saveGlobalContext(contextText) {
  try {
    await ensureGlobalConfigDirExists()
    await fs.writeFile(GLOBAL_CONTEXT_FILE, contextText, 'utf-8')
    console.log(`Contexto global guardado en: ${GLOBAL_CONTEXT_FILE}`)
  } catch (e) {
    console.error('Error al guardar el contexto global:', e.message)
    throw e
  }
}

/**
 * Elimina el contexto global del sistema.
 * @returns {Promise<void>}
 */
export async function deleteGlobalContext() {
  try {
    await fs.unlink(GLOBAL_CONTEXT_FILE)
    console.log('Contexto global eliminado.')
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('El contexto global no existe para eliminar.')
    } else {
      console.error('Error al eliminar el contexto global:', e.message)
      throw e
    }
  }
}
