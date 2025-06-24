// src/utils/chooseOutputMode.js
import inquirer from 'inquirer'
import { OUTPUT_MODE_CHOICES, OUTPUT_MODE_DEFAULT } from './constants.js'

export async function chooseOutputMode(choices = OUTPUT_MODE_CHOICES, defaultMode = OUTPUT_MODE_DEFAULT) {
  const { outputMode } = await inquirer.prompt({
    type: 'list',
    name: 'outputMode',
    message: '¿Cómo quieres la respuesta?',
    choices,
    default: defaultMode,
  })
  return outputMode
}
