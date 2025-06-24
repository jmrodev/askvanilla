import { createGenAIClient } from './client/genaiClient.js'
import { generateContent } from './services/generateContent.js'
import inquirer from 'inquirer'
import { interactiveMode } from './controllers/interactive.js'
import { chatModeWithMemory } from './controllers/chatWithMemory.js'
import { chatModeNoMemory } from './controllers/chatNoMemory.js'
import { parseArgs } from './utils/parseArgs.js'
import { chatModeWithMemoryFile } from './controllers/chatWithMemoryFile.js'
import { chatModeNoMemoryFile } from './controllers/chatNoMemoryFile.js'
import { generateTTS } from './services/generateTTS.js'
import { pureTTSMode } from './controllers/pureTTS.js'
import { manageContextAndHistoryMenu } from './controllers/contextHistoryManager.js'
import { selectConversationMode } from './controllers/selectConversationMode.js'
import { handlePromptWithFile, handleConversationMode } from './utils/chatHelpers.js'

import EditorPrompt from 'inquirer/lib/prompts/editor.js'
inquirer.registerPrompt('editor', EditorPrompt)

const ai = createGenAIClient(process.env.GEMINI_API_KEY)

async function main() {
  let parsed
  const debug = process.argv.includes('--debug')
  try {
    parsed = await parseArgs(process.argv)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
  const { prompt, fileContent } = parsed
  if (fileContent) {
    await handlePromptWithFile({
      ai,
      prompt,
      fileContent,
      generateContent: (ai, contents) => generateContent(ai, contents, debug),
      printModelResponse: (stream, mode) => printModelResponse(stream, mode, debug),
    })
    return
  }

  const mode = await selectConversationMode()

  await handleConversationMode({
    mode,
    ai,
    generateContent: (ai, contents) => generateContent(ai, contents, debug),
    printModelResponse: (stream, mode) => printModelResponse(stream, mode, debug),
    chatModes: {
      chatModeWithMemory,
      chatModeNoMemory,
      chatModeWithMemoryFile,
      chatModeNoMemoryFile,
      pureTTSMode,
      manageContextAndHistoryMenu,
      interactiveMode
    }
  })
}

main()
