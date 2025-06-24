import inquirer from 'inquirer'
import path from 'path'

export async function getUserPrompt(rl, message = 'Tú: ') {
  return new Promise((resolve) => rl.question(message, resolve))
}

export async function getInquirerPrompt(inquirerInstance, message = 'Prompt:') {
  const { prompt } = await inquirerInstance.prompt({
    type: 'input',
    name: 'prompt',
    message,
  })
  return prompt
}

export async function getFilePath(inquirerInstance) {
  const { useFile } = await inquirerInstance.prompt({
    type: 'confirm',
    name: 'useFile',
    message: '¿Adjuntar archivo?',
    default: false,
  })
  if (!useFile) return ''
  const { filePath } = await inquirerInstance.prompt({
    type: 'file-tree-selection',
    name: 'filePath',
    message: 'Selecciona archivo:',
    root: '.',
  })
  return filePath
}

export async function getFileContent(filePath) {
  try {
    const fs = await import('fs/promises')
    return await fs.readFile(filePath, 'utf-8')
  } catch (e) {
    console.error(`Error leyendo archivo ${filePath}:`, e.message)
    return ''
  }
} 