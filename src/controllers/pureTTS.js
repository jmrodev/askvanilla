import readline from 'readline'
import inquirer from 'inquirer'
import FileTreeSelectionPrompt from 'inquirer-file-tree-selection-prompt'
import { generateTTS } from '../services/generateTTS.js'
import { saveAudioFile } from '../utils/saveAudioFile.js'
import { getFilePath, getFileContent } from '../utils/chatHelpers.js'
import { splitTextForTTS } from '../utils/splitText.js'

import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'

inquirer.registerPrompt('file-tree-selection', FileTreeSelectionPrompt)

const PROGRESS_FILE_NAME = '.tts_progress.json'
const currentDir = process.cwd()

async function loadProgress() {
  const filePath = path.join(currentDir, PROGRESS_FILE_NAME)
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    return {
      textHash: '',
      completedParts: [],
      tempFiles: [],
    }
  }
}

async function saveProgress(progress) {
  const filePath = path.join(currentDir, PROGRESS_FILE_NAME)
  await fs.writeFile(filePath, JSON.stringify(progress, null, 2), 'utf-8')
}

async function clearProgress() {
  const filePath = path.join(currentDir, PROGRESS_FILE_NAME)
  try {
    await fs.unlink(filePath)
    console.log('Archivo de progreso limpiado.')
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error('Error al limpiar archivo de progreso:', e.message)
    }
  }
}

async function cleanupTempFiles(tempFiles) {
  for (const filePath of tempFiles) {
    try {
      await fs.unlink(filePath)
    } catch (e) {
      console.warn(
        `No se pudo eliminar archivo temporal ${filePath}: ${e.message}`
      )
    }
  }
}

/**
 * Función que ejecuta un comando de shell y devuelve una promesa.
 * @param {string} command El comando a ejecutar.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(
            `Comando fallido: ${command}\nError: ${error.message}\nStderr: ${stderr}`
          )
        )
        return
      }
      if (stderr) {
        console.warn(`Advertencia en comando: ${command}\nStderr: ${stderr}`)
      }
      resolve({ stdout, stderr })
    })
  })
}

export async function pureTTSMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log('\n--- Modo Conversión Texto a Voz Directa ---')
  const TTS_CHARACTER_LIMIT = 4500

  while (true) {
    const { inputMethod } = await inquirer.prompt([
      {
        type: 'list',
        name: 'inputMethod',
        message: '¿Cómo quieres proporcionar el texto?',
        choices: [
          { name: '1) Escribir texto directamente', value: 'type' },
          {
            name: '2) Seleccionar un archivo (.txt, .md, .js, etc.)',
            value: 'file',
          },
          { name: '3) Salir', value: 'exit' },
        ],
      },
    ])

    if (inputMethod === 'exit') {
      break
    }

    let rawTextToConvert = ''
    let isFileMode = false
    let inputIdentifier = ''

    if (inputMethod === 'type') {
      rawTextToConvert = await new Promise((resolve) =>
        rl.question('Escribe el texto para TTS (o "salir"): ', resolve)
      )
      if (rawTextToConvert.toLowerCase() === 'salir') {
        break
      }
      if (!rawTextToConvert.trim()) {
        console.log('Por favor, ingresa algún texto válido.')
        continue
      }
      inputIdentifier =
        'input_' +
        Buffer.from(rawTextToConvert).toString('base64').substring(0, 8)
    } else if (inputMethod === 'file') {
      isFileMode = true
      const filePath = await getFilePath(inquirer)
      if (!filePath) {
        console.log(
          'No se seleccionó ningún archivo. Volviendo al menú de entrada.'
        )
        continue
      }

      try {
        rawTextToConvert = await getFileContent(filePath)
        if (!rawTextToConvert.trim()) {
          console.log(
            'El archivo seleccionado está vacío o solo contiene espacios en blanco.'
          )
          continue
        }
        inputIdentifier =
          'file_' +
          path.basename(filePath) +
          '_' +
          (await fs.stat(filePath)).mtimeMs
        console.log(`Contenido del archivo "${filePath}" cargado para TTS.`)
      } catch (e) {
        console.error(`Error al leer el archivo ${filePath}: ${e.message}`)
        continue
      }
    }

    const textParts = splitTextForTTS(rawTextToConvert, TTS_CHARACTER_LIMIT)
    if (textParts.length === 0) {
      console.log('El texto no contiene contenido procesable.')
      continue
    }
    if (textParts.length > 1) {
      console.log(
        `El texto se ha dividido en ${textParts.length} partes para una mejor generación de audio.`
      )
    }

    const progress = await loadProgress()
    const currentTextHash = inputIdentifier

    if (progress.textHash !== currentTextHash) {
      console.log(
        'Texto nuevo o modificado detectado. Iniciando nueva sesión TTS.'
      )
      await cleanupTempFiles(progress.tempFiles)
      progress.textHash = currentTextHash
      progress.completedParts = []
      progress.tempFiles = []
      await saveProgress(progress)
    } else {
      console.log(
        `Reanudando desde la parte ${progress.completedParts.length + 1}.`
      )
    }

    let finalOutputExtension = 'wav'

    for (let i = 0; i < textParts.length; i++) {
      if (progress.completedParts.includes(i)) {
        console.log(
          `Parte ${i + 1}/${textParts.length} ya completada. Saltando.`
        )
        continue
      }

      const textPart = textParts[i]
      const textHash = Buffer.from(textPart).toString('base64')

      if (progress.textHash !== textHash) {
        console.log(
          `Texto nuevo o modificado detectado. Iniciando nueva parte TTS.`
        )
        await cleanupTempFiles(progress.tempFiles)
        progress.textHash = textHash
        progress.completedParts = []
        progress.tempFiles = []
        await saveProgress(progress)
      } else {
        console.log(
          `Reanudando desde la parte ${progress.completedParts.length + 1}.`
        )
      }

      const audioData = await generateTTS(textPart)
      const tempFilePath = await saveAudioFile(audioData, finalOutputExtension)
      progress.tempFiles.push(tempFilePath)
      progress.completedParts.push(i)
      await saveProgress(progress)

      console.log(`Parte ${i + 1}/${textParts.length} generada correctamente.`)
    }

    await cleanupTempFiles(progress.tempFiles)
    progress.completedParts = []
    progress.tempFiles = []
    await saveProgress(progress)

    console.log('\n--- Fin de la conversión ---')
  }
} 