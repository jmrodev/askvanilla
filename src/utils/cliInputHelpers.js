import readline from 'readline'

/**
 * Obtiene el prompt del usuario usando readline.
 * @param {readline.Interface} rl
 * @param {string} message
 * @returns {Promise<string>}
 */
export function getUserPrompt(rl, message = 'Tú: ') {
  return new Promise((resolve) => rl.question(message, resolve))
}

/**
 * Cierra la instancia de readline si existe.
 * @param {readline.Interface} rl
 */
export function closeReadline(rl) {
  if (rl && typeof rl.close === 'function') {
    rl.close()
  }
} 