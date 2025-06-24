// src/services/generateContent.js
import { config, model } from '../config/genaiConfig.js'

export async function* generateContent(ai, contents, debug = false) {
  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  })
  for await (const chunk of response) {
    if (debug) {
      console.dir(chunk, { depth: 10 })
    }
    const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) yield text
  }
}
