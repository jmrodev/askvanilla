import { splitTextForTTS } from '../../utils/splitText.js'
import { loadProgress, saveProgress } from '../../utils/progressManager.js'
import { generateAndSaveAudioPart } from './ttsHelpers.js'
import { showPartInfo, showSuccess } from '../../utils/ttsUserInterface.js'
import { TTS_OUTPUT_EXTENSION, TTS_PROGRESS_FILE } from '../../config/ttsConfig.js'

export async function runTTSSession(rawTextToConvert, inputIdentifier, charLimit) {
  const textParts = splitTextForTTS(rawTextToConvert, charLimit)
  if (textParts.length === 0) {
    return { warning: 'El texto no contiene contenido procesable.' }
  }
  let progress = await loadProgress(TTS_PROGRESS_FILE)
  if (progress.textHash !== inputIdentifier) {
    progress = { textHash: inputIdentifier, completedParts: [], tempFiles: [] }
    await saveProgress(progress, TTS_PROGRESS_FILE)
  }
  for (let i = 0; i < textParts.length; i++) {
    if (progress.completedParts.includes(i)) {
      showPartInfo(i, textParts.length)
      continue
    }
    const tempFilePath = await generateAndSaveAudioPart(textParts[i], i, TTS_OUTPUT_EXTENSION)
    progress.tempFiles.push(tempFilePath)
    progress.completedParts.push(i)
    await saveProgress(progress, TTS_PROGRESS_FILE)
    showSuccess(`Parte ${i + 1}/${textParts.length} generada correctamente.`)
  }
  progress.completedParts = []
  progress.tempFiles = []
  await saveProgress(progress, TTS_PROGRESS_FILE)
  return { success: true }
} 