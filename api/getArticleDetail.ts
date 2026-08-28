import { getArticleById } from './_lib/db'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return Response.json({ code: -1, message: '缺少文章 id', data: null }, { status: 400 })
    }
    const data = await getArticleById(id)
    if (!data) {
      return Response.json({ code: -1, message: '文章不存在或已下线', data: null }, { status: 404 })
    }
    return Response.json({ code: 0, message: 'success', data })
  } catch (err) {
    console.error('[getArticleDetail] error:', err)
    return Response.json(
      { code: -1, message: (err as Error).message || '服务异常', data: null },
      { status: 500 }
    )
  }
}
