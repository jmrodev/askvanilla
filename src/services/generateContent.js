// src/services/generateContent.js
import { config, model } from '../config/genaiConfig.js'

export async function* generateContent(ai, contents) {
  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  })
  for await (const chunk of response) {
    yield chunk.text
  }
}
