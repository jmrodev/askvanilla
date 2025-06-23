import readline from 'readline'
import {
  getUserPrompt,
  buildContents,
  printModelResponse,
} from '../utils/chatHelpers.js'
import { chatAsk } from '../utils/chatAsk.js'

export async function chatModeNoMemory(ai, generateContent) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  await chatAsk({
    getPrompt: () => getUserPrompt(rl),
    buildContents,
    printModelResponse,
    generateContent,
    ai,
  })
  rl.close()
}
