import { Article } from '../types/finance'
import { MOCK_ARTICLES } from './getArticles'

// Mock：getArticleDetail 云函数（H5 预览用）
export default function getArticleDetail(data?: { id?: string }): Article | null {
  const id = data?.id
  if (!id) {
    console.error('[mock:getArticleDetail] missing id')
    return null
  }
  const found = MOCK_ARTICLES.find((a: Article) => a.id === id)
  if (!found) {
    console.error(`[mock:getArticleDetail] article not found: ${id}`)
    return null
  }
  return found
}
