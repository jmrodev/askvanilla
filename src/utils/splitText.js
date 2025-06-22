// src/utils/splitText.js

/**
 * Divide un texto en partes de máximo n líneas o n caracteres.
 * @param {string} text - Texto a dividir
 * @param {number} maxLines - Máximo de líneas por parte
 * @param {number} maxChars - Máximo de caracteres por parte
 * @returns {string[]} Array de partes
 */
export function splitText(text, maxLines = 20, maxChars = 2000) {
  const lines = text.split(/\r?\n/)
  const parts = []
  let buffer = ''
  let lineCount = 0
  for (const line of lines) {
    if (lineCount >= maxLines || buffer.length + line.length > maxChars) {
      parts.push(buffer.trim())
      buffer = ''
      lineCount = 0
    }
    buffer += line + '\n'
    lineCount++
  }
  if (buffer.trim()) parts.push(buffer.trim())
  return parts
}
