import inquirer from 'inquirer'
import FileTreeSelectionPrompt from 'inquirer-file-tree-selection-prompt'
import {
  getInquirerPrompt,
  getFilePath,
  getFileContent,
  printModelResponse,
} from '../utils/chatHelpers.js'
import { chatAsk } from '../utils/chatAsk.js'
import {
  getHistoryFilePath,
  loadHistory,
  saveHistory,
} from '../utils/chatHistory.js'
import { chooseOutputMode } from '../utils/chooseOutputMode.js'
import { generateTTS } from '../services/generateTTS.js'
import { saveAudioFile } from '../utils/saveAudioFile.js'
import { handleTTS } from '../utils/ttsHelpers.js'
import { ContextHistoryManager } from './contextHistoryManager.js'
import { splitTextForLLMs } from '../utils/splitText.js'

inquirer.registerPrompt('file-tree-selection', FileTreeSelectionPrompt)

const MAX_FILE_PART_CHARS_FOR_LLM = 100 * 1024

export async function chatModeWithMemoryFile(ai, generateContent) {
  const historyFile = getHistoryFilePath('chat_memory_file_history.json')
  let history = await loadHistory(historyFile)

  const contextManager = new ContextHistoryManager(history)

  await chatAsk({
    getPrompt: () => getInquirerPrompt(inquirer),
    getFilePath: () => getFilePath(inquirer),
    getFileContent,
    buildContents: (
      userPrompt,
      chatAskHistory,
      fileContent,
      combinedContext
    ) => {
      const currentUserTurnParts = []
      if (userPrompt) {
        currentUserTurnParts.push({ text: userPrompt })
      }

      if (fileContent && fileContent.trim().length > 0) {
        currentUserTurnParts.push({ text: `[Archivo Adjunto]\n` })

        const fileContentChunks = splitTextForLLMs(
          fileContent,
          0,
          MAX_FILE_PART_CHARS_FOR_LLM
        )

        if (fileContentChunks.length > 1) {
          console.log(
            `El contenido del archivo se ha dividido en ${fileContentChunks.length} partes para el LLM.`
          )
        }

        fileContentChunks.forEach((chunk, index) => {
          currentUserTurnParts.push({
            text: `\`\`\`file_part_${index + 1}\n${chunk}\n\`\`\``,
          })
        })
      }

      let contents = contextManager.manageContext(
        combinedContext,
        chatAskHistory
      )

      contents.push({ role: 'user', parts: currentUserTurnParts })

      if (!Array.isArray(contents)) {
        console.error('----------------------------------------------------')
        console.error(
          'ERROR CRÍTICO: ContextHistoryManager.manageContext o la construcción final no devolvió un array.'
        )
        console.error('Tipo de dato devuelto:', typeof contents)
        console.error('Valor devuelto:', contents)
        console.error(
          'Revisa la implementación de ContextHistoryManager.manageContext y el override de buildContents.'
        )
        console.error('----------------------------------------------------')
        throw new Error(
          'El gestor de contexto o buildContents devolvió un valor no iterable para "contents".'
        )
      }

      return contents
    },
    printModelResponse,
    generateContent,
    generateTTS,
    saveAudioFile,
    handleTTS,
    ai,
    history: contextManager.history,
    saveHistory: (h) => saveHistory(historyFile, h),
    exitMessage: `Historial y contexto guardados en: ${historyFile}`,
    outputMode: await chooseOutputMode(),
    contextManager,
  })
}
