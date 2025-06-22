// generateTTS.js
// Servicio para obtener audio TTS de Gemini (Google Generative AI) usando la librería oficial
// Requiere: pnpm add @google/genai mime

import { GoogleGenAI } from '@google/genai'
import mime from 'mime'

const API_KEY = process.env.GEMINI_API_KEY || 'TU_API_KEY_AQUI'
const MODEL = 'gemini-2.5-flash-preview-tts'

/**
 * Genera audio TTS a partir de un texto usando Gemini
 * @param {string} text Texto a convertir en audio
 * @returns {Promise<{buffer: Buffer, extension: string}>} Buffer de audio y extensión sugerida
 */
export async function generateTTS(text) {
  if (!API_KEY || API_KEY === 'TU_API_KEY_AQUI') {
    throw new Error(
      'Configura tu API KEY de Gemini en la variable de entorno GEMINI_API_KEY'
    )
  }
  if (!text || !text.trim()) {
    throw new Error('No se puede generar audio: el texto está vacío')
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY })
  const config = {
    temperature: 1,
    responseModalities: ['audio'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Zephyr',
        },
      },
    },
  }
  const contents = [
    {
      role: 'user',
      parts: [{ text }],
    },
  ]
  const response = await ai.models.generateContentStream({
    model: MODEL,
    config,
    contents,
  })
  for await (const chunk of response) {
    if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const inlineData = chunk.candidates[0].content.parts[0].inlineData
      let fileExtension = mime.getExtension(inlineData.mimeType || '') || 'wav'
      let buffer = Buffer.from(inlineData.data || '', 'base64')
      return { buffer, extension: fileExtension }
    }
  }
  throw new Error('No se pudo obtener audio de Gemini TTS')
}
