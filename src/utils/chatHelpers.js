import { promises as fs } from 'fs'
import readline from 'readline'
import path from 'path'
import inquirer from 'inquirer'

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
 * @param {boolean} debug - Si es true, imprime el historial y el array contents generado para depuración de memoria conversacional.
 * @returns {Array<Object>} El array de contenidos listo para la API de Gemini.
 */
export function buildContents(
  userPrompt,
  history = [],
  fileContent = '',
  combinedContext = '',
  debug = false
) {
  const contents = []

  if (combinedContext.trim()) {
    contents.push({ role: 'user', parts: [{ text: combinedContext }] })
  }

  if (history && history.length > 0) {
    if (debug) {
      console.log('DEBUG HISTORY EN buildContents:', JSON.stringify(history, null, 2))
    }
    contents.push(...history)
  }

  const currentUserParts = [{ text: userPrompt }]
  if (fileContent.trim()) {
    currentUserParts.push({
      text: `\`\`\`file_content\n${fileContent}\n\`\`\``,
    })
  }

  contents.push({ role: 'user', parts: currentUserParts })

  if (debug) {
    console.log('DEBUG CONTENTS EN buildContents:', JSON.stringify(contents, null, 2))
  }

  return contents
}

/**
 * Muestra la respuesta del modelo en streaming según el modo de salida.
 * @param {AsyncIterable} responseStream El stream de respuesta del modelo.
 * @param {string} outputMode 'texto', 'audio' o 'ambos'.
 * @param {boolean} debug - Si es true, imprime cada chunk recibido con console.log('CHUNK RECIBIDO:', chunk).
 * @returns {Promise<string>} El texto completo de la respuesta del modelo.
 */
export async function printModelResponse(responseStream, outputMode = 'texto', debug = false) {
  let fullResponseText = ''
  if (outputMode === 'texto' || outputMode === 'ambos') {
    process.stdout.write('Modelo: ')
  }
  for await (const chunk of responseStream) {
    if (debug) {
      console.log('CHUNK RECIBIDO:', chunk)
    }
    if (chunk) {
      if (outputMode === 'texto' || outputMode === 'ambos') {
        process.stdout.write(chunk)
      }
      fullResponseText += chunk
    }
  }
  if (outputMode === 'texto' || outputMode === 'ambos') {
    process.stdout.write('\n')
  }
  return fullResponseText
}

/**
 * Muestra y formatea errores durante la conversación.
 * @param {Error} error - El error capturado.
 * @param {string} [context] - Contexto opcional para el error.
 */
export function logChatError(error, context = 'Error durante la conversación') {
  if (error && error.message) {
    console.error(`[${context}]: ${error.message}`)
  } else {
    console.error(`[${context}]:`, error)
  }
}

/**
 * Valida si un prompt es válido (no vacío ni solo espacios).
 * @param {string} prompt
 * @returns {boolean}
 */
export function isValidPrompt(prompt) {
  return typeof prompt === 'string' && prompt.trim().length > 0
}

/**
 * Valida si el contenido de un archivo es válido (no vacío ni solo espacios).
 * @param {string} fileContent
 * @returns {boolean}
 */
export function isValidFileContent(fileContent) {
  return typeof fileContent === 'string' && fileContent.trim().length > 0
}

/**
 * Muestra un mensaje informativo en consola.
 * @param {string} msg
 */
export function logInfo(msg) {
  console.log(`ℹ️  ${msg}`)
}

/**
 * Muestra un mensaje de advertencia en consola.
 * @param {string} msg
 */
export function logWarning(msg) {
  console.warn(`⚠️  ${msg}`)
}

/**
 * Muestra un mensaje de éxito en consola.
 * @param {string} msg
 */
export function logSuccess(msg) {
  console.log(`✅ ${msg}`)
}

/**
 * Muestra el mensaje de inicio y el contexto combinado al usuario.
 * @param {function} getCombinedContext - Función async que retorna el contexto combinado.
 * @param {string} introMsg - Mensaje de introducción.
 */
export async function showChatIntroAndContext(getCombinedContext, introMsg = 'Iniciando chat. Escribe "salir" para terminar.') {
  logInfo(introMsg)
  const combinedContext = await getCombinedContext()
  if (combinedContext) {
    logInfo('\n--- Contexto Aplicado ---')
    logInfo(combinedContext)
    logInfo('--- Fin Contexto ---\n')
  }
}

/**
 * Gestiona la lógica de preguntar al usuario si quiere adjuntar un archivo y leerlo.
 * @param {function} getFilePathFn - Función para seleccionar el archivo.
 * @param {function} getFileContentFn - Función para leer el archivo.
 * @param {object} inquirerInstance - Instancia de inquirer.
 * @returns {Promise<{filePath: string, fileContent: string}>}
 */
export async function getUserFileAttachment(getFilePathFn, getFileContentFn, inquirerInstance) {
  let filePath = ''
  let fileContent = ''
  if (getFilePathFn && getFileContentFn) {
    const { useFile } = await inquirerInstance.prompt({
      type: 'confirm',
      name: 'useFile',
      message: '¿Adjuntar archivo?',
      default: false,
    })
    if (useFile) {
      filePath = await getFilePathFn(inquirerInstance)
      if (filePath) {
        try {
          fileContent = await getFileContentFn(filePath)
          logSuccess(`Archivo "${filePath}" cargado.`)
        } catch (e) {
          logWarning(`Error al leer archivo ${filePath}: ${e.message}`)
          fileContent = ''
        }
      }
    }
  }
  return { filePath, fileContent }
}

/**
 * Valida si hay un prompt válido o un archivo válido.
 * @param {string} userPrompt
 * @param {string} fileContent
 * @returns {boolean}
 */
export function hasValidPromptOrFile(userPrompt, fileContent) {
  return isValidPrompt(userPrompt) || isValidFileContent(fileContent)
}

/**
 * Maneja la salida anticipada del chat.
 * @param {string} userPrompt
 * @param {function} saveHistory
 * @param {Array} history
 * @param {string} exitMessage
 * @returns {Promise<boolean>} true si se debe salir, false si no.
 */
export async function handleExit(userPrompt, saveHistory, history, exitMessage) {
  if (userPrompt.toLowerCase() === 'salir') {
    if (saveHistory) {
      await saveHistory(history)
      logSuccess(exitMessage)
    }
    return true
  }
  return false
}

/**
 * Procesa el turno del usuario: construye el contenido, obtiene la respuesta y actualiza el historial.
 */
export async function processUserTurn({
  userPrompt,
  fileContent,
  filePath,
  buildContents,
  history,
  combinedContext,
  generateContent,
  ai,
  printModelResponse,
  outputMode,
  addUserMessage,
  addModelMessage
}) {
  const contentsForAPI = buildContents(
    userPrompt,
    history,
    fileContent,
    combinedContext
  )
  const responseStream = generateContent(ai, contentsForAPI)
  const fullResponseText = await printModelResponse(responseStream, outputMode)
  addUserMessage(history, userPrompt, fileContent, filePath)
  addModelMessage(history, fullResponseText)
  return fullResponseText
}

/**
 * Maneja la salida de TTS si corresponde.
 */
export async function handleTTSOutput(fullResponseText, outputMode, generateTTS, saveAudioFile, generateAndSaveTTS) {
  if ((outputMode === 'audio' || outputMode === 'ambos') && fullResponseText.trim().length > 0) {
    logInfo('Generando audio...')
    await generateAndSaveTTS(fullResponseText, generateTTS, saveAudioFile)
  }
}

/**
 * Cierra la instancia de readline si existe.
 */
export function closeReadline(rl) {
  if (rl && typeof rl.close === 'function') {
    rl.close()
  }
}

/**
 * Ejecuta el ciclo principal del chat.
 */
export async function runChatLoop({
  getPrompt,
  buildContents,
  generateContent,
  ai,
  history = [],
  saveHistory,
  exitMessage = '',
  getFilePath,
  getFileContent,
  outputMode,
  contextManager,
  generateTTS,
  saveAudioFile,
  handleTTS,
  rl,
  combinedContext,
  printModelResponse,
  addUserMessage,
  addModelMessage,
  generateAndSaveTTS
}) {
  const loop = async () => {
    let userPrompt
    let fileContent = ''
    let filePath = ''
    const { filePath: attachedFilePath, fileContent: attachedFileContent } = await getUserFileAttachment(getFilePath, getFileContent, inquirer)
    filePath = attachedFilePath
    fileContent = attachedFileContent
    userPrompt = await getPrompt()
    if (await handleExit(userPrompt, saveHistory, history, exitMessage)) {
      return
    }
    if (!isValidPrompt(userPrompt) && !isValidFileContent(fileContent)) {
      logWarning('Por favor, ingresa un prompt o selecciona un archivo.')
      return loop()
    }
    let fullResponseText = ''
    try {
      fullResponseText = await processUserTurn({
        userPrompt,
        fileContent,
        filePath,
        buildContents,
        history,
        combinedContext,
        generateContent,
        ai,
        printModelResponse,
        outputMode,
        addUserMessage,
        addModelMessage
      })
      await handleTTSOutput(fullResponseText, outputMode, generateTTS, saveAudioFile, generateAndSaveTTS)
    } catch (error) {
      logChatError(error)
    }
    await loop()
  }
  await loop()
  closeReadline(rl)
}

/**
 * Maneja el flujo cuando se pasa un archivo por línea de comandos junto con un prompt.
 * @param {object} params
 * @param {object} params.ai - Instancia del cliente AI
 * @param {string} params.prompt - El prompt del usuario
 * @param {string} params.fileContent - El contenido del archivo
 * @param {function} params.generateContent - Función para generar contenido
 */
export async function handlePromptWithFile({ ai, prompt, fileContent, generateContent }) {
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
}

/**
 * Despacha el modo de conversación seleccionado y ejecuta el controlador correspondiente.
 * @param {object} params
 * @param {string} params.mode - Modo seleccionado
 * @param {object} params.ai - Instancia del cliente AI
 * @param {function} params.generateContent - Función para generar contenido
 * @param {object} params.chatModes - Objeto con los controladores de modos
 */
export async function handleConversationMode({ mode, ai, generateContent, chatModes }) {
  switch (mode) {
    case '2':
      await chatModes.chatModeWithMemory(ai, generateContent)
      break
    case '3':
      await chatModes.chatModeNoMemory(ai, generateContent)
      break
    case '4':
      await chatModes.chatModeWithMemoryFile(ai, generateContent)
      break
    case '5':
      await chatModes.chatModeNoMemoryFile(ai, generateContent)
      break
    case 'pureTTS':
      await chatModes.pureTTSMode()
      break
    case 'manageContextHistory':
      await chatModes.manageContextAndHistoryMenu()
      break
    case '1':
      await chatModes.interactiveMode(ai, generateContent)
      break
    case 'exit':
      console.log('Saliendo de la aplicación. ¡Hasta pronto!')
      process.exit(0)
      break
    default:
      console.log('Modo no reconocido.')
  }
}

/**
 * Registra un handler para SIGINT (Ctrl+C) que guarda el historial antes de salir.
 * @param {string} historyFile - Ruta del archivo de historial.
 * @param {Array} history - Historial de la conversación.
 * @param {function} saveHistory - Función para guardar el historial.
 * @returns {function} La función handler registrada (útil para quitar el handler después).
 */
export function registerHistorySigintHandler(historyFile, history, saveHistory) {
  const sigintHandler = async () => {
    try {
      await saveHistory(historyFile, history)
      console.log('\n✅ Historial guardado correctamente antes de salir (Ctrl+C)')
    } catch (e) {
      console.warn('\n⚠️  No se pudo guardar el historial antes de salir:', e.message)
    }
    process.exit(0)
  }
  process.on('SIGINT', sigintHandler)
  return sigintHandler
}
