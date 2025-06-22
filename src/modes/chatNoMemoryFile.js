import inquirer from 'inquirer'
import FileTreeSelectionPrompt from 'inquirer-file-tree-selection-prompt'
import fs from 'fs'
import path from 'path'
inquirer.registerPrompt('file-tree-selection', FileTreeSelectionPrompt)

export async function chatModeNoMemoryFile(ai, generateContent) {
  async function ask() {
    const { prompt } = await inquirer.prompt({
      type: 'input',
      name: 'prompt',
      message: 'Prompt:',
    })
    let filePath = ''
    const { useFile } = await inquirer.prompt({
      type: 'confirm',
      name: 'useFile',
      message: '¿Adjuntar archivo?',
      default: false,
    })
    if (useFile) {
      const fileAnswer = await inquirer.prompt({
        type: 'file-tree-selection',
        name: 'filePath',
        message: 'Selecciona archivo:',
        root: '.',
      })
      filePath = fileAnswer.filePath
    }
    let parts = [{ text: prompt }]
    if (filePath) {
      try {
        const fileContent = fs.readFileSync(
          path.resolve(process.cwd(), filePath),
          'utf-8'
        )
        parts.push({ text: fileContent })
      } catch (e) {
        console.log('No se pudo leer el archivo, se omite.')
      }
    }
    if (prompt.trim().toLowerCase() === 'salir') {
      return
    }
    const contents = [{ role: 'user', parts }]
    for await (const text of generateContent(ai, contents)) {
      process.stdout.write(text)
    }
    process.stdout.write('\n')
    ask()
  }
  ask()
}
