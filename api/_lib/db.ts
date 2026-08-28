/**
 * Vercel KV (Upstash Redis) 数据访问层
 * 替代微信云开发数据库，存储文章与每日早报
 * 环境变量：KV_REST_API_URL、KV_REST_API_TOKEN（Vercel 连接 KV 后自动注入）
 */
import { Redis } from '@upstash/redis'
import type { Article, CategoryKey, DailyReport } from './types'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN
    if (!url || !token) {
      throw new Error('未配置 Vercel KV 环境变量（KV_REST_API_URL / KV_REST_API_TOKEN）')
    }
    redis = new Redis({ url, token })
  }
  return redis
}

const ARTICLE_PREFIX = 'article:'
const ARTICLE_INDEX = 'articles:index' // sorted set: score=timestamp, member=id
const CATEGORY_INDEX_PREFIX = 'articles:cat:' // set: category -> ids
const REPORT_PREFIX = 'report:'

export async function insertArticle(article: Article & { createdAt: string }): Promise<void> {
  const r = getRedis()
  const id = article.id
  await r.hset(`${ARTICLE_PREFIX}${id}`, article as any)
  const ts = new Date(article.publishedAt).getTime()
  await r.zadd(ARTICLE_INDEX, { score: ts, member: id })
  await r.sadd(`${CATEGORY_INDEX_PREFIX}${article.category}`, id)
}

export async function articleExistsByUrl(url: string): Promise<boolean> {
  const r = getRedis()
  const id = await r.get(`url2id:${url}`)
  return !!id
}

export async function bindUrlToId(url: string, id: string): Promise<void> {
  const r = getRedis()
  await r.set(`url2id:${url}`, id)
}

export async function getArticles(params: {
  category?: CategoryKey
  page: number
  pageSize: number
}): Promise<{ list: Article[]; hasMore: boolean }> {
  const r = getRedis()
  const { category, page, pageSize } = params
  const start = (page - 1) * pageSize
  const stop = start + pageSize - 1

  let ids: string[]
  if (category) {
    // 取该分类所有 id，再按发布时间排序
    const catIds = await r.smembers(`${CATEGORY_INDEX_PREFIX}${category}`)
    // 用 pipeline 批量查分数排序
    const withScore = await Promise.all(
      catIds.map(async (id) => {
        const score = await r.zscore(ARTICLE_INDEX, id)
        return { id, score: score || 0 }
      })
    )
    withScore.sort((a, b) => b.score - a.score)
    ids = withScore.map((x) => x.id).slice(start, stop + 1)
  } else {
    // 全局按发布时间倒序
    ids = await r.zrevrange(ARTICLE_INDEX, start, stop)
  }

  if (ids.length === 0) return { list: [], hasMore: false }

  const pipe = r.pipeline()
  ids.forEach((id) => pipe.hgetall(`${ARTICLE_PREFIX}${id}`))
  const results = (await pipe.exec()) as any[]

  const list: Article[] = results
    .filter((x) => x && x.id)
    .map((x) => ({
      id: x.id,
      title: x.title,
      summary: x.summary,
      whyImportant: x.whyImportant,
      impact: x.impact,
      category: x.category as CategoryKey,
      sourceName: x.sourceName,
      sourceUrl: x.sourceUrl,
      publishedAt: x.publishedAt
    }))

  // 判断是否还有更多
  let hasMore = false
  if (ids.length === pageSize) {
    const nextStart = stop + 1
    if (category) {
      const catIds = await r.smembers(`${CATEGORY_INDEX_PREFIX}${category}`)
      hasMore = nextStart < catIds.length
    } else {
      const total = await r.zcard(ARTICLE_INDEX)
      hasMore = nextStart < total
    }
  }

  return { list, hasMore }
}

export async function getArticleById(id: string): Promise<Article | null> {
  const r = getRedis()
  const data = await r.hgetall(`${ARTICLE_PREFIX}${id}`)
  if (!data || !data.id) return null
  return {
    id: data.id,
    title: data.title,
    summary: data.summary,
    whyImportant: data.whyImportant,
    impact: data.impact,
    category: data.category as CategoryKey,
    sourceName: data.sourceName,
    sourceUrl: data.sourceUrl,
    publishedAt: data.publishedAt
  }
}

export async function getTodayArticles(): Promise<Article[]> {
  const r = getRedis()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const startTs = startOfDay.getTime()
  const ids = await r.zrangebyscore(ARTICLE_INDEX, startTs, '+inf')
  if (ids.length === 0) return []
  const pipe = r.pipeline()
  ids.forEach((id) => pipe.hgetall(`${ARTICLE_PREFIX}${id}`))
  const results = (await pipe.exec()) as any[]
  return results
    .filter((x) => x && x.id)
    .map((x) => ({
      id: x.id,
      title: x.title,
      summary: x.summary,
      whyImportant: x.whyImportant,
      impact: x.impact,
      category: x.category as CategoryKey,
      sourceName: x.sourceName,
      sourceUrl: x.sourceUrl,
      publishedAt: x.publishedAt
    }))
}

export async function upsertDailyReport(report: DailyReport): Promise<void> {
  const r = getRedis()
  await r.hset(`${REPORT_PREFIX}${report.date}`, report as any)
}

export async function getDailyReport(date?: string): Promise<DailyReport | null> {
  const r = getRedis()
  if (date) {
    const data = await r.hgetall(`${REPORT_PREFIX}${date}`)
    if (data && data.date) return data as unknown as DailyReport
  }
  // 回退最新一期
  const allKeys = await r.keys(`${REPORT_PREFIX}*`)
  if (allKeys.length === 0) return null
  allKeys.sort().reverse()
  const latest = await r.hgetall(allKeys[0])
  return (latest && latest.date) ? (latest as unknown as DailyReport) : null
}
