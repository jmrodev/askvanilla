import { TTS_CHARACTER_LIMIT } from '../../utils/constants.js'

export async function handleTTS({
  responseText,
  generateTTS,
  saveAudioFile,
  audioPrefix = 'audio_part',
  partIdx = 0,
}) {
  if (!responseText) return ''
  try {
    const { buffer, extension } = await generateTTS(responseText)
    const audioFileName = `${audioPrefix}_${partIdx + 1}.${extension}`
    saveAudioFile(audioFileName, buffer)
    console.log(`Audio guardado: ${audioFileName}`)
    return audioFileName
  } catch (e) {
    console.log('Error generando audio:', e.message)
    return ''
  }
}

/**
 * Genera y guarda audio TTS para un texto largo, dividiéndolo en partes si es necesario.
 * @param {string} fullResponseText - El texto completo a convertir en audio.
 * @param {function} generateTTS - Función para generar TTS.
 * @param {function} saveAudioFile - Función para guardar el archivo de audio.
 * @param {string} audioPrefix - Prefijo para los archivos de audio.
 * @param {number} ttsCharacterLimit - Límite de caracteres por chunk.
 */
export async function generateAndSaveTTS(fullResponseText, generateTTS, saveAudioFile, audioPrefix = 'response_part', ttsCharacterLimit = TTS_CHARACTER_LIMIT) {
  const { splitTextForTTS } = await import('../../utils/splitText.js')
  const ttsChunks = splitTextForTTS(fullResponseText, ttsCharacterLimit)
  if (ttsChunks.length > 1) {
    console.log(`Respuesta dividida en ${ttsChunks.length} partes para TTS.`)
  }
  for (let i = 0; i < ttsChunks.length; i++) {
    await handleTTS({
      responseText: ttsChunks[i],
      generateTTS,
      saveAudioFile,
      audioPrefix,
      partIdx: i,
    })
  }
} 