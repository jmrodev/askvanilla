// src/utils/saveAudioFile.js
import fs from 'fs'

/**
 * Guarda un buffer de audio en un archivo.
 * @param {string} fileName
 * @param {Buffer} content
 */
export function saveAudioFile(fileName, content) {
  fs.writeFileSync(fileName, content)
  console.log(`Audio guardado: ${fileName}`)
}
