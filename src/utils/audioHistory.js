// src/utils/audioHistory.js
import fs from 'fs'
import path from 'path'

const HISTORY_FILE = path.resolve(process.cwd(), 'audio_history.json')

export function saveAudioHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
}

export function loadAudioHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    } catch (e) {
      return []
    }
  }
  return []
}

export function clearAudioHistory() {
  if (fs.existsSync(HISTORY_FILE)) fs.unlinkSync(HISTORY_FILE)
}
