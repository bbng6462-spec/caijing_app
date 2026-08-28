/**
 * API 路由独立类型定义（避免依赖 src/ 目录）
 * 与 src/types/finance.ts 保持同步
 */
export type CategoryKey = 'macro' | 'stock' | 'global' | 'tech' | 'policy'

export interface Article {
  id: string
  title: string
  summary: string
  whyImportant: string
  impact: string
  category: CategoryKey
  sourceName: string
  sourceUrl: string
  publishedAt: string
}

export interface SectionHighlight {
  category: CategoryKey
  headline: string
  count: number
}

export interface DailyReport {
  date: string
  oneLineSummary: string
  highlights: SectionHighlight[]
  articleCount: number
  generatedAt: string
}
