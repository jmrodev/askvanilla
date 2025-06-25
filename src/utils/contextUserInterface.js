import inquirer from 'inquirer'
import { logInfo, logSuccess, logWarning } from './chatHelpers.js'

export async function promptContextMenu() {
  return inquirer.prompt({
    type: 'list',
    name: 'type',
    message: 'Gestionar:',
    choices: [
      { name: '1) Contexto General', value: 'generalContext' },
      { name: '2) Contexto Local (proyecto actual)', value: 'localContext' },
      { name: '3) Historial de Chat Local', value: 'chatHistory' },
      { name: '4) Historial de Audio Local', value: 'audioHistory' },
      { name: '5) Volver al menú principal', value: 'back' },
    ],
  })
}

export async function promptContextAction(type, filePath) {
  return inquirer.prompt({
    type: 'list',
    name: 'action',
    message: `Acción para ${type} (${filePath}):`,
    choices: [
      '1) Leer',
      '2) Editar',
      '3) Eliminar',
      '4) Volver al menú anterior',
    ],
  })
}

export function showSuccess(msg) {
  logSuccess(msg)
}

export function showError(msg) {
  logWarning(msg)
}

export function showInfo(msg) {
  logInfo(msg)
} 