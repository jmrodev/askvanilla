// src/index.js
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

const ai = createGenAIClient(process.env.GEMINI_API_KEY)

async function main() {
  // Modularizado: parsear argumentos y archivo
  let parsed
  try {
    parsed = parseArgs(process.argv)
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
  // Menú interactivo con inquirer
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
      ],
    },
  ])
  if (mode === '2') {
    await chatModeWithMemory(ai, generateContent)
  } else if (mode === '3') {
    await chatModeNoMemory(ai, generateContent)
  } else if (mode === '4') {
    await chatModeWithMemoryFile(ai, generateContent, generateTTS)
  } else if (mode === '5') {
    await chatModeNoMemoryFile(ai, generateContent)
  } else {
    await interactiveMode(ai, generateContent)
  }
}

main()
