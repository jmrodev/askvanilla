// src/utils/parseArgs.js
import fs from 'fs'
import path from 'path'

export function parseArgs(argv) {
  const args = argv.slice(2)
  let prompt = ''
  let filePath = ''
  let fileContent = ''
  let fileIndex = args.indexOf('--file')
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    filePath = args[fileIndex + 1]
    args.splice(fileIndex, 2)
    try {
      fileContent = fs.readFileSync(
        path.resolve(process.cwd(), filePath),
        'utf-8'
      )
    } catch (e) {
      throw new Error('No se pudo leer el archivo: ' + filePath)
    }
  }
  if (args.length > 0) {
    prompt = args.join(' ')
  }
  return { prompt, filePath, fileContent }
}
