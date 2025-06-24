import readline from 'readline'
import path from 'path'
import {
  getUserPrompt,
  buildContents,
  printModelResponse,
  registerHistorySigintHandler,
} from '../utils/chatHelpers.js'
import { chatAsk } from './chatAsk.js'
import {
  getHistoryFilePath,
  loadHistory,
  saveHistory,
  addUserMessage,
  addModelMessage,
} from '../utils/chatHistory.js'
import { getCombinedContext } from '../utils/contextManager.js'
import { showChatIntroAndContext } from '../utils/chatHelpers.js'

export async function chatModeWithMemory(ai, generateContent) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const historyFile = getHistoryFilePath('chat_history.json')
  let history = await loadHistory(historyFile)
  const debug = process.argv.includes('--debug')

  // Handler para Ctrl+C (SIGINT)
  const sigintHandler = registerHistorySigintHandler(historyFile, history, saveHistory)

  await chatAsk({
    getPrompt: () => getUserPrompt(rl),
    buildContents: (userPrompt, history, fileContent, combinedContext) => buildContents(userPrompt, history, fileContent, combinedContext, debug),
    printModelResponse: (stream, mode) => printModelResponse(stream, mode, debug),
    generateContent: (ai, contents) => generateContent(ai, contents, debug),
    ai,
    history,
    saveHistory: (h) => saveHistory(historyFile, h),
    exitMessage: `Historial guardado en: ${historyFile}`,
    getCombinedContext,
    showChatIntroAndContext,
    addUserMessage,
    addModelMessage,
    outputMode: 'texto',
  })
  rl.close()
  process.off('SIGINT', sigintHandler)
} 