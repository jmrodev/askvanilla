import inquirer from 'inquirer'
import { logInfo, logWarning, logSuccess } from './chatHelpers.js'

export async function promptInputMethod() {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'inputMethod',
      message: '¿Cómo quieres proporcionar el texto?',
      choices: [
        { name: '1) Escribir texto directamente', value: 'type' },
        { name: '2) Seleccionar un archivo (.txt, .md, .js, etc.)', value: 'file' },
        { name: '3) Salir', value: 'exit' },
      ],
    },
  ])
}

export function showPartInfo(i, total) {
  logInfo(`Parte ${i + 1}/${total} ya completada. Saltando.`)
}

export function showSessionStart() {
  logInfo('--- Modo Conversión Texto a Voz Directa ---')
}

export function showSessionEnd() {
  logInfo('--- Fin de la conversión ---')
}

export function showWarning(msg) {
  logWarning(msg)
}

export function showSuccess(msg) {
  logSuccess(msg)
} 