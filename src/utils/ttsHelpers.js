import path from 'path'
import { promises as fs } from 'fs'
import { isValidTtsText, isValidTtsFileContent } from './ttsValidation.js'
// import { buildInputIdentifier } from './ttsHelpers.js' // Eliminado porque es redundante
import { getFilePath, getFileContent } from './inquirerInputHelpers.js'
import { showWarning } from './ttsUserInterface.js'

export async function buildInputIdentifier(inputMethod, prompt, filePath) {
  if (inputMethod === 'type') {
    return 'input_' + Buffer.from(prompt).toString('base64').substring(0, 8)
  } else if (inputMethod === 'file') {
    const stat = await fs.stat(filePath)
    return 'file_' + path.basename(filePath) + '_' + stat.mtimeMs
  }
  return ''
}

export async function getTtsInput(inputMethod) {
  if (inputMethod === 'type') {
    const inquirer = (await import('inquirer')).default
    const { prompt } = await inquirer.prompt({
      type: 'input',
      name: 'prompt',
      message: 'Escribe el texto para TTS (o "salir"):'
    })
    if (prompt.toLowerCase() === 'salir') return { text: '', identifier: '' }
    if (!isValidTtsText(prompt)) {
      showWarning('Por favor, ingresa algún texto válido.')
      return { text: '', identifier: '' }
    }
    const identifier = await buildInputIdentifier('type', prompt)
    return { text: prompt, identifier }
  } else if (inputMethod === 'file') {
    const inquirer = (await import('inquirer')).default
    const filePath = await getFilePath(inquirer)
    if (!filePath) {
      showWarning('No se seleccionó ningún archivo.')
      return { text: '', identifier: '' }
    }
    const fileContent = await getFileContent(filePath)
    if (!isValidTtsFileContent(fileContent)) {
      showWarning('El archivo seleccionado está vacío o solo contiene espacios en blanco.')
      return { text: '', identifier: '' }
    }
    const identifier = await buildInputIdentifier('file', fileContent, filePath)
    return { text: fileContent, identifier }
  }
  return { text: '', identifier: '' }
} 