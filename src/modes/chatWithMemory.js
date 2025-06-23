import readline from 'readline'
import path from 'path'
import {
  getUserPrompt,
  buildContents,
  printModelResponse,
} from '../utils/chatHelpers.js'
import { chatAsk } from '../utils/chatAsk.js'
import {
  getHistoryFilePath,
  loadHistory,
  saveHistory,
} from '../utils/chatHistory.js'

export async function chatModeWithMemory(ai, generateContent) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const historyFile = getHistoryFilePath('chat_history.json')
  let history = await loadHistory(historyFile)
  await chatAsk({
    getPrompt: () => getUserPrompt(rl),
    buildContents,
    printModelResponse,
    generateContent,
    ai,
    history,
    saveHistory: (h) => saveHistory(historyFile, h),
    exitMessage: `Historial guardado en: ${historyFile}`,
  })
  rl.close()
}
