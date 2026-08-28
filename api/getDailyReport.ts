import { getDailyReport } from './_lib/db'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') || undefined
    const data = await getDailyReport(date || undefined)
    if (!data) {
      return Response.json(
        { code: -1, message: '暂无早报数据，请等待首次抓取任务运行', data: null },
        { status: 404 }
      )
    }
    return Response.json({ code: 0, message: 'success', data })
  } catch (err) {
    console.error('[getDailyReport] error:', err)
    return Response.json(
      { code: -1, message: (err as Error).message || '服务异常', data: null },
      { status: 500 }
    )
  }
}
