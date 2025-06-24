import { promises as fs } from 'fs'
import path from 'path'

export function getHistoryFilePath(filename = 'chat_history.json') {
  return path.resolve(process.cwd(), filename)
}

export async function loadHistory(historyFile) {
  try {
    await fs.access(historyFile, fs.constants.F_OK)
    const data = await fs.readFile(historyFile, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    if (e.code === 'ENOENT') {
      return []
    }
    console.error('Error al cargar el historial de chat:', e.message)
    return []
  }
}

export async function saveHistory(historyFile, history) {
  try {
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error al guardar el historial de chat:', e.message)
    throw e
  }
}

// --- NUEVA FUNCIÓN ---
export async function clearHistory(historyFile) {
  try {
    await fs.unlink(historyFile)
    console.log(`Historial de chat eliminado: ${historyFile}`)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(
        `Error al eliminar historial de chat ${historyFile}: ${e.message}`
      )
      throw e
    }
    console.log(
      `El historial de chat en ${historyFile} no existe para eliminar.`
    )
  }
}

/**
 * Añade un mensaje de usuario al historial.
 * @param {Array} history - El historial de la conversación.
 * @param {string} userPrompt - El texto del usuario.
 * @param {string} fileContent - El contenido del archivo adjunto.
 * @param {string} filePath - La ruta del archivo adjunto.
 */
export function addUserMessage(history, userPrompt, fileContent = '', filePath = '') {
  const userPartsForHistory = [{ text: userPrompt }]
  if (fileContent && fileContent.trim()) {
    userPartsForHistory.push({ text: formatUserMessageWithFile(fileContent, filePath) })
  }
  history.push({ role: 'user', parts: userPartsForHistory })
}

/**
 * Añade un mensaje del modelo al historial.
 * @param {Array} history - El historial de la conversación.
 * @param {string} modelText - El texto de respuesta del modelo.
 */
export function addModelMessage(history, modelText) {
  if (modelText && modelText.trim().length > 0) {
    history.push({ role: 'model', parts: [{ text: modelText }] })
  } else {
    history.push({ role: 'model', parts: [{ text: '[No response from model]' }] })
  }
}

/**
 * Formatea el mensaje de usuario con archivo adjunto para el historial.
 * @param {string} fileContent - El contenido del archivo adjunto.
 * @param {string} filePath - La ruta del archivo adjunto.
 * @returns {string} - El texto formateado para el historial.
 */
export function formatUserMessageWithFile(fileContent, filePath = '') {
  const historyFileDisplayLimit = 2000
  if (fileContent.length > historyFileDisplayLimit) {
    return `[Archivo Adjunto: ${path.basename(filePath || 'N/A')} - ${fileContent.length} caracteres truncados para historial]\n\n${fileContent.substring(0, historyFileDisplayLimit)}...\n\n`
  } else {
    return `[Archivo Adjunto: ${path.basename(filePath || 'N/A')}]\n\n${fileContent}\n\n`
  }
}
