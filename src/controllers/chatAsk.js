import { getLocalContext, getGeneralContext, getCombinedContext } from '../utils/contextManager.js'
import { splitTextForTTS } from '../utils/splitText.js'
import { getUserPrompt, getInquirerPrompt, getFilePath, getFileContent } from './userInput.js'
import { addUserMessage, addModelMessage } from '../utils/chatHistory.js'
import { printModelResponse, logChatError, isValidPrompt, isValidFileContent, logInfo, logWarning, logSuccess, showChatIntroAndContext, getUserFileAttachment, hasValidPromptOrFile, runChatLoop } from '../utils/chatHelpers.js'
import { generateAndSaveTTS } from '../services/tts/ttsHelpers.js'
import inquirer from 'inquirer'
import path from 'path'

export async function chatAsk(params) {
  // Preparar rl y contexto combinado
  const rl =
    typeof params.getPrompt === 'function' && params.getPrompt.name === 'getUserPrompt'
      ? params.getPrompt.__rl
      : null
  const combinedContext = await params.getCombinedContext()
  await params.showChatIntroAndContext(params.getCombinedContext)
  // Ejecutar el ciclo principal usando el helper
  await runChatLoop({
    ...params,
    rl,
    combinedContext
  })
} 