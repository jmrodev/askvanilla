
import { GoogleGenAI } from '@google/genai'
import mime from 'mime'

const API_KEY = process.env.GEMINI_API_KEY || 'TU_API_KEY_AQUI'
const MODEL = 'gemini-2.5-flash-preview-tts'

/**
 * Genera audio TTS a partir de un texto usando Gemini.
 * Acumula chunks, maneja formatos y convierte a WAV si es necesario.
 * @param {string} text Texto a convertir en audio.
 * @returns {Promise<{buffer: Buffer, extension: string}>} Buffer de audio y extensión sugerida.
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
      speakingRate: 0.85, 
      pitch: -3.0,
    },
  }

  const contents = [
    {
      role: 'user',
      parts: [{ text: text }],
    },
  ]

  const responseStream = await ai.models.generateContentStream({
    model: MODEL,
    config,
    contents,
  })

  const accumulatedBuffers = []
  let finalExtension = 'mp3'

  for await (const chunk of responseStream) {
    if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const inlineData = chunk.candidates[0].content.parts[0].inlineData
      let currentBuffer = Buffer.from(inlineData.data || '', 'base64')
      let currentExtension = mime.getExtension(inlineData.mimeType || '')

      if (!currentExtension) {
        currentExtension = 'wav'
        currentBuffer = convertToWav(
          inlineData.data || '',
          inlineData.mimeType || ''
        )
      }

      accumulatedBuffers.push(currentBuffer)
      finalExtension = currentExtension
    } else if (chunk.text) {
      console.log(
        'Advertencia: Chunk de texto recibido en modo solo audio:',
        chunk.text
      )
    }
  }

  const finalBuffer = Buffer.concat(accumulatedBuffers)

  return { buffer: finalBuffer, extension: finalExtension }
}



function convertToWav(rawDataString, mimeType) {
  const options = parseMimeType(mimeType)
  const audioBuffer = Buffer.from(rawDataString, 'base64')
  const wavHeader = createWavHeader(audioBuffer.length, options)

  return Buffer.concat([wavHeader, audioBuffer])
}

function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(';').map((s) => s.trim())
  const [_, format] = fileType.split('/')

  const options = {
    numChannels: 1,
  }

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10)
    if (!isNaN(bits)) {
      options.bitsPerSample = bits
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map((s) => s.trim())
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10)
    }
  }

  if (!options.sampleRate) {
    options.sampleRate = 16000
  }
  if (!options.bitsPerSample) {
    options.bitsPerSample = 16
  }

  return options
}

function createWavHeader(dataLength, options) {
  const { numChannels, sampleRate, bitsPerSample } = options


  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const buffer = Buffer.alloc(44)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataLength, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataLength, 40)

  return buffer
}
