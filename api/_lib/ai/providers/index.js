import { createDeepSeekProvider } from './deepseek.js'

// Registry de providers de IA. Hoje só DeepSeek está implementado, mas o
// endpoint (api/ai.js) e o dispatcher (api/_lib/ai/index.js) nunca falam com
// um provider diretamente — sempre por essa fábrica — então plugar um novo
// serviço (OpenAI, Anthropic, etc.) é só adicionar uma entrada aqui.
const factories = {
  deepseek: createDeepSeekProvider,
}

export const DEFAULT_PROVIDER_ID = 'deepseek'

export function getProvider(id = DEFAULT_PROVIDER_ID) {
  const factory = factories[id]
  if (!factory) {
    throw Object.assign(new Error(`Provider de IA desconhecido: ${id}`), { statusCode: 400 })
  }
  return factory()
}
