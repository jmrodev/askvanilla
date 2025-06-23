import { promises as fs } from 'fs'
import path from 'path'

export async function parseArgs(argv) {
  const args = argv.slice(2)
  let prompt = ''
  let filePath = ''
  let fileContent = ''
  let fileIndex = args.indexOf('--file')
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    filePath = args[fileIndex + 1]
    args.splice(fileIndex, 2)
    try {
      fileContent = await fs.readFile(
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
