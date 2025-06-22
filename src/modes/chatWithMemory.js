import readline from 'readline'
import fs from 'fs'
import path from 'path'

export async function chatModeWithMemory(ai, generateContent) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const historyFile = path.resolve(process.cwd(), 'chat_history.json')
  let history = []
  // Leer historial si existe
  if (fs.existsSync(historyFile)) {
    try {
      const data = fs.readFileSync(historyFile, 'utf-8')
      history = JSON.parse(data)
    } catch (e) {
      history = []
    }
  }
  async function ask() {
    rl.question('Tú: ', async (prompt) => {
      if (prompt.trim().toLowerCase() === 'salir') {
        // Guardar historial al salir
        try {
          fs.writeFileSync(
            historyFile,
            JSON.stringify(history, null, 2),
            'utf-8'
          )
          console.log(`Historial guardado en: ${historyFile}`)
        } catch (e) {}
        rl.close()
        return
      }
      history.push({ role: 'user', parts: [{ text: prompt }] })
      const contents = [...history]
      let responseText = ''
      for await (const text of generateContent(ai, contents)) {
        process.stdout.write(text)
        responseText += text
      }
      process.stdout.write('\n')
      history.push({ role: 'model', parts: [{ text: responseText }] })
      ask()
    })
  }
  ask()
}
