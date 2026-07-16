export function createDeepSeekProvider() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const configuredMaxTokens = Number(process.env.DEEPSEEK_MAX_TOKENS)
  const maxTokens = Number.isFinite(configuredMaxTokens) && configuredMaxTokens > 0
    ? Math.floor(configuredMaxTokens)
    : 32768

  return {
    id: 'deepseek',
    configured: Boolean(apiKey),
    async chat({ messages, jsonMode = false }) {
      if (!apiKey) {
        throw Object.assign(new Error('DEEPSEEK_API_KEY is not configured'), { statusCode: 500 })
      }

      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.4,
          max_tokens: maxTokens,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      })

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '')
        throw Object.assign(new Error(`DeepSeek API error (${response.status}): ${bodyText.slice(0, 500)}`), {
          statusCode: 502,
        })
      }

      const data = await response.json()
      if (data?.choices?.[0]?.finish_reason === 'length') {
        throw Object.assign(new Error('A resposta completa excedeu o limite de saída do modelo. Aumente DEEPSEEK_MAX_TOKENS.'), {
          statusCode: 502,
        })
      }
      const content = data?.choices?.[0]?.message?.content
      if (typeof content !== 'string') {
        throw Object.assign(new Error('Resposta inesperada do provider de IA'), { statusCode: 502 })
      }
      return content
    },
  }
}
