import readline from 'readline'

export async function interactiveMode(ai, generateContent) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Escribe tu pregunta: ', async (prompt) => {
    const contents = [{ role: 'user', parts: [{ text: prompt }] }]
    for await (const text of generateContent(ai, contents)) {
      process.stdout.write(text)
    }
    process.stdout.write('\n')
    rl.close()
  })
} 