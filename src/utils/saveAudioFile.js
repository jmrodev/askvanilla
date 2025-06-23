import { promises as fs } from 'fs'

/**
 * Guarda un buffer de audio en un archivo.
 * @param {string} fileName
 * @param {Buffer} content
 * @returns {Promise<void>} Una promesa que se resuelve cuando el archivo ha sido escrito.
 */
export async function saveAudioFile(fileName, content) {
  try {
    await fs.writeFile(fileName, content)
    console.log(`Audio guardado: ${fileName}`)
  } catch (err) {
    console.error(`Error guardando audio ${fileName}:`, err)
    throw err
  }
}
