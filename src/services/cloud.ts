/**
 * 数据请求层
 * - 生产环境（H5/浏览器）：调用 /api/* Vercel Serverless 接口
 * - 微信小程序端（保留兼容）：走 Taro.cloud.callFunction
 * - 本地开发无后端时：走 mock 数据
 */
import Taro from '@tarojs/taro'

const isWeapp = process.env.TARO_ENV === 'weapp'
const isDev = process.env.NODE_ENV === 'development'

/** 统一请求后端 API */
async function fetchApi<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url.toString())
  const json = (await res.json()) as { code: number; message: string; data: T }
  if (json.code !== 0) {
    console.error(`[API] ${path} failed:`, json.message)
    throw new Error(json.message || '请求失败')
  }
  return json.data
}

export async function callFunction<T = any>(
  name: string,
  data?: Record<string, any>
): Promise<T> {
  // 微信小程序端：走云开发
  if (isWeapp) {
    const res = await Taro.cloud.callFunction({ name, data })
    const result = res.result as { code: number; message: string; data: T }
    if (result.code !== 0) {
      console.error(`[Cloud] ${name} failed:`, result.message)
      throw new Error(result.message || '请求失败')
    }
    return result.data
  }

  // H5 生产环境：走 Vercel API
  if (!isDev) {
    return fetchApi<T>(`/api/${name}`, data)
  }

  // 本地开发：优先尝试真实 API，失败回退 mock
  try {
    return await fetchApi<T>(`/api/${name}`, data)
  } catch (err) {
    console.warn(`[Service] ${name} API 不可用，回退 mock 数据`)
    const mockModule = await import(`../data/${name}`)
    return mockModule.default(data) as T
  }
}

export function getDatabase() {
  if (!isWeapp) return null
  return Taro.cloud.database()
}
