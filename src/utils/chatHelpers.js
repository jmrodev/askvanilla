import { promises as fs } from 'fs'
import readline from 'readline'
import path from 'path'

export function getUserPrompt(rl, message = 'Tú: ') {
  return new Promise((resolve) => rl.question(message, resolve))
}

export async function getInquirerPrompt(inquirer, message = 'Prompt:') {
  const { prompt } = await inquirer.prompt({
    type: 'input',
    name: 'prompt',
    message,
  })
  return prompt
}

export async function getFilePath(inquirer) {
  const { useFile } = await inquirer.prompt({
    type: 'confirm',
    name: 'useFile',
    message: '¿Adjuntar archivo?',
    default: false,
  })
  if (!useFile) return ''
  const { filePath } = await inquirer.prompt({
    type: 'file-tree-selection',
    name: 'filePath',
    message: 'Selecciona archivo:',
    root: '.',
  })
  return filePath
}

export async function getFileContent(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (e) {
    console.error(`Error leyendo archivo ${filePath}:`, e.message)
    return ''
  }
}

/**
 * Construye el array de 'contents' para la API de Gemini.
 * Esta es la implementación por defecto (para modos sin ContextHistoryManager).
 * @param {string} userPrompt - El texto del prompt del usuario para el turno actual.
 * @param {Array<Object>} history - El historial de conversación actual (hasta el turno anterior).
 * @param {string} fileContent - El contenido de un archivo adjunto para el turno actual.
 * @param {string} combinedContext - El contexto general y local combinado.
 * @returns {Array<Object>} El array de contenidos listo para la API de Gemini.
 */
export function buildContents(
  userPrompt,
  history = [],
  fileContent = '',
  combinedContext = ''
) {
  const contents = []

  if (combinedContext.trim()) {
    contents.push({ role: 'user', parts: [{ text: combinedContext }] })
  }

  if (history && history.length > 0) {
    contents.push(...history)
  }

  const currentUserParts = [{ text: userPrompt }]
  if (fileContent.trim()) {
    currentUserParts.push({
      text: `\`\`\`file_content\n${fileContent}\n\`\`\``,
    })
  }

  contents.push({ role: 'user', parts: currentUserParts })

  return contents
}

/**
 * Muestra la respuesta del modelo en streaming.
 * @param {AsyncIterable} responseStream El stream de respuesta del modelo.
 * @returns {Promise<string>} El texto completo de la respuesta del modelo.
 */
export async function printModelResponse(responseStream) {
  let fullResponseText = ''
  for await (const chunk of responseStream) {
    if (chunk.text) {
      process.stdout.write(chunk.text)
      fullResponseText += chunk.text
    }
  }
  process.stdout.write('\n')
  return fullResponseText
}
