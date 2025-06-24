import inquirer from 'inquirer'
import path from 'path'
import { promises as fs } from 'fs'

/**
 * Obtiene el prompt del usuario usando inquirer.
 * @param {object} inquirerInstance
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function getInquirerPrompt(inquirerInstance = inquirer, message = 'Prompt:') {
  const { prompt } = await inquirerInstance.prompt({
    type: 'input',
    name: 'prompt',
    message,
  })
  return prompt
}

/**
 * Permite seleccionar un archivo usando inquirer-file-tree-selection-prompt.
 * @param {object} inquirerInstance
 * @returns {Promise<string>}
 */
export async function getFilePath(inquirerInstance = inquirer) {
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

/**
 * Lee el contenido de un archivo de texto.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function getFileContent(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (e) {
    console.error(`Error leyendo archivo ${filePath}:`, e.message)
    return ''
  }
} 