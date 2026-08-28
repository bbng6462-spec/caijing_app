/**
 * 免费财经资讯抓取 + DeepSeek 解读核心逻辑
 * 从原 fetchNews 云函数迁移，改为 HTTP/标准库实现
 */
import { randomUUID } from 'crypto'
import { callDeepSeekWithRetry } from './deepseek'
import {
  articleExistsByUrl,
  bindUrlToId,
  getTodayArticles,
  insertArticle,
  upsertDailyReport
} from './db'
import type { Article, CategoryKey, DailyReport } from './types'

const MAX_PER_RUN = 12
const VALID_CATEGORIES: CategoryKey[] = ['macro', 'stock', 'global', 'tech', 'policy']

interface RawItem {
  title: string
  url: string
  publishedAt: string
  sourceName: string
}

const SOURCES = [
  {
    type: 'sina_roll' as const,
    url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&num=50&page=1',
    sourceName: '新浪财经'
  },
  { type: 'rss' as const, url: 'https://36kr.com/feed', sourceName: '36氪' },
  { type: 'rss' as const, url: 'https://dedicated.wallstreetcn.com/rss.xml', sourceName: '华尔街见闻' }
]

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' },
    signal: AbortSignal.timeout(20000)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function parseSinaRoll(raw: string): RawItem[] {
  const json = JSON.parse(raw)
  const data = json?.result?.data || []
  return data
    .map((it: any) => ({
      title: String(it.title || '').trim(),
      url: it.url,
      publishedAt: new Date(Number(it.ctime) * 1000 || Date.now()).toISOString(),
      sourceName: it.media_name || '新浪财经'
    }))
    .filter((it: RawItem) => it.title && it.url)
}

function extractTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return m ? m[1] : ''
}

function decodeCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return (m ? m[1] : s).trim()
}

function parseRss(xml: string, sourceName: string): RawItem[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/g) || []
  const items: RawItem[] = []
  for (const block of blocks) {
    const title = decodeCdata(extractTag(block, 'title')).replace(/<[^>]+>/g, '').trim()
    const link = decodeCdata(extractTag(block, 'link'))
    const pub = extractTag(block, 'pubDate').trim()
    const d = pub ? new Date(pub) : new Date()
    if (!title || !link) continue
    items.push({
      title,
      url: link,
      publishedAt: (isNaN(d.getTime()) ? new Date() : d).toISOString(),
      sourceName
    })
  }
  return items
}

async function fetchAllSources(): Promise<RawItem[]> {
  const results = await Promise.all(
    SOURCES.map(async (s) => {
      try {
        const body = await fetchText(s.url)
        const items = s.type === 'sina_roll' ? parseSinaRoll(body) : parseRss(body, s.sourceName)
        console.log(`[fetchNews] ${s.sourceName}: ${items.length} items`)
        return items
      } catch (err) {
        console.error(`[fetchNews] source ${s.sourceName} failed:`, (err as Error).message)
        return []
      }
    })
  )
  return results.flat()
}

function dedupe(items: RawItem[]): RawItem[] {
  const seen = new Set<string>()
  return items.filter((it) => {
    const key = it.title.replace(/\s/g, '')
    if (!key || seen.has(key) || seen.has(it.url)) return false
    seen.add(key)
    seen.add(it.url)
    return true
  })
}

const INTERPRET_SYSTEM =
  '你是财经科普作者，擅长把专业财经新闻改写成小白能听懂的大白话。' +
  '输出必须是 JSON 对象，字段：' +
  'category（只能取 macro/stock/global/tech/policy 之一，按新闻主要内容归类）、' +
  'summary（不超过80字，说清发生了什么）、' +
  'whyImportant（不超过60字，为什么重要）、' +
  'impact（不超过60字，会影响谁的钱包或生活，尽量具体）。' +
  '不要输出 JSON 以外的任何内容。'

async function interpretArticle(item: RawItem): Promise<Pick<Article, 'category' | 'summary' | 'whyImportant' | 'impact'>> {
  const ai = await callDeepSeekWithRetry(
    [
      { role: 'system', content: INTERPRET_SYSTEM },
      { role: 'user', content: `新闻标题：${item.title}\n来源：${item.sourceName}` }
    ],
    500
  )
  return {
    category: VALID_CATEGORIES.includes(ai.category) ? ai.category : 'macro',
    summary: String(ai.summary || '').trim() || '暂无解读',
    whyImportant: String(ai.whyImportant || '').trim() || '暂无解读',
    impact: String(ai.impact || '').trim() || '暂无解读'
  }
}

const REPORT_SYSTEM =
  '你是财经早报编辑。根据今天已解读的文章列表，生成今日财经早报 JSON：' +
  'oneLineSummary（不超过50字，用大白话概括今天整体财经大势）、' +
  'highlights（数组，每个元素为 {category, headline}，category 只能取 macro/stock/global/tech/policy 之一' +
  '且必须是文章列表中出现过的板块，headline 不超过25字概括该板块今天最值得关注的看点）。' +
  '不要输出 JSON 以外的任何内容。'

async function generateDailyReport(): Promise<DailyReport | null> {
  const todayArticles = await getTodayArticles()
  if (todayArticles.length === 0) {
    console.log('[fetchNews] no articles today, skip report')
    return null
  }

  const countMap: Record<string, number> = {}
  todayArticles.forEach((a) => {
    countMap[a.category] = (countMap[a.category] || 0) + 1
  })

  const compactList = todayArticles.slice(0, 30).map((a) => ({ category: a.category, title: a.title }))
  const ai = await callDeepSeekWithRetry(
    [
      { role: 'system', content: REPORT_SYSTEM },
      { role: 'user', content: JSON.stringify(compactList) }
    ],
    500
  )

  const highlights = (Array.isArray(ai.highlights) ? ai.highlights : [])
    .filter((h: any) => VALID_CATEGORIES.includes(h.category) && countMap[h.category] > 0)
    .map((h: any) => ({
      category: h.category,
      headline: String(h.headline || '').slice(0, 30),
      count: countMap[h.category]
    }))

  const report: DailyReport = {
    date: todayStr(),
    oneLineSummary: String(ai.oneLineSummary || '').trim() || '今日财经动态已整理',
    highlights,
    articleCount: todayArticles.length,
    generatedAt: new Date().toISOString()
  }

  await upsertDailyReport(report)
  console.log(`[fetchNews] daily report saved for ${report.date}`)
  return report
}

function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export async function runFetchNews() {
  // 1. 抓取 + 批内去重
  const rawItems = await fetchAllSources()
  const items = dedupe(rawItems)
  console.log(`[fetchNews] fetched ${rawItems.length}, unique ${items.length}`)

  if (items.length === 0) {
    return { code: -1, message: '所有信源均抓取失败，请检查服务器网络', data: null }
  }

  // 2. 与库中已有文章去重（按 sourceUrl）
  const newItems: RawItem[] = []
  for (const it of items.slice(0, 50)) {
    const exist = await articleExistsByUrl(it.url)
    if (!exist) newItems.push(it)
  }
  console.log(`[fetchNews] new articles: ${newItems.length}`)

  // 3. 分批并发 DeepSeek 解读并入库（每批 3 条，控制并发避免超时）
  const toProcess = newItems.slice(0, MAX_PER_RUN)
  const BATCH_SIZE = 3
  let saved = 0
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const ai = await interpretArticle(item)
        const id = randomUUID()
        const article: Article & { createdAt: string } = {
          id,
          title: item.title,
          summary: ai.summary,
          whyImportant: ai.whyImportant,
          impact: ai.impact,
          category: ai.category,
          sourceName: item.sourceName,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          createdAt: new Date().toISOString()
        }
        await insertArticle(article)
        await bindUrlToId(item.url, id)
        return id
      })
    )
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') saved++
      else console.error(`[fetchNews] interpret failed for "${batch[idx].title}":`, r.reason?.message)
    })
  }
  console.log(`[fetchNews] saved ${saved} articles`)

  // 4. 生成/更新今日早报
  let report: DailyReport | null = null
  if (saved > 0) {
    try {
      report = await generateDailyReport()
    } catch (err) {
      console.error('[fetchNews] generate report failed:', (err as Error).message)
    }
  }

  return {
    code: 0,
    message: 'success',
    data: { fetched: items.length, saved, reportSaved: !!report }
  }
}
