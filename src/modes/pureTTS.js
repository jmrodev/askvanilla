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

      const part = textParts[i]
      console.log(
        `Generando audio para la parte ${i + 1}/${textParts.length} (${
          part.length
        } caracteres)...`
      )

      const tempAudioFileName = path.join(currentDir, `.temp_tts_part_${i}.wav`)

      try {
        const { buffer, extension } = await generateTTS(part)
        await saveAudioFile(tempAudioFileName, buffer)
        console.log(
          `Parte ${i + 1} guardada temporalmente: ${tempAudioFileName}`
        )

        progress.completedParts.push(i)
        progress.tempFiles.push(tempAudioFileName)
        await saveProgress(progress)

        finalOutputExtension = extension
      } catch (error) {
        console.error(
          `Error al generar audio para la parte ${i + 1}:`,
          error.message
        )
        break
      }
    }

    if (
      progress.completedParts.length === textParts.length &&
      textParts.length > 0
    ) {
      const finalOutputFileName = `pure_tts_output_combined_${Date.now()}.${finalOutputExtension}`
      const inputFilesList = progress.tempFiles

      if (inputFilesList.length === 0) {
        console.log('No hay partes de audio para concatenar.')
      } else if (inputFilesList.length === 1) {
        try {
          await fs.rename(inputFilesList[0], finalOutputFileName)
          console.log(
            `Una única parte de audio guardada como: ${finalOutputFileName}`
          )
          await cleanupTempFiles(inputFilesList)
          await clearProgress()
        } catch (e) {
          console.error(`Error al renombrar archivo: ${e.message}`)
        }
      } else {
        console.log(
          `Concatenando ${inputFilesList.length} partes de audio en ${finalOutputFileName} con FFmpeg...`
        )
        const concatListPath = path.join(
          currentDir,
          `.concat_list_${Date.now()}.txt`
        )
        const concatListContent = inputFilesList
          .map((file) => `file '${path.relative(currentDir, file)}'`)
          .join('\n')

        try {
          await fs.writeFile(concatListPath, concatListContent, 'utf-8')

          const command = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalOutputFileName}"`
          await runCommand(command)

          console.log('Concatenación exitosa.')
          await cleanupTempFiles(inputFilesList)
          await fs.unlink(concatListPath)
          await clearProgress()
          console.log(`Audio completo guardado en: ${finalOutputFileName}`)
        } catch (e) {
          console.error('Falló la concatenación de audio:', e.message)
        }
      }
    } else if (textParts.length > 0) {
      console.log(
        'Proceso interrumpido o incompleto. Se han guardado las partes hasta ahora.'
      )
      console.log(
        `Para reanudar, ejecuta el modo TTS directo con el mismo texto/archivo.`
      )
    }

    console.log('Modo TTS directo finalizado para esta sesión.')
  }

  rl.close()
}
