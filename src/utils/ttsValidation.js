export function isValidTtsText(text) {
  return typeof text === 'string' && text.trim().length > 0
}

export function isValidTtsFileContent(content) {
  return typeof content === 'string' && content.trim().length > 0
} 