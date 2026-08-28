/**
 * DeepSeek API 调用封装（仅服务端使用）
 * 环境变量：DEEPSEEK_API_KEY
 */
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  maxTokens = 500
): Promise<any> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('未配置环境变量 DEEPSEEK_API_KEY')
  }

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: maxTokens,
      stream: false
    })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepSeek API 错误 ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek 返回内容为空')
  return JSON.parse(content)
}

export async function callDeepSeekWithRetry(
  messages: DeepSeekMessage[],
  maxTokens = 500
): Promise<any> {
  let lastErr: Error | null = null
  for (let i = 0; i < 2; i++) {
    try {
      return await callDeepSeek(messages, maxTokens)
    } catch (err) {
      lastErr = err as Error
      console.error(`[deepseek] attempt ${i + 1} failed:`, (err as Error).message)
    }
  }
  throw lastErr || new Error('DeepSeek 调用失败')
}
