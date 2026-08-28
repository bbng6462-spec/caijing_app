import { runFetchNews } from './_lib/fetchNews'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel Hobby 最长 60s

export async function GET() {
  // 支持手动触发：浏览器访问 /api/fetchNews 即可立即跑一次
  return await handleRun()
}

export async function POST() {
  return await handleRun()
}

async function handleRun() {
  try {
    const result = await runFetchNews()
    return Response.json(result)
  } catch (err) {
    console.error('[fetchNews] error:', err)
    return Response.json(
      { code: -1, message: (err as Error).message || '抓取失败', data: null },
      { status: 500 }
    )
  }
}
