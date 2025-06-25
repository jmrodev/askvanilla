import { promises as fs } from 'fs'
import path from 'path'

/**
 * Carga el progreso desde un archivo JSON.
 * @param {string} progressFileName - Nombre del archivo de progreso.
 * @param {object} defaultProgress - Objeto de progreso por defecto si no existe el archivo.
 * @returns {Promise<object>} El objeto de progreso.
 */
export async function loadProgress(progressFileName = '.tts_progress.json', defaultProgress = { textHash: '', completedParts: [], tempFiles: [] }) {
  const filePath = path.join(process.cwd(), progressFileName)
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    return { ...defaultProgress }
  }
}

/**
 * Guarda el progreso en un archivo JSON.
 * @param {object} progress - El objeto de progreso a guardar.
 * @param {string} progressFileName - Nombre del archivo de progreso.
 * @returns {Promise<void>}
 */
export async function saveProgress(progress, progressFileName = '.tts_progress.json') {
  const filePath = path.join(process.cwd(), progressFileName)
  await fs.writeFile(filePath, JSON.stringify(progress, null, 2), 'utf-8')
} 