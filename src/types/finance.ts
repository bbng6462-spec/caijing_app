// ============================================
// 财经早知道 类型定义与板块常量
// ============================================

/** 五大板块 key */
export type CategoryKey = 'macro' | 'stock' | 'global' | 'tech' | 'policy'

/** 板块展示信息 */
export interface CategoryInfo {
  key: CategoryKey
  name: string
  emoji: string
}

/** 五大板块常量 */
export const CATEGORIES: CategoryInfo[] = [
  { key: 'macro', name: '宏观大势', emoji: '🏛️' },
  { key: 'stock', name: '股市行业', emoji: '📈' },
  { key: 'global', name: '国际大宗', emoji: '🌍' },
  { key: 'tech', name: '科技商业', emoji: '💻' },
  { key: 'policy', name: '政策民生', emoji: '📋' }
]

/** 用户板块偏好的本地存储 key（与「我的」页共用） */
export const PREF_STORAGE_KEY = 'finance_preferences'

/** 根据 key 获取板块信息 */
export function getCategoryInfo(key: CategoryKey): CategoryInfo {
  const found = CATEGORIES.find((c) => c.key === key)
  return found || CATEGORIES[0]
}

/** 新闻解读文章 */
export interface Article {
  id: string
  /** 原新闻标题 */
  title: string
  /** 大白话解读（讲什么） */
  summary: string
  /** 为什么重要 */
  whyImportant: string
  /** 影响谁 */
  impact: string
  /** 所属板块 */
  category: CategoryKey
  /** 信源名称（如 新浪财经） */
  sourceName: string
  /** 原文链接 */
  sourceUrl: string
  /** 原文发布时间 ISO 字符串 */
  publishedAt: string
}

/** 早报板块要点 */
export interface SectionHighlight {
  category: CategoryKey
  /** 该板块一句话要点 */
  headline: string
  /** 该板块今日文章数 */
  count: number
}

/** 每日早报 */
export interface DailyReport {
  /** 日期 YYYY-MM-DD */
  date: string
  /** 今日大势一句话 */
  oneLineSummary: string
  /** 五大板块要点 */
  highlights: SectionHighlight[]
  /** 今日文章总数 */
  articleCount: number
  /** 生成时间 */
  generatedAt: string
}

/** 文章分页返回 */
export interface ArticlePage {
  list: Article[]
  hasMore: boolean
}

/** 免责声明文案 */
export const DISCLAIMER_TEXT =
  '本小程序内容由 AI 根据公开财经资讯自动改写生成，仅作信息整理与知识科普用途，不构成任何投资建议。市场有风险，投资需谨慎。'
