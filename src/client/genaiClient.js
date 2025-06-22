// src/client/genaiClient.js
import { GoogleGenAI } from '@google/genai'

export function createGenAIClient(apiKey) {
  return new GoogleGenAI({ apiKey })
}
