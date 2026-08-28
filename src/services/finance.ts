import { callFunction } from './cloud'
import { Article, ArticlePage, DailyReport } from '../types/finance'

/** 获取每日早报（不传 date 默认最新一期） */
export function fetchDailyReport(date?: string): Promise<DailyReport> {
  return callFunction<DailyReport>('getDailyReport', { date })
}

/** 分页获取新闻解读列表 */
export function fetchArticles(params: {
  category?: string
  page: number
  pageSize: number
}): Promise<ArticlePage> {
  return callFunction<ArticlePage>('getArticles', params)
}

/** 获取单篇解读详情 */
export function fetchArticleDetail(id: string): Promise<Article> {
  return callFunction<Article>('getArticleDetail', { id })
}

/** 登录获取 openid（微信端） */
export function fetchLogin(): Promise<{ openid: string }> {
  return callFunction<{ openid: string }>('login', {})
}
