import readline from 'readline'

export async function chatModeNoMemory(ai, generateContent) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  async function ask() {
    rl.question('Tú: ', async (prompt) => {
      if (prompt.trim().toLowerCase() === 'salir') {
        rl.close()
        return
      }
      const contents = [{ role: 'user', parts: [{ text: prompt }] }]
      for await (const text of generateContent(ai, contents)) {
        process.stdout.write(text)
      }
      process.stdout.write('\n')
      ask()
    })
  }
  ask()
}
