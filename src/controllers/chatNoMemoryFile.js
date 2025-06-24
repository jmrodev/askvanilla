import inquirer from 'inquirer'
import FileTreeSelectionPrompt from 'inquirer-file-tree-selection-prompt'
import {
  getInquirerPrompt,
  getFilePath,
  getFileContent,
  buildContents,
  printModelResponse,
} from '../utils/chatHelpers.js'
import { chatAsk } from './chatAsk.js'
inquirer.registerPrompt('file-tree-selection', FileTreeSelectionPrompt)

export async function chatModeNoMemoryFile(ai, generateContent) {
  await chatAsk({
    getPrompt: () => getInquirerPrompt(inquirer),
    getFilePath: () => getFilePath(inquirer),
    getFileContent,
    buildContents,
    printModelResponse,
    generateContent,
    ai,
  })
} 