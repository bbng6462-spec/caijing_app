import { getArticles } from './_lib/db'
import type { CategoryKey } from './_lib/types'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const category = (url.searchParams.get('category') as CategoryKey) || undefined
    const page = Math.max(1, Number(url.searchParams.get('page') || 1))
    const pageSize = Math.min(20, Math.max(1, Number(url.searchParams.get('pageSize') || 10)))

    const data = await getArticles({ category, page, pageSize })
    return Response.json({ code: 0, message: 'success', data })
  } catch (err) {
    console.error('[getArticles] error:', err)
    return Response.json(
      { code: -1, message: (err as Error).message || '服务异常', data: null },
      { status: 500 }
    )
  }
}
