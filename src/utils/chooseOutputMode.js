// src/utils/chooseOutputMode.js
import inquirer from 'inquirer'

export async function chooseOutputMode() {
  const { outputMode } = await inquirer.prompt({
    type: 'list',
    name: 'outputMode',
    message: '¿Cómo quieres la respuesta?',
    choices: [
      { name: 'Texto', value: 'texto' },
      { name: 'Audio', value: 'audio' },
      { name: 'Ambos', value: 'ambos' },
    ],
    default: 'texto',
  })
  return outputMode
}
