import { DEFAULT_PROVIDER_ID, getProvider } from './providers/index.js'

// Ponto único de entrada pra chamar IA a partir de api/ai.js — quem chama não
// sabe (nem precisa saber) qual provider está por trás.
export async function runAiChat({ providerId = DEFAULT_PROVIDER_ID, messages, jsonMode = false }) {
  const provider = getProvider(providerId)
  if (!provider.configured) {
    throw Object.assign(new Error(`Provider "${providerId}" não está configurado (falta a chave de API)`), {
      statusCode: 500,
    })
  }
  return provider.chat({ messages, jsonMode })
}
