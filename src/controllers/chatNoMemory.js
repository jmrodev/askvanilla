import readline from 'readline'
import {
  getUserPrompt,
  buildContents,
  printModelResponse,
} from '../utils/chatHelpers.js'
import { chatAsk } from './chatAsk.js'
import { getCombinedContext } from '../utils/contextManager.js'
import { showChatIntroAndContext } from '../utils/chatHelpers.js'
import { addUserMessage, addModelMessage } from '../utils/chatHistory.js'

export async function chatModeNoMemory(ai, generateContent) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  // Historial solo en memoria
  let history = []
  await chatAsk({
    getPrompt: () => getUserPrompt(rl),
    buildContents: (userPrompt, _history, fileContent, combinedContext) => buildContents(userPrompt, history, fileContent, combinedContext),
    printModelResponse,
    generateContent,
    ai,
    history,
    // No saveHistory ni exitMessage
    getCombinedContext,
    showChatIntroAndContext,
    addUserMessage,
    addModelMessage,
  })
  rl.close()
} 