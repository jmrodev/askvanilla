import inquirer from 'inquirer'
import FileTreeSelectionPrompt from 'inquirer-file-tree-selection-prompt'
import fs from 'fs'
import path from 'path'
import { splitText } from '../utils/splitText.js'
import { chooseOutputMode } from '../utils/chooseOutputMode.js'
import { saveAudioFile } from '../utils/saveAudioFile.js'
import { loadAudioHistory, saveAudioHistory } from '../utils/audioHistory.js'
inquirer.registerPrompt('file-tree-selection', FileTreeSelectionPrompt)

export async function chatModeWithMemoryFile(ai, generateContent, generateTTS) {
  const historyFile = path.resolve(process.cwd(), 'chat_history_file.json')
  const audioHistoryFile = path.resolve(
    process.cwd(),
    'audio_history_file.json'
  )
  let history = []
  let audioHistory = []
  // Leer historial si existe
  if (fs.existsSync(historyFile)) {
    try {
      const data = fs.readFileSync(historyFile, 'utf-8')
      history = JSON.parse(data)
    } catch (e) {
      history = []
    }
  }
  if (fs.existsSync(audioHistoryFile)) {
    try {
      audioHistory = loadAudioHistory(audioHistoryFile)
    } catch (e) {
      audioHistory = []
    }
  }

  async function ask() {
    const { prompt } = await inquirer.prompt({
      type: 'input',
      name: 'prompt',
      message: 'Prompt:',
    })
    let filePath = ''
    const { useFile } = await inquirer.prompt({
      type: 'confirm',
      name: 'useFile',
      message: '¿Adjuntar archivo?',
      default: false,
    })
    if (useFile) {
      const fileAnswer = await inquirer.prompt({
        type: 'file-tree-selection',
        name: 'filePath',
        message: 'Selecciona archivo:',
        root: '.',
      })
      filePath = fileAnswer.filePath
    }
    let userText = prompt
    let fileContent = ''
    if (filePath) {
      try {
        fileContent = fs.readFileSync(
          path.resolve(process.cwd(), filePath),
          'utf-8'
        )
      } catch (e) {
        console.log('No se pudo leer el archivo, se omite.')
      }
    }
    if (userText.trim().toLowerCase() === 'salir') {
      // Guardar historial al salir
      try {
        fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf-8')
        saveAudioHistory(audioHistoryFile, audioHistory)
        console.log(`Historial guardado en: ${historyFile}`)
      } catch (e) {}
      return
    }

    // Selección de modo de salida (texto, audio, ambos)
    const outputMode = await chooseOutputMode()

    // Dividir texto largo en partes
    let allParts = []
    if (userText) allParts.push(userText)
    if (fileContent) allParts.push(fileContent)
    // Usar splitText para dividir cada parte si es necesario
    let splitParts = []
    for (const part of allParts) {
      splitParts = splitParts.concat(splitText(part))
    }

    // Reanudar desde la última parte procesada si hay historial
    let startIdx = 0
    if (audioHistory.length > 0) {
      startIdx = audioHistory[audioHistory.length - 1].partIdx + 1
      if (startIdx < splitParts.length) {
        console.log(
          `Reanudando desde la parte ${startIdx + 1} de ${splitParts.length}`
        )
      }
    }

    for (let i = startIdx; i < splitParts.length; i++) {
      const part = splitParts[i]
      const userEntry = { role: 'user', parts: [{ text: part }] }
      history.push(userEntry)
      const contents = [...history]
      let responseText = ''
      // Siempre obtener respuesta de Gemini (texto), aunque solo se quiera audio
      for await (const text of generateContent(ai, contents)) {
        if (outputMode === 'texto' || outputMode === 'ambos') {
          process.stdout.write(text)
        }
        responseText += text
      }
      if (outputMode === 'texto' || outputMode === 'ambos') {
        process.stdout.write('\n')
      }
      // Guardar respuesta en historial
      const modelEntry = { role: 'model', parts: [{ text: responseText }] }
      history.push(modelEntry)
      // TTS: obtener y guardar audio si corresponde
      let audioFilePath = ''
      if (outputMode === 'audio' || outputMode === 'ambos') {
        try {
          const { buffer, extension } = await generateTTS(responseText)
          const audioFileName = `audio_part_${i + 1}.${extension}`
          saveAudioFile(audioFileName, buffer)
          audioFilePath = audioFileName
          console.log(`Audio guardado: ${audioFilePath}`)
        } catch (e) {
          console.log('Error generando audio:', e.message)
        }
      }
      // Actualizar historial de audio/texto
      audioHistory.push({
        partIdx: i,
        prompt: part,
        response: responseText,
        audioFile: audioFilePath,
        timestamp: new Date().toISOString(),
      })
      saveAudioHistory(audioHistoryFile, audioHistory)
      // Persistir historial de chat tras cada parte
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf-8')
    }
    // Mensaje de finalización
    console.log('Conversación finalizada para este prompt/archivo.')
    ask()
  }
  ask()
}
