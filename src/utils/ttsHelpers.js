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
