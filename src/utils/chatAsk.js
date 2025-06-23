
import { getLocalContext, getGeneralContext } from './contextManager.js'
import { splitTextForTTS } from './splitText.js'

import inquirer from 'inquirer'
import path from 'path'

export async function chatAsk({
  getPrompt,
  buildContents,
  printModelResponse,
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
}) {
  const rl =
    typeof getPrompt === 'function' && getPrompt.name === 'getUserPrompt'
      ? getPrompt.__rl
      : null

  const generalContext = await getGeneralContext()
  const localContext = await getLocalContext()

  const combinedContext = [generalContext, localContext]
    .filter(Boolean)
    .join('\n\n')

  console.log('Iniciando chat. Escribe "salir" para terminar.')
  if (combinedContext) {
    console.log(`\n--- Contexto Aplicado ---`)
    console.log(combinedContext)
    console.log(`--- Fin Contexto ---\n`)
  }

  const loop = async () => {
    let userPrompt
    let fileContent = ''
    let filePath = ''

    if (getFilePath && getFileContent) {
      const { useFile } = await inquirer.prompt({
        type: 'confirm',
        name: 'useFile',
        message: '¿Adjuntar archivo?',
        default: false,
      })

      if (useFile) {
        filePath = await getFilePath(inquirer)
        if (filePath) {
          try {
            fileContent = await getFileContent(filePath)
            console.log(`Archivo "${filePath}" cargado.`)
          } catch (e) {
            console.error(`Error al leer archivo ${filePath}: ${e.message}`)
            fileContent = ''
          }
        }
      }
    }

    userPrompt = await getPrompt()

    if (userPrompt.toLowerCase() === 'salir') {
      if (saveHistory) {
        await saveHistory(history)
        console.log(exitMessage)
      }
      return
    }

    if (!userPrompt.trim() && !fileContent.trim()) {
      console.log('Por favor, ingresa un prompt o selecciona un archivo.')
      return loop()
    }

    let fullResponseText = ''

    try {
      const contentsForAPI = buildContents(
        userPrompt,
        history,
        fileContent,
        combinedContext
      )

      const responseStream = generateContent(ai, contentsForAPI)

      if (outputMode === 'texto' || outputMode === 'ambos') {
        process.stdout.write('Modelo: ')
      }

      for await (const chunk of responseStream) {
        if (chunk.text) {
          if (outputMode === 'texto' || outputMode === 'ambos') {
            process.stdout.write(chunk.text)
          }
          fullResponseText += chunk.text
        }
      }
      if (outputMode === 'texto' || outputMode === 'ambos') {
        process.stdout.write('\n')
      }

      const userPartsForHistory = [{ text: userPrompt }]
      if (fileContent.trim()) {
        const historyFileDisplayLimit = 2000
        const fileForHistoryDisplay =
          fileContent.length > historyFileDisplayLimit
            ? `[Archivo Adjunto: ${path.basename(filePath || 'N/A')} - ${
                fileContent.length
              } caracteres truncados para historial]\n\`\`\`\n${fileContent.substring(
                0,
                historyFileDisplayLimit
              )}...\n\`\`\``
            : `[Archivo Adjunto: ${path.basename(
                filePath || 'N/A'
              )}]\n\`\`\`\n${fileContent}\n\`\`\``

        userPartsForHistory.push({ text: fileForHistoryDisplay })
      }

      history.push({ role: 'user', parts: userPartsForHistory })

      if (fullResponseText.trim().length > 0) {
        history.push({ role: 'model', parts: [{ text: fullResponseText }] })
      } else {
        history.push({
          role: 'model',
          parts: [{ text: '[No response from model]' }],
        })
      }

      if (
        (outputMode === 'audio' || outputMode === 'ambos') &&
        fullResponseText.trim().length > 0
      ) {
        console.log('Generando audio...')
        const TTS_CHARACTER_LIMIT = 4500
        const ttsChunks = splitTextForTTS(fullResponseText, TTS_CHARACTER_LIMIT)

        if (ttsChunks.length > 1) {
          console.log(
            `Respuesta dividida en ${ttsChunks.length} partes para TTS.`
          )
        }

        for (let i = 0; i < ttsChunks.length; i++) {
          await handleTTS({
            responseText: ttsChunks[i],
            generateTTS,
            saveAudioFile,
            audioPrefix: `response_part_${Date.now()}`,
            partIdx: i,
          })
        }
      }
    } catch (error) {
      console.error('Error durante la conversación:', error.message)
    }

    await loop()
  }

  await loop()

  if (rl && typeof rl.close === 'function') {
    rl.close()
  }
}
