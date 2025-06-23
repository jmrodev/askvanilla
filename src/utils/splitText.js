
/**
 * Divide un texto en partes de máximo n líneas o n caracteres.
 * Diseñada para preparar prompts o respuestas para Modelos de Lenguaje Grandes (LLMs).
 * Prioriza mantener la estructura del texto (líneas, párrafos).
 *
 * @param {string} text - Texto a dividir.
 * @param {number} maxLines - Máximo de líneas por parte.
 * @param {number} maxChars - Máximo de caracteres por parte.
 * @returns {string[]} Array de partes de texto.
 */
export function splitTextForLLMs(text, maxLines = 20, maxChars = 2000) {
  const lines = text.split(/\r?\n/)
  const parts = []
  let buffer = ''
  let lineCount = 0
  for (const line of lines) {
    if (buffer.length + line.length + 1 > maxChars || lineCount >= maxLines) {
      if (buffer.trim().length > 0) {
        parts.push(buffer.trim())
      }
      buffer = ''
      lineCount = 0
    }
    buffer += line + '\n'
    lineCount++
  }
  if (buffer.trim().length > 0) {
    parts.push(buffer.trim())
  }
  return parts
}

/**
 * Divide un texto largo en chunks adecuados para TTS, priorizando los finales de oración y palabras.
 * Si una oración es extremadamente larga y excede el límite, se dividirá en la última palabra válida.
 *
 * @param {string} text - El texto completo a dividir.
 * @param {number} maxChunkLength - La longitud máxima de caracteres permitida por cada chunk de TTS de la API.
 * @returns {string[]} Un array de strings, donde cada string es un chunk de texto listo para TTS.
 */
export function splitTextForTTS(text, maxChunkLength) {
  if (!text) return []
  text = text.trim()

  const chunks = []
  let currentPos = 0

  while (currentPos < text.length) {
    let segment = text.substring(currentPos, currentPos + maxChunkLength)

    if (segment.length <= 0) {
      break
    }

    let splitPoint = segment.length

    let lastNaturalBreak = -1

    const sentenceEndings = /[.!?]\s*/g
    let match
    let tempLastNaturalBreak = -1
    while ((match = sentenceEndings.exec(segment)) !== null) {
      tempLastNaturalBreak = match.index + match[0].length
    }
    if (tempLastNaturalBreak !== -1) {
      lastNaturalBreak = tempLastNaturalBreak
    }

    if (lastNaturalBreak === -1) {
      const newLinePos = segment.lastIndexOf('\n')
      if (newLinePos !== -1) {
        lastNaturalBreak = newLinePos + 1
      }
    }

    if (lastNaturalBreak === -1) {
      lastNaturalBreak = segment.lastIndexOf(' ')
    }

    if (lastNaturalBreak !== -1 && lastNaturalBreak > 0) {
      splitPoint = lastNaturalBreak
    } else {
      const lastSpaceInSegment = segment.lastIndexOf(' ')
      if (
        lastSpaceInSegment !== -1 &&
        segment.length - lastSpaceInSegment < maxChunkLength / 4
      ) {
        splitPoint = lastSpaceInSegment
      } else {
        splitPoint = segment.length
      }
    }

    let chunk = text.substring(currentPos, currentPos + splitPoint).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    currentPos += splitPoint
    while (currentPos < text.length && /\s/.test(text[currentPos])) {
      currentPos++
    }
  }

  return chunks
}
