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
