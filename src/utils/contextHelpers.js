import { promises as fs } from 'fs'
import { promptContextAction, showSuccess, showError, showInfo } from './contextUserInterface.js'
import { GENERAL_CONTEXT_FILE_PATH, LOCAL_CONTEXT_FILE_PATH, CHAT_HISTORY_FILE, AUDIO_HISTORY_FILE } from '../config/contextConfig.js'

export async function readFileContent(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (e) {
    return ''
  }
}

export async function editFileContent(filePath, currentContent) {
  const inquirer = (await import('inquirer')).default
  const { newContent } = await inquirer.prompt({
    type: 'editor',
    name: 'newContent',
    message: `Edita el archivo. Guarda y cierra el editor para confirmar.`,
    default: currentContent,
  })
  await fs.writeFile(filePath, newContent, 'utf-8')
  showSuccess('Archivo actualizado.')
}

export async function deleteFile(filePath) {
  await fs.unlink(filePath)
  showSuccess('Archivo eliminado.')
}

export async function handleContextAction(type, config) {
  let filePath
  let displayName
  switch (type) {
    case 'generalContext':
      filePath = config.GENERAL_CONTEXT_FILE_PATH
      displayName = 'Contexto General'
      break
    case 'localContext':
      filePath = config.LOCAL_CONTEXT_FILE_PATH
      displayName = 'Contexto Local'
      break
    case 'chatHistory':
      filePath = config.CHAT_HISTORY_FILE
      displayName = 'Historial de Chat Local'
      break
    case 'audioHistory':
      filePath = config.AUDIO_HISTORY_FILE
      displayName = 'Historial de Audio Local'
      break
    default:
      showError('Tipo no soportado.')
      return
  }
  while (true) {
    const { action } = await promptContextAction(displayName, filePath)
    if (action === '4') break
    if (action === '1') {
      const content = await readFileContent(filePath)
      showInfo(`\n--- Contenido de ${displayName} (${filePath}) ---`)
      showInfo(content.trim() === '' ? '<Vacío>' : content)
      showInfo(`--- Fin Contenido de ${displayName} ---\n`)
    } else if (action === '2') {
      const currentContent = await readFileContent(filePath)
      await editFileContent(filePath, currentContent)
    } else if (action === '3') {
      const inquirer = (await import('inquirer')).default
      const { confirmDelete } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmDelete',
        message: `¿Estás seguro de que quieres eliminar ${displayName} (${filePath})? Esto es irreversible.`,
        default: false,
      })
      if (confirmDelete) {
        await deleteFile(filePath)
        return
      } else {
        showInfo('Eliminación cancelada.')
      }
    }
  }
} 