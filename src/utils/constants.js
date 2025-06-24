// Constantes globales y reutilizables en el proyecto

export const TTS_CHARACTER_LIMIT = 4500
export const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts'
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'TU_API_KEY_AQUI'

export const MENU_CHOICES = [
  { name: '1) Interactivo', value: '1' },
  { name: '2) Chat con memoria', value: '2' },
  { name: '3) Chat sin memoria', value: '3' },
  { name: '4) Chat con memoria prompt+archivo', value: '4' },
  { name: '5) Chat sin memoria prompt+archivo', value: '5' },
  { name: '6) TTS Directo (Texto a Voz)', value: 'pureTTS' },
  { name: '7) Gestionar Contexto e Historial', value: 'manageContextHistory' },
  { name: 'Salir', value: 'exit' },
]

export const OUTPUT_MODE_CHOICES = [
  { name: 'Texto', value: 'texto' },
  { name: 'Audio', value: 'audio' },
  { name: 'Ambos', value: 'ambos' },
]
export const OUTPUT_MODE_DEFAULT = 'texto'

// Umbrales para división de archivos en partes para LLM
export const MAX_LLM_FILE_PART_LINES = 1000
export const MAX_LLM_FILE_PART_CHARS = 10000

// Puedes agregar aquí más constantes según crezcan las necesidades del proyecto 