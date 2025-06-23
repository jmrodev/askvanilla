import { promises as fs } from 'fs'
import path from 'path'

const HISTORY_FILE = path.resolve(process.cwd(), 'audio_history.json')

export async function saveAudioHistory(history) {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error al guardar el historial de audio:', e.message)
    throw e
  }
}

export async function loadAudioHistory() {
  try {
    await fs.access(HISTORY_FILE, fs.constants.F_OK)
    const data = await fs.readFile(HISTORY_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    if (e.code === 'ENOENT') {
      return []
    }
    console.error('Error al cargar el historial de audio:', e.message)
    return []
  }
}

export async function clearAudioHistory() {
  try {
    await fs.unlink(HISTORY_FILE)
    console.log(`Historial de audio eliminado: ${HISTORY_FILE}`)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(`Error al limpiar el historial de audio: ${e.message}`)
      throw e
    }
    console.log(
      `El historial de audio en ${HISTORY_FILE} no existe para eliminar.`
    )
  }
}
