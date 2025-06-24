import { promises as fs } from 'fs'
import path from 'path'
import { logWarning } from './chatHelpers.js'

/**
 * Lee el contenido de un archivo de texto.
 * @param {string} filePath
 * @returns {Promise<string>} El contenido del archivo o '' si hay error.
 */
export async function readTextFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (e) {
    logWarning(`Error leyendo archivo ${filePath}: ${e.message}`)
    return ''
  }
}

/**
 * Guarda texto en un archivo.
 * @param {string} filePath
 * @param {string} content
 * @returns {Promise<void>}
 */
export async function writeTextFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
  } catch (e) {
    logWarning(`Error guardando archivo ${filePath}: ${e.message}`)
    throw e
  }
}

/**
 * Verifica si un archivo existe.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Devuelve el nombre base de un archivo.
 * @param {string} filePath
 * @returns {string}
 */
export function getBaseName(filePath) {
  return path.basename(filePath)
} 