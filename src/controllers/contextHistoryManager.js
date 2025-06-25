import inquirer from 'inquirer'
import EditorPrompt from 'inquirer/lib/prompts/editor.js'
import { promises as fs } from 'fs'
import path from 'path'

import {
  getGeneralContext,
  saveGeneralContext,
  deleteGeneralContext,
  getLocalContext,
  saveLocalContext,
  deleteLocalContext,
  GENERAL_CONTEXT_FILE_PATH,
  getLocalContextFilePath,
} from '../utils/contextManager.js'

import {
  getHistoryFilePath,
  loadHistory,
  clearHistory,
  saveHistory,
} from '../utils/chatHistory.js'
import { loadAudioHistory, clearAudioHistory } from '../utils/audioHistory.js'
import { promptContextMenu } from '../utils/contextUserInterface.js'
import { handleContextAction } from '../utils/contextHelpers.js'
import * as CONTEXT_CONFIG from '../config/contextConfig.js'

inquirer.registerPrompt('editor', EditorPrompt)

export class ContextHistoryManager {
  constructor(initialHistory = []) {
    this.history = initialHistory
    this.maxHistoryMessages = 20
  }

  /**
   * Gestiona el contexto y el historial, y construye el array 'contents' final para la API.
   * Este método es llamado por chatModeWithMemoryFile's buildContents override.
   * @param {string} combinedContextString - El contexto global/local combinado como una cadena.
   * @param {Array<Object>} currentFullHistory - La referencia al historial completo gestionado por chatAsk.
   *                                             (Ya incluye el último turno del usuario y potencialmente sus partes chunked).
   * @returns {Array<Object>} El array 'contents' listo para la API de Gemini.
   */
  manageContext(combinedContextString, currentFullHistory) {
    const contents = []

    if (combinedContextString.trim()) {
      contents.push({ role: 'user', parts: [{ text: combinedContextString }] })
    }

    let effectiveHistory = [...currentFullHistory]
    if (effectiveHistory.length > this.maxHistoryMessages) {
      effectiveHistory = effectiveHistory.slice(
        effectiveHistory.length - this.maxHistoryMessages
      )
    }

    contents.push(...effectiveHistory)

    return contents
  }

}

async function handleContextHistoryAction(
  type,
  filePath,
  loadFn,
  saveFn,
  deleteFn
) {
  while (true) {
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: `Acción para ${type} (${path.basename(filePath) || filePath}):`,
      choices: [
        '1) Leer',
        '2) Editar',
        '3) Eliminar',
        '4) Volver al menú anterior',
      ],
    })

    if (action === '4') break

    let currentContent = ''
    if (loadFn) {
      if (type === 'Historial de Chat Local') {
        const historyData = await loadFn(filePath)
        currentContent = JSON.stringify(historyData, null, 2)
      } else {
        currentContent = await loadFn(filePath)
      }
    } else {
      if (type === 'Historial de Audio Local') {
        const history = await loadAudioHistory()
        currentContent = JSON.stringify(history, null, 2)
      }
    }

    switch (action) {
      case '1':
        console.log(`\n--- Contenido de ${type} (${filePath}) ---`)
        console.log(currentContent.trim() === '' ? '<Vacío>' : currentContent)
        console.log(`--- Fin Contenido de ${type} ---\n`)
        break
      case '2':
        try {
          if (!saveFn) {
            console.log(
              'La edición directa no está soportada para este tipo de historial (es un JSON de objetos).'
            )
            break
          }
          const { newContent } = await inquirer.prompt({
            type: 'editor',
            name: 'newContent',
            message: `Edita el ${type}. Guarda y cierra el editor para confirmar.`,
            default: currentContent,
          })
          await saveFn(filePath, newContent)
          console.log(`${type} actualizado.`)
        } catch (e) {
          console.error(`Error al editar ${type}:`, e.message)
        }
        break
      case '3':
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          message: `¿Estás seguro de que quieres eliminar ${type} (${filePath})? Esto es irreversible.`,
          default: false,
        })
        if (confirmDelete) {
          if (deleteFn) {
            await deleteFn(filePath)
            console.log(`${type} eliminado.`)
            return
          }
        } else {
          console.log('Eliminación cancelada.')
        }
        break
    }
    console.log('\n')
  }
}

export async function manageContextAndHistoryMenu() {
  while (true) {
    const { type } = await promptContextMenu()
    if (type === 'back') break
    await handleContextAction(type, CONTEXT_CONFIG)
  }
} 