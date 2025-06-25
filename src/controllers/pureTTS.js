import { promptInputMethod, showSessionStart, showSessionEnd } from '../utils/ttsUserInterface.js'
import { getTtsInput } from '../utils/ttsHelpers.js'
import { runTTSSession } from '../services/tts/ttsSessionManager.js'
import { TTS_CHARACTER_LIMIT } from '../config/ttsConfig.js'

export async function pureTTSMode() {
  showSessionStart()
  while (true) {
    const { inputMethod } = await promptInputMethod()
    if (inputMethod === 'exit') break
    const { text: rawTextToConvert, identifier: inputIdentifier } = await getTtsInput(inputMethod)
    if (!rawTextToConvert) continue
    await runTTSSession(rawTextToConvert, inputIdentifier, TTS_CHARACTER_LIMIT)
  }
  showSessionEnd()
} 