import { createGenAIClient } from './client/genaiClient.js'
import { generateContent } from './services/generateContent.js'
import inquirer from 'inquirer'
import { interactiveMode } from './modes/interactive.js'
import { chatModeWithMemory } from './modes/chatWithMemory.js'
import { chatModeNoMemory } from './modes/chatNoMemory.js'
import { parseArgs } from './utils/parseArgs.js'
import { chatModeWithMemoryFile } from './modes/chatWithMemoryFile.js'
import { chatModeNoMemoryFile } from './modes/chatNoMemoryFile.js'
import { generateTTS } from './services/generateTTS.js'
import { pureTTSMode } from './modes/pureTTS.js'
import { manageContextAndHistoryMenu } from './modes/contextHistoryManager.js'

import EditorPrompt from 'inquirer/lib/prompts/editor.js'
inquirer.registerPrompt('editor', EditorPrompt)

const ai = createGenAIClient(process.env.GEMINI_API_KEY)

async function main() {
  let parsed
  try {
    parsed = await parseArgs(process.argv)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
  const { prompt, fileContent } = parsed
  if (fileContent) {
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt || '(sin prompt)' }, { text: fileContent }],
      },
    ]
    for await (const text of generateContent(ai, contents)) {
      process.stdout.write(text)
    }
    process.stdout.write('\n')
    return
  }

  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Selecciona modo:',
      choices: [
        { name: '1) Interactivo', value: '1' },
        { name: '2) Chat con memoria', value: '2' },
        { name: '3) Chat sin memoria', value: '3' },
        { name: '4) Chat con memoria prompt+archivo', value: '4' },
        { name: '5) Chat sin memoria prompt+archivo', value: '5' },
        { name: '6) TTS Directo (Texto a Voz)', value: 'pureTTS' },
        {
          name: '7) Gestionar Contexto e Historial',
          value: 'manageContextHistory',
        },
        { name: 'Salir', value: 'exit' },
      ],
    },
  ])

  if (mode === '2') {
    await chatModeWithMemory(ai, generateContent)
  } else if (mode === '3') {
    await chatModeNoMemory(ai, generateContent)
  } else if (mode === '4') {
    await chatModeWithMemoryFile(ai, generateContent)
  } else if (mode === '5') {
    await chatModeNoMemoryFile(ai, generateContent)
  } else if (mode === 'pureTTS') {
    await pureTTSMode()
  } else if (mode === 'manageContextHistory') {
    await manageContextAndHistoryMenu()
  } else if (mode === '1') {
    await interactiveMode(ai, generateContent)
  } else if (mode === 'exit') {
    console.log('Saliendo de la aplicación. ¡Hasta pronto!')
    process.exit(0)
  } else {
    console.log('Modo no reconocido.')
  }
}

main()
