import inquirer from 'inquirer'
import { MENU_CHOICES } from '../utils/constants.js'

/**
 * Muestra el menú interactivo para seleccionar el modo de conversación.
 * @param {Array} choices - Opciones del menú (por defecto MENU_CHOICES)
 * @returns {Promise<string>} El modo seleccionado.
 */
export async function selectConversationMode(choices = MENU_CHOICES) {
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Selecciona modo:',
      choices,
    },
  ])
  return mode
} 